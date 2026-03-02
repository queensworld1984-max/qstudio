"""
Identity Engine - Module B (Phase 1.1).
Manages character identity with face references and master portrait.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import os
import uuid
import json

from app.core.database import get_db
from app.models.models import User, Project, Character, FaceReference, CharacterVersion
from app.schemas.schemas import (
    CharacterCreate, CharacterUpdate, CharacterResponse,
    FaceReferenceCreate, FaceReferenceResponse,
    CharacterVersionCreate, CharacterVersionResponse
)
from app.api.routes.auth import get_current_user

router = APIRouter()

# Upload directory
UPLOAD_DIR = "/app/uploads/faces"


@router.get("/characters", response_model=List[CharacterResponse])
async def list_characters(
    project_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all characters for a project."""
    query = db.query(Character).join(Project).filter(Project.user_id == current_user.id)
    if project_id:
        query = query.filter(Character.project_id == project_id)
    return query.all()


@router.post("/characters", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def create_character(
    character_data: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new character."""
    # Verify project belongs to user
    project = db.query(Project).filter(
        Project.id == character_data.project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    character = Character(
        name=character_data.name,
        project_id=character_data.project_id,
        identity_locked=character_data.identity_locked,
        similarity_threshold=character_data.similarity_threshold
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return character


@router.get("/characters/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get character details."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.put("/characters/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: UUID,
    character_data: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update character."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    if character_data.name is not None:
        character.name = character_data.name
    if character_data.master_portrait_url is not None:
        character.master_portrait_url = character_data.master_portrait_url
    if character_data.identity_locked is not None:
        character.identity_locked = character_data.identity_locked
    if character_data.similarity_threshold is not None:
        character.similarity_threshold = character_data.similarity_threshold
    
    db.commit()
    db.refresh(character)
    return character


@router.delete("/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    character_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a character."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    db.delete(character)
    db.commit()


# ============ FACE REFERENCES ============

@router.post("/characters/{character_id}/faces", response_model=FaceReferenceResponse)
async def upload_face_reference(
    character_id: UUID,
    image_url: str = Form(...),
    is_master: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a face reference to a character."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # If this is master, unset other masters
    if is_master:
        for ref in character.face_references:
            ref.is_master = False
    
    face_ref = FaceReference(
        character_id=character_id,
        image_url=image_url,
        is_master=is_master,
        similarity_score=1.0 if is_master else 0.95  # Simulated score
    )
    db.add(face_ref)
    
    # If master, update character's master_portrait_url
    if is_master:
        character.master_portrait_url = image_url
    
    db.commit()
    db.refresh(face_ref)
    return face_ref


@router.get("/characters/{character_id}/faces", response_model=List[FaceReferenceResponse])
async def list_face_references(
    character_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all face references for a character."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character.face_references


@router.delete("/faces/{face_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_face_reference(
    face_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a face reference."""
    face_ref = db.query(FaceReference).join(Character).join(Project).filter(
        FaceReference.id == face_id,
        Project.user_id == current_user.id
    ).first()
    if not face_ref:
        raise HTTPException(status_code=404, detail="Face reference not found")
    
    db.delete(face_ref)
    db.commit()


@router.post("/characters/{character_id}/set-master/{face_id}")
async def set_master_portrait(
    character_id: UUID,
    face_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set master portrait for a character."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    face_ref = db.query(FaceReference).filter(
        FaceReference.id == face_id,
        FaceReference.character_id == character_id
    ).first()
    if not face_ref:
        raise HTTPException(status_code=404, detail="Face reference not found")
    
    # Unset all masters
    for ref in character.face_references:
        ref.is_master = False
    
    # Set new master
    face_ref.is_master = True
    character.master_portrait_url = face_ref.image_url
    
    db.commit()
    return {"message": "Master portrait updated", "master_portrait_url": face_ref.image_url}


# ============ CHARACTER VERSIONS ============

@router.get("/characters/{character_id}/versions", response_model=List[CharacterVersionResponse])
async def list_character_versions(
    character_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all versions of a character."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character.versions


@router.post("/characters/{character_id}/versions", response_model=CharacterVersionResponse)
async def create_character_version(
    character_id: UUID,
    version_data: CharacterVersionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new character version."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    version = CharacterVersion(
        character_id=character_id,
        version_name=version_data.version_name,
        age=version_data.age,
        height=version_data.height,
        body_proportions=version_data.body_proportions,
        posture=version_data.posture,
        hair_style=version_data.hair_style,
        skin_tone=version_data.skin_tone,
        makeup_profile=version_data.makeup_profile,
        voice_profile=version_data.voice_profile,
        movement_style=version_data.movement_style
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


# ============ IDENTITY VERIFICATION ============

@router.post("/verify-identity")
async def verify_identity(
    character_id: UUID,
    image_url: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify if an image matches the character's identity."""
    character = db.query(Character).join(Project).filter(
        Character.id == character_id,
        Project.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    if not character.identity_locked:
        return {"verified": True, "score": 1.0, "message": "Identity lock is disabled"}
    
    # Simulated verification - in production, use face recognition
    # For demo, return a score between 0.8-1.0
    import random
    score = round(random.uniform(0.8, 1.0), 2)
    
    verified = score >= (character.similarity_threshold / 100.0)
    
    return {
        "verified": verified,
        "score": score,
        "threshold": character.similarity_threshold / 100.0,
        "message": "Identity verified" if verified else "Identity mismatch - drift detected"
    }
