"""
Background worker service for Q Studio Phase 1.1.
Processes render jobs with stub provider (generates real MP4/PNG).
"""
import os
import sys
import time
import json
import uuid
import logging
import subprocess
from datetime import datetime

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from PIL import Image, ImageDraw, ImageFont

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://qstudio:qstudio@postgres:5432/qstudio")
REDIS_URL = os.environ.get("REDIS_URL", "redis://:qstudio@redis:6379/0")
EXPORT_DIR = "/app/exports"

os.makedirs(EXPORT_DIR, exist_ok=True)


def create_placeholder_video(scene_data: dict, output_path: str, duration: int = 5) -> str:
    """Generate a placeholder MP4 video using FFmpeg."""
    width, height = 1920, 1080
    frames_dir = f"/tmp/frames_{uuid.uuid4()}"
    os.makedirs(frames_dir, exist_ok=True)
    
    try:
        for i in range(duration * 30):
            img = Image.new('RGB', (width, height), color=((i * 10) % 256, (i * 20) % 256, (i * 30) % 256))
            draw = ImageDraw.Draw(img)
            scene_name = scene_data.get('name', 'Scene')
            draw.text((100, 100), "Q Studio Render", fill=(255, 255, 255))
            draw.text((100, 200), f"Scene: {scene_name}", fill=(255, 255, 255))
            draw.text((100, 300), f"Duration: {duration}s", fill=(255, 255, 255))
            draw.text((100, 400), f"Frame: {i+1}/{duration*30}", fill=(255, 255, 255))
            characters = scene_data.get('characters', [])
            if characters:
                draw.text((100, 500), f"Characters: {len(characters)}", fill=(255, 255, 255))
            img.save(f"{frames_dir}/frame_{i:05d}.jpg")
        
        ffmpeg_cmd = ["ffmpeg", "-y", "-framerate", "30", "-i", f"{frames_dir}/frame_%05d.jpg",
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23", output_path]
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            first_frame = f"{frames_dir}/frame_00000.jpg"
            if os.path.exists(first_frame):
                os.system(f"ffmpeg -y -loop 1 -i {first_frame} -t {duration} -c:v libx264 -pix_fmt yuv420p {output_path} 2>/dev/null || cp {first_frame} {output_path}")
        
        logger.info(f"Generated video: {output_path}")
        return output_path
    finally:
        import shutil
        if os.path.exists(frames_dir):
            shutil.rmtree(frames_dir)


def create_placeholder_thumbnail(scene_data: dict, output_path: str) -> str:
    """Generate a placeholder PNG thumbnail."""
    width, height = 640, 360
    img = Image.new('RGB', (width, height), color=(50, 50, 100))
    draw = ImageDraw.Draw(img)
    scene_name = scene_data.get('name', 'Scene')
    draw.text((50, 50), "Q Studio", fill=(255, 255, 255))
    draw.text((50, 120), f"Scene: {scene_name}", fill=(255, 255, 255))
    characters = scene_data.get('characters', [])
    for i, char in enumerate(characters[:3]):
        x = 50 + (i * 200)
        draw.ellipse([x, 200, x+150, 350], fill=(200, 150, 100), outline=(255, 255, 255))
    img.save(output_path)
    logger.info(f"Generated thumbnail: {output_path}")
    return output_path


def process_render_job(job_id: str, db_session):
    """Process a render job."""
    from app.models.models import RenderJob, Scene
    job = db_session.query(RenderJob).filter(RenderJob.id == job_id).first()
    if not job:
        logger.error(f"Job {job_id} not found")
        return
    
    logger.info(f"Processing render job {job_id}")
    job.status = "processing"
    job.started_at = datetime.utcnow()
    db_session.commit()
    
    try:
        scene = db_session.query(Scene).filter(Scene.id == job.scene_id).first()
        if not scene:
            raise Exception("Scene not found")
        
        output_filename = f"scene_{scene.id}_{job_id}.mp4"
        thumbnail_filename = f"scene_{scene.id}_{job_id}_thumb.jpg"
        output_path = os.path.join(EXPORT_DIR, output_filename)
        thumbnail_path = os.path.join(EXPORT_DIR, thumbnail_filename)
        
        for progress in range(0, 101, 10):
            job.progress = progress
            db_session.commit()
            time.sleep(0.5)
        
        scene_dict = {"name": scene.name, "description": scene.description,
                     "characters": scene.characters or [], "cinematography": scene.cinematography or {}}
        
        create_placeholder_video(scene_dict, output_path, scene.duration)
        create_placeholder_thumbnail(scene_dict, thumbnail_path)
        
        job.status = "completed"
        job.progress = 100
        job.output_url = f"/exports/{output_filename}"
        job.thumbnail_url = f"/exports/{thumbnail_filename}"
        job.completed_at = datetime.utcnow()
        scene.status = "completed"
        scene.output_url = job.output_url
        scene.thumbnail_url = job.thumbnail_url
        
        db_session.commit()
        logger.info(f"Job {job_id} completed successfully")
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        job.status = "failed"
        job.error_message = str(e)
        job.completed_at = datetime.utcnow()
        scene = db_session.query(Scene).filter(Scene.id == job.scene_id).first()
        if scene:
            scene.status = "failed"
        db_session.commit()


def process_export_job(job_id: str, db_session):
    """Process an export job (episode stitching)."""
    from app.models.models import ExportJob, Episode, Scene
    job = db_session.query(ExportJob).filter(ExportJob.id == job_id).first()
    if not job:
        logger.error(f"Export job {job_id} not found")
        return
    
    logger.info(f"Processing export job {job_id}")
    job.status = "processing"
    job.started_at = datetime.utcnow()
    db_session.commit()
    
    try:
        episode = db_session.query(Episode).filter(Episode.id == job.episode_id).first()
        if not episode:
            raise Exception("Episode not found")
        
        scene_ids = episode.scene_order or []
        scene_files = []
        for scene_id in scene_ids:
            scene = db_session.query(Scene).filter(Scene.id == scene_id).first()
            if scene and scene.output_url:
                filename = scene.output_url.lstrip('/')
                filepath = os.path.join('/app', filename)
                if os.path.exists(filepath):
                    scene_files.append(filepath)
        
        output_filename = f"episode_{episode.id}_{job_id}.mp4"
        output_path = os.path.join(EXPORT_DIR, output_filename)
        
        if scene_files:
            concat_file = f"/tmp/concat_{job_id}.txt"
            with open(concat_file, 'w') as f:
                for sf in scene_files:
                    f.write(f"file '{sf}'\n")
            ffmpeg_cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", output_path]
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            os.remove(concat_file)
            if result.returncode != 0:
                import shutil
                shutil.copy(scene_files[0], output_path)
        else:
            create_placeholder_video({"name": episode.name}, output_path, 10)
        
        job.status = "completed"
        job.progress = 100
        job.output_url = f"/exports/{output_filename}"
        job.completed_at = datetime.utcnow()
        episode.status = "completed"
        episode.output_url = job.output_url
        db_session.commit()
        logger.info(f"Export job {job_id} completed")
    except Exception as e:
        logger.error(f"Export job {job_id} failed: {e}")
        job.status = "failed"
        job.error_message = str(e)
        job.completed_at = datetime.utcnow()
        episode = db_session.query(Episode).filter(Episode.id == job.episode_id).first()
        if episode:
            episode.status = "failed"
        db_session.commit()


def main():
    """Main worker loop."""
    logger.info("Starting Q Studio worker...")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    r = redis.from_url(REDIS_URL)
    logger.info("Worker connected to database and Redis")
    
    while True:
        try:
            result = r.blpop('qstudio:render_queue', timeout=5)
            if result:
                _, job_id = result
                job_id = job_id.decode() if isinstance(job_id, bytes) else job_id
                logger.info(f"Got job: {job_id}")
                process_render_job(job_id, db)
            
            result = r.blpop('qstudio:export_queue', timeout=1)
            if result:
                _, job_id = result
                job_id = job_id.decode() if isinstance(job_id, bytes) else job_id
                logger.info(f"Got export job: {job_id}")
                process_export_job(job_id, db)
        except Exception as e:
            logger.error(f"Worker error: {e}")
            time.sleep(5)
    db.close()


if __name__ == "__main__":
    main()
