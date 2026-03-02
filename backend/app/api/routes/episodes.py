"""
Episodes - Phase 1.1. Episode management and export.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.models import User, Project, Scene, Episode, RenderJob, ExportJob
from app.schemas.schemas import (
    EpisodeCreate, EpisodeUpdate, EpisodeResponse,
    ExportJobCreate, ExportJobResponse
)
from app.api.routes.auth import get_current_user

router = APIRouter()


@router.get("/episodes", response_model=List[EpisodeResponse])
async def list_episodes(
    project_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Episode).join(Project).filter(Project.user_id == current_user.id)
    if project_id:
        query = query.filter(Episode.project_id == project_id)
    return query.all()


@router.post("/episodes", response_model=EpisodeResponse, status_code=status.HTTP_201_CREATED)
async def create_episode(
    episode_data: EpisodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == episode_data.project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    episode = Episode(
        name=episode_data.name,
        project_id=episode_data.project_id,
        description=episode_data.description,
        scene_order=episode_data.scene_order,
        status="draft"
    )
    db.add(episode)
    db.commit()
    db.refresh(episode)
    return episode


@router.get("/episodes/{episode_id}", response_model=EpisodeResponse)
async def get_episode(
    episode_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    episode = db.query(Episode).join(Project).filter(
        Episode.id == episode_id,
        Project.user_id == current_user.id
    ).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return episode


@router.put("/episodes/{episode_id}", response_model=EpisodeResponse)
async def update_episode(
    episode_id: UUID,
    episode_data: EpisodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    episode = db.query(Episode).join(Project).filter(
        Episode.id == episode_id,
        Project.user_id == current_user.id
    ).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    if episode_data.name is not None:
        episode.name = episode_data.name
    if episode_data.description is not None:
        episode.description = episode_data.description
    if episode_data.scene_order is not None:
        episode.scene_order = episode_data.scene_order
    if episode_data.status is not None:
        episode.status = episode_data.status
    
    db.commit()
    db.refresh(episode)
    return episode


@router.delete("/episodes/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_episode(
    episode_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    episode = db.query(Episode).join(Project).filter(
        Episode.id == episode_id,
        Project.user_id == current_user.id
    ).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    db.delete(episode)
    db.commit()


@router.post("/episodes/{episode_id}/export", response_model=ExportJobResponse)
async def create_export_job(
    episode_id: UUID,
    export_data: ExportJobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    episode = db.query(Episode).join(Project).filter(
        Episode.id == episode_id,
        Project.user_id == current_user.id
    ).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    export_job = ExportJob(
        episode_id=episode_id,
        format=export_data.format,
        resolution=export_data.resolution,
        aspect_ratio=export_data.aspect_ratio,
        status="queued",
        progress=0
    )
    db.add(export_job)
    episode.status = "exporting"
    
    db.commit()
    db.refresh(export_job)
    
    return export_job


@router.get("/export/jobs", response_model=List[ExportJobResponse])
async def list_export_jobs(
    episode_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ExportJob).join(Episode).join(Project).filter(
        Project.user_id == current_user.id
    )
    if episode_id:
        query = query.filter(ExportJob.episode_id == episode_id)
    return query.order_by(ExportJob.created_at.desc()).all()


@router.get("/export/jobs/{job_id}", response_model=ExportJobResponse)
async def get_export_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ExportJob).join(Episode).join(Project).filter(
        ExportJob.id == job_id,
        Project.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Export job not found")
    return job
