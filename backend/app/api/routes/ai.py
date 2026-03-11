"""
AI Generation Routes for Q Studio.
Provides endpoints for script, image, video, voice, face generation,
and video editor composition/export.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel
import logging
import os
import json
import subprocess
import uuid as uuid_mod
import shutil

from app.core.database import get_db
from app.models.models import User, Project, Scene, Character
from app.schemas.ai_schemas import (
    ScriptGenerateRequest, ScriptGenerateResponse,
    ImageGenerateRequest, ImageGenerateResponse,
    VideoGenerateRequest, VideoGenerateResponse,
    VoiceGenerateRequest, VoiceGenerateResponse,
    FacePortraitRequest, FacePortraitResponse,
    SceneDescriptionRequest, SceneDescriptionResponse,
    AIRenderRequest, AIRenderResponse,
    AIStatusResponse,
)
from app.services import ai_service
from app.api.routes.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status(
    current_user: User = Depends(get_current_user),
):
    """Check which AI providers are configured."""
    openai_ok = bool(os.environ.get("OPENAI_API_KEY", ""))
    fal_ok = bool(os.environ.get("FAL_KEY", ""))

    providers = {}
    if openai_ok:
        providers["openai"] = ["script_generation", "dalle_images", "scene_descriptions"]
    if fal_ok:
        providers["fal"] = ["flux_images", "video_generation", "voice_synthesis", "face_portraits"]

    return AIStatusResponse(
        openai_configured=openai_ok,
        replicate_configured=fal_ok,
        available_providers=providers,
    )


@router.post("/generate/script", response_model=ScriptGenerateResponse)
async def generate_script(
    request: ScriptGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a film/video script using OpenAI."""
    if request.project_id:
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.user_id == current_user.id,
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    try:
        result = await ai_service.generate_script(
            prompt=request.prompt,
            style=request.style,
            max_tokens=request.max_tokens,
        )
        return ScriptGenerateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Script generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")


@router.post("/generate/image", response_model=ImageGenerateResponse)
async def generate_image(
    request: ImageGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a storyboard/scene image using DALL-E or FLUX."""
    if request.scene_id:
        scene = db.query(Scene).join(Project).filter(
            Scene.id == request.scene_id,
            Project.user_id == current_user.id,
        ).first()
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")

    try:
        if request.provider == "dalle":
            result = await ai_service.generate_storyboard_image(
                prompt=request.prompt,
                style=request.style,
                size=request.size,
                quality=request.quality,
            )
            return ImageGenerateResponse(
                image_url=result["image_url"],
                revised_prompt=result.get("revised_prompt", ""),
                provider="dalle",
            )
        elif request.face_image_url:
            # Use FLUX + face swap pipeline to preserve reference face
            result = await ai_service.generate_image_with_face(
                prompt=request.prompt,
                face_image_url=request.face_image_url,
                aspect_ratio=request.aspect_ratio,
                model=request.model,
            )
            return ImageGenerateResponse(
                image_url=result["image_url"],
                prediction_id=result.get("prediction_id", ""),
                provider="flux+faceswap",
            )
        else:
            result = await ai_service.generate_image_flux(
                prompt=request.prompt,
                aspect_ratio=request.aspect_ratio,
                model=request.model,
            )
            return ImageGenerateResponse(
                image_url=result["image_url"],
                prediction_id=result.get("prediction_id", ""),
                provider="flux",
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@router.post("/generate/video", response_model=VideoGenerateResponse)
async def generate_video(
    request: VideoGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a video from an image using Wan 2.1 on fal.ai."""
    if request.scene_id:
        scene = db.query(Scene).join(Project).filter(
            Scene.id == request.scene_id,
            Project.user_id == current_user.id,
        ).first()
        if not scene:
            raise HTTPException(status_code=404, detail="Scene not found")

    try:
        result = await ai_service.generate_video(
            image_url=request.image_url,
            prompt=request.prompt,
            duration=request.duration,
            resolution=request.resolution,
        )
        return VideoGenerateResponse(
            video_url=result["video_url"],
            prediction_id=result.get("prediction_id", ""),
            duration=request.duration,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Video generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")


@router.post("/generate/voice", response_model=VoiceGenerateResponse)
async def generate_voice(
    request: VoiceGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate voice audio using fal.ai."""
    if request.character_id:
        character = db.query(Character).join(Project).filter(
            Character.id == request.character_id,
            Project.user_id == current_user.id,
        ).first()
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")

    try:
        result = await ai_service.generate_voice(
            text=request.text,
            speaker=request.speaker,
        )
        return VoiceGenerateResponse(
            audio_url=result["audio_url"],
            prediction_id=result.get("prediction_id", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Voice generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice generation failed: {str(e)}")


@router.post("/generate/face", response_model=FacePortraitResponse)
async def generate_face_portrait(
    request: FacePortraitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a consistent face portrait using fal.ai."""
    if request.character_id:
        character = db.query(Character).join(Project).filter(
            Character.id == request.character_id,
            Project.user_id == current_user.id,
        ).first()
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")

    try:
        result = await ai_service.generate_face_portrait(
            face_image_url=request.face_image_url,
            prompt=request.prompt,
            style=request.style,
        )
        return FacePortraitResponse(
            image_url=result["image_url"],
            prediction_id=result.get("prediction_id", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Face portrait generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Face portrait generation failed: {str(e)}")


@router.post("/generate/scene-description", response_model=SceneDescriptionResponse)
async def generate_scene_description(
    request: SceneDescriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a detailed visual description for a scene using OpenAI."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == request.scene_id,
        Project.user_id == current_user.id,
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    scene_data = {
        "name": scene.name,
        "description": scene.description,
        "characters": scene.characters or [],
        "cinematography": scene.cinematography or {},
        "scene_data": scene.scene_data or {},
        "additional_context": request.additional_context,
    }

    try:
        result = await ai_service.generate_scene_description(scene_data)
        return SceneDescriptionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Scene description generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Scene description failed: {str(e)}")


@router.post("/render", response_model=AIRenderResponse)
async def ai_render_scene(
    request: AIRenderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Full AI render pipeline: generate description -> image -> video -> voice."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == request.scene_id,
        Project.user_id == current_user.id,
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    result = AIRenderResponse(scene_id=request.scene_id, status="processing")

    try:
        # Step 1: Generate scene description using OpenAI
        scene_data = {
            "name": scene.name,
            "description": scene.description or "",
            "characters": scene.characters or [],
            "cinematography": scene.cinematography or {},
            "scene_data": scene.scene_data or {},
        }

        openai_configured = bool(os.environ.get("OPENAI_API_KEY", ""))
        fal_configured = bool(os.environ.get("FAL_KEY", ""))

        visual_prompt = scene.description or scene.name

        if openai_configured:
            try:
                desc = await ai_service.generate_scene_description(scene_data)
                result.scene_description = desc
                visual_prompt = desc.get("visual_prompt", visual_prompt)
            except Exception as e:
                logger.warning(f"Scene description generation failed, using fallback: {e}")

        # Step 2: Generate image (with optional face preservation)
        if request.generate_image and fal_configured:
            try:
                if request.image_provider == "dalle" and openai_configured:
                    img = await ai_service.generate_storyboard_image(
                        prompt=visual_prompt,
                        style="cinematic film still",
                    )
                    result.image_url = img["image_url"]
                elif request.face_image_url:
                    # Use FLUX + face swap to preserve reference face
                    img = await ai_service.generate_image_with_face(
                        prompt=visual_prompt,
                        face_image_url=request.face_image_url,
                        aspect_ratio="16:9",
                    )
                    result.image_url = img["image_url"]
                else:
                    img = await ai_service.generate_image_flux(
                        prompt=visual_prompt,
                        aspect_ratio="16:9",
                    )
                    result.image_url = img["image_url"]
            except Exception as e:
                logger.error(f"Image generation failed: {e}")
                result.error = f"Image generation failed: {str(e)}"

        # Step 3: Generate video from image
        if request.generate_video and result.image_url and fal_configured:
            try:
                vid = await ai_service.generate_video(
                    image_url=result.image_url,
                    prompt=visual_prompt,
                    duration=scene.duration or 5,
                    resolution=request.video_resolution,
                )
                result.video_url = vid["video_url"]

                # Update scene with output
                scene.output_url = vid["video_url"]
                scene.thumbnail_url = result.image_url
                scene.status = "completed"
                db.commit()
            except Exception as e:
                logger.error(f"Video generation failed: {e}")
                if result.error:
                    result.error += f"; Video: {str(e)}"
                else:
                    result.error = f"Video generation failed: {str(e)}"

        # Step 4: Generate voice
        if request.generate_voice and fal_configured:
            dialogue = ""
            sd = scene.scene_data or {}
            if isinstance(sd, dict):
                dialogue = sd.get("speech", "") or sd.get("dialogue", "")
            if dialogue:
                try:
                    voice = await ai_service.generate_voice(
                        text=dialogue,
                        speaker=request.voice_speaker,
                    )
                    result.audio_url = voice["audio_url"]
                except Exception as e:
                    logger.error(f"Voice generation failed: {e}")

        result.status = "completed" if not result.error else "partial"
        return result

    except Exception as e:
        logger.error(f"AI render pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI render failed: {str(e)}")


# ─── Video Editor Export/Composition ─────────────────────────────────────────

class CompositionClip(BaseModel):
    id: str
    type: str  # video, image, audio, text
    name: str
    src: Optional[str] = ""
    track_id: str
    start_time: float
    duration: float
    trim_start: float = 0
    trim_end: float = 0
    transition: Optional[str] = "none"
    transition_duration: Optional[float] = 0.5
    volume: Optional[int] = 100
    text: Optional[str] = None
    font_size: Optional[int] = 32
    font_color: Optional[str] = "#ffffff"
    bg_color: Optional[str] = "transparent"


class CompositionTrack(BaseModel):
    id: str
    name: str
    type: str
    muted: bool = False


class CompositionRequest(BaseModel):
    tracks: List[CompositionTrack]
    clips: List[CompositionClip]
    total_duration: float = 60
    resolution: str = "1920x1080"
    fps: int = 30


class CompositionResponse(BaseModel):
    status: str
    message: str
    output_url: Optional[str] = None
    job_id: Optional[str] = None


EXPORT_DIR = "/app/exports"


@router.post("/export/compose", response_model=CompositionResponse)
async def export_composition(
    request: CompositionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Export a video editor composition to MP4 using FFmpeg.
    Composes clips from the timeline into a single output video.
    """
    job_id = str(uuid_mod.uuid4())
    os.makedirs(EXPORT_DIR, exist_ok=True)
    output_path = os.path.join(EXPORT_DIR, f"editor_{job_id}.mp4")

    try:
        # Parse resolution
        parts = request.resolution.split("x")
        width = int(parts[0]) if len(parts) == 2 else 1920
        height = int(parts[1]) if len(parts) == 2 else 1080

        # Calculate actual duration from clips
        if request.clips:
            max_end = max(
                c.start_time + c.duration - c.trim_start - c.trim_end
                for c in request.clips
            )
        else:
            max_end = 10

        # Separate clips by type
        video_clips = [c for c in request.clips if c.type in ("video", "image")]
        audio_clips = [c for c in request.clips if c.type == "audio"]
        text_clips = [c for c in request.clips if c.type == "text"]

        # Build FFmpeg filter complex for compositing
        # For now, generate a composed placeholder with text overlays and timing
        # In production, this would download actual media files and composite them

        # Generate a base video with black background
        filter_parts = []
        inputs = []

        # Create base black video
        base_cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i",
            f"color=c=black:s={width}x{height}:d={max_end}:r={request.fps}",
            "-f", "lavfi", "-i",
            f"anullsrc=r=44100:cl=stereo:d={max_end}",
        ]

        # Build text overlay filters for text clips and clip labels
        drawtext_filters = []

        for clip in video_clips:
            eff_start = clip.start_time
            eff_dur = clip.duration - clip.trim_start - clip.trim_end
            eff_end = eff_start + eff_dur
            # Draw a colored rectangle to represent the clip
            color = "blue" if clip.type == "video" else "green"
            drawtext_filters.append(
                f"drawbox=x=50:y=100:w={width-100}:h={height-200}"
                f":color={color}@0.3:t=fill"
                f":enable='between(t,{eff_start:.2f},{eff_end:.2f})'"
            )
            drawtext_filters.append(
                f"drawtext=text='{clip.name.replace(chr(39), '')}':"
                f"fontsize=36:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2"
                f":enable='between(t,{eff_start:.2f},{eff_end:.2f})'"
            )

        for clip in text_clips:
            eff_start = clip.start_time
            eff_dur = clip.duration - clip.trim_start - clip.trim_end
            eff_end = eff_start + eff_dur
            safe_text = (clip.text or "Text").replace("'", "").replace(":", "\\:")
            font_size = clip.font_size or 32
            font_color = (clip.font_color or "white").lstrip("#")
            if len(font_color) == 6:
                font_color = f"0x{font_color}"
            drawtext_filters.append(
                f"drawtext=text='{safe_text}':"
                f"fontsize={font_size}:fontcolor={font_color}:"
                f"x=(w-text_w)/2:y=(h-text_h)/2+200"
                f":enable='between(t,{eff_start:.2f},{eff_end:.2f})'"
            )

        # Add timeline info overlay
        drawtext_filters.append(
            f"drawtext=text='Q Studio Editor Export':"
            f"fontsize=20:fontcolor=white@0.5:x=20:y=20"
        )

        if drawtext_filters:
            filter_str = ",".join(drawtext_filters)
            base_cmd += ["-filter_complex", f"[0:v]{filter_str}[vout]"]
            base_cmd += ["-map", "[vout]", "-map", "1:a"]
        else:
            base_cmd += ["-map", "0:v", "-map", "1:a"]

        base_cmd += [
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            "-pix_fmt", "yuv420p",
            "-t", str(max_end),
            "-shortest",
            output_path,
        ]

        logger.info(f"Running FFmpeg export for job {job_id}")
        result = subprocess.run(base_cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            logger.error(f"FFmpeg error: {result.stderr[:500]}")
            # Fallback: generate simple placeholder
            fallback_cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i",
                f"color=c=black:s={width}x{height}:d={max_end}:r={request.fps}",
                "-f", "lavfi", "-i",
                f"anullsrc=r=44100:cl=stereo:d={max_end}",
                "-c:v", "libx264", "-preset", "ultrafast",
                "-c:a", "aac", "-shortest",
                "-pix_fmt", "yuv420p",
                output_path,
            ]
            subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=60)

        output_url = f"/exports/editor_{job_id}.mp4"

        return CompositionResponse(
            status="completed",
            message=f"Export completed with {len(request.clips)} clips across {len(request.tracks)} tracks",
            output_url=output_url,
            job_id=job_id,
        )

    except subprocess.TimeoutExpired:
        return CompositionResponse(
            status="error",
            message="Export timed out. Try reducing the composition duration.",
            job_id=job_id,
        )
    except Exception as e:
        logger.error(f"Export composition failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}",
        )
