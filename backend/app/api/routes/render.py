"""
Render Queue - Phase 1.1.
Manages render jobs with polling support.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
import time
import random
import os

from app.core.database import get_db
from app.models.models import User, Project, Scene, RenderJob
from app.schemas.schemas import RenderJobCreate, RenderJobResponse
from app.api.routes.auth import get_current_user

router = APIRouter()

# Stub output directory
OUTPUT_DIR = "/app/exports"


@router.get("/jobs", response_model=List[RenderJobResponse])
async def list_render_jobs(
    project_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all render jobs."""
    query = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id
    )
    if project_id:
        query = query.filter(Scene.project_id == project_id)
    return query.order_by(RenderJob.created_at.desc()).all()


@router.post("/jobs", response_model=RenderJobResponse, status_code=status.HTTP_201_CREATED)
async def create_render_job(
    job_data: RenderJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new render job."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == job_data.scene_id,
        Project.user_id == current_user.id
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    job = RenderJob(
        scene_id=job_data.scene_id,
        job_type=job_data.job_type,
        status="queued",
        progress=0,
        priority=job_data.priority
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return job


@router.get("/jobs/{job_id}", response_model=RenderJobResponse)
async def get_render_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get render job status."""
    job = db.query(RenderJob).join(Scene).join(Project).filter(
        RenderJob.id == job_id,
        Project.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    return job


@router.post("/jobs/{job_id}/start")
async def start_render_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start processing a render job (stub - generates dummy output)."""
    job = db.query(RenderJob).join(Scene).join(Project).filter(
        RenderJob.id == job_id,
        Project.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    if job.status != "queued":
        raise HTTPException(status_code=400, detail="Job already started")
    
    job.status = "processing"
    job.started_at = datetime.utcnow()
    db.commit()
    
    # Simulate render processing
    try:
        # Stub: generate dummy output file
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_path = os.path.join(OUTPUT_DIR, f"render_{job.id}.mp4")
        
        # Create a dummy file (in real implementation, this would be FFmpeg processing)
        with open(output_path, "wb") as f:
            f.write(b"MP4_STUB_OUTPUT")
        
        # Simulate progress
        for i in range(1, 101, 10):
            job.progress = i
            db.commit()
            time.sleep(0.5)
        
        job.status = "completed"
        job.progress = 100
        job.output_url = f"/exports/render_{job.id}.mp4"
        job.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Render failed: {str(e)}")
    
    return {"status": "completed", "job_id": str(job.id), "output": job.output_url}


@router.post("/jobs/{job_id}/poll")
async def poll_render_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Poll render job status."""
    job = db.query(RenderJob).join(Scene).join(Project).filter(
        RenderJob.id == job_id,
        Project.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    return {
        "job_id": str(job.id),
        "status": job.status,
        "progress": job.progress,
        "output_url": job.output_url,
        "error_message": job.error_message
    }


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_render_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a render job."""
    job = db.query(RenderJob).join(Scene).join(Project).filter(
        RenderJob.id == job_id,
        Project.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Render job not found")
    
    db.delete(job)
    db.commit()
