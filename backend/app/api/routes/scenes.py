"""
Scene Builder - Module J (Phase 1.1).
Creates scenes with multi-character support and cinematography parameters.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import json

from app.core.database import get_db
from app.models.models import User, Project, Scene, Character, RenderJob
from app.schemas.schemas import (
    SceneCreate, SceneUpdate, SceneResponse,
    RenderJobCreate, RenderJobResponse
)
from app.api.routes.auth import get_current_user

router = APIRouter()


@router.get("/scenes", response_model=List[SceneResponse])
async def list_scenes(
    project_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all scenes for a project."""
    query = db.query(Scene).join(Project).filter(Project.user_id == current_user.id)
    if project_id:
        query = query.filter(Scene.project_id == project_id)
    return query.all()


@router.post("/scenes", response_model=SceneResponse, status_code=status.HTTP_201_CREATED)
async def create_scene(
    scene_data: SceneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new scene with multi-character support."""
    project = db.query(Project).filter(
        Project.id == scene_data.project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    character_ids = [c.character_id for c in scene_data.characters]
    if character_ids:
        characters = db.query(Character).filter(
            Character.id.in_(character_ids),
            Character.project_id == scene_data.project_id
        ).all()
        if len(characters) != len(character_ids):
            raise HTTPException(status_code=400, detail="One or more characters not found in project")
    
    scene = Scene(
        name=scene_data.name,
        project_id=scene_data.project_id,
        description=scene_data.description,
        duration=scene_data.duration,
        characters=[c.model_dump() for c in scene_data.characters],
        cinematography=scene_data.cinematography,
        scene_data=scene_data.scene_data,
        status="draft"
    )
    db.add(scene)
    db.commit()
    db.refresh(scene)
    return scene


@router.get("/scenes/{scene_id}", response_model=SceneResponse)
async def get_scene(
    scene_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get scene details."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == scene_id,
        Project.user_id == current_user.id
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.put("/scenes/{scene_id}", response_model=SceneResponse)
async def update_scene(
    scene_id: UUID,
    scene_data: SceneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update scene."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == scene_id,
        Project.user_id == current_user.id
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    if scene_data.name is not None:
        scene.name = scene_data.name
    if scene_data.description is not None:
        scene.description = scene_data.description
    if scene_data.duration is not None:
        scene.duration = scene_data.duration
    if scene_data.characters is not None:
        scene.characters = [c.model_dump() for c in scene_data.characters]
    if scene_data.cinematography is not None:
        scene.cinematography = scene_data.cinematography
    if scene_data.scene_data is not None:
        scene.scene_data = scene_data.scene_data
    if scene_data.status is not None:
        scene.status = scene_data.status
    
    db.commit()
    db.refresh(scene)
    return scene


@router.delete("/scenes/{scene_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scene(
    scene_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scene."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == scene_id,
        Project.user_id == current_user.id
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    db.delete(scene)
    db.commit()


# ============ RENDER QUEUE ============

@router.post("/scenes/{scene_id}/render", response_model=RenderJobResponse)
async def create_render_job(
    scene_id: UUID,
    job_data: RenderJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a render job for a scene."""
    scene = db.query(Scene).join(Project).filter(
        Scene.id == scene_id,
        Project.user_id == current_user.id
    ).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    if scene.project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    render_job = RenderJob(
        scene_id=scene_id,
        provider=job_data.provider,
        parameters=job_data.parameters or {},
        status="queued",
        progress=0
    )
    db.add(render_job)
    scene.status = "rendering"
    
    db.commit()
    db.refresh(render_job)
    
    try:
        import redis
        r = redis.from_url("redis://:qstudio@redis:6379/0")
        r.rpush("qstudio:render_queue", str(render_job.id))
    except Exception as e:
        print(f"Redis queue error: {e}")
    
    return render_job


@router.get("/render/jobs", response_model=List[RenderJobResponse])
async def list_render_jobs(
    scene_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List render jobs."""
    query = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id
    )
    if scene_id:
        query = query.filter(RenderJob.scene_id == scene_id)
    return query.order_by(RenderJob.created_at.desc()).all()


@router.get("/render/jobs/{job_id}", response_model=RenderJobResponse)
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


@router.get("/render/queue-status")
async def get_queue_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get render queue status."""
    total = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id
    ).count()
    
    queued = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id,
        RenderJob.status == "queued"
    ).count()
    
    processing = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id,
        RenderJob.status == "processing"
    ).count()
    
    completed = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id,
        RenderJob.status == "completed"
    ).count()
    
    failed = db.query(RenderJob).join(Scene).join(Project).filter(
        Project.user_id == current_user.id,
        RenderJob.status == "failed"
    ).count()
    
    return {
        "total": total,
        "queued": queued,
        "processing": processing,
        "completed": completed,
        "failed": failed
    }
