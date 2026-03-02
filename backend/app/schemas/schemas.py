"""
Pydantic schemas for Q Studio Phase 1.1.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# ============ AUTH SCHEMAS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ PROJECT SCHEMAS ============

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ IDENTITY ENGINE SCHEMAS ============

class CharacterCreate(BaseModel):
    name: str
    project_id: UUID
    identity_locked: bool = True
    similarity_threshold: int = 80


class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    master_portrait_url: Optional[str] = None
    identity_locked: Optional[bool] = None
    similarity_threshold: Optional[int] = None


class CharacterResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    master_portrait_url: Optional[str]
    identity_locked: bool
    similarity_threshold: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FaceReferenceCreate(BaseModel):
    character_id: UUID
    image_url: str
    is_master: bool = False


class FaceReferenceResponse(BaseModel):
    id: UUID
    character_id: UUID
    image_url: str
    is_master: bool
    similarity_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterVersionCreate(BaseModel):
    character_id: UUID
    version_name: str = "baseline"
    age: Optional[int] = None
    height: Optional[int] = None
    body_proportions: Optional[Dict[str, Any]] = None
    posture: Optional[str] = None
    hair_style: Optional[str] = None
    skin_tone: Optional[str] = None
    makeup_profile: Optional[Dict[str, Any]] = None
    voice_profile: Optional[Dict[str, Any]] = None
    movement_style: Optional[str] = None


class CharacterVersionResponse(BaseModel):
    id: UUID
    character_id: UUID
    version_name: str
    age: Optional[int]
    height: Optional[int]
    body_proportions: Optional[Dict[str, Any]]
    posture: Optional[str]
    hair_style: Optional[str]
    skin_tone: Optional[str]
    makeup_profile: Optional[Dict[str, Any]]
    voice_profile: Optional[Dict[str, Any]]
    movement_style: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============ SCENE BUILDER SCHEMAS ============

class CinematographyParams(BaseModel):
    """Cinematography parameters for scenes."""
    lens: Optional[str] = "50mm"
    fov: Optional[int] = 50
    aperture: Optional[str] = "f/2.8"
    lighting: Optional[str] = "natural"
    lut: Optional[str] = None
    film_grain: Optional[float] = 0.0
    contrast: Optional[float] = 1.0
    saturation: Optional[float] = 1.0
    temperature: Optional[int] = 0
    camera_movement: Optional[str] = "static"
    camera_speed: Optional[float] = 1.0


class SceneCharacter(BaseModel):
    """Character in a scene with position."""
    character_id: UUID
    position: Dict[str, float] = {"x": 0, "y": 0}
    scale: float = 1.0
    rotation: float = 0.0
    z_index: int = 0


class SceneCreate(BaseModel):
    name: str
    project_id: UUID
    description: Optional[str] = None
    duration: int = 10
    characters: List[SceneCharacter] = []
    cinematography: Optional[Dict[str, Any]] = {}
    scene_data: Optional[Dict[str, Any]] = {}


class SceneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    characters: Optional[List[SceneCharacter]] = None
    cinematography: Optional[Dict[str, Any]] = None
    scene_data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class SceneResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str]
    duration: int
    status: str
    characters: List[Dict[str, Any]]
    cinematography: Dict[str, Any]
    scene_data: Dict[str, Any]
    output_url: Optional[str]
    thumbnail_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ RENDER QUEUE SCHEMAS ============

class RenderJobCreate(BaseModel):
    scene_id: UUID
    provider: str = "stub"
    parameters: Optional[Dict[str, Any]] = {}


class RenderJobUpdate(BaseModel):
    status: Optional[str] = None
    output_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    progress: Optional[int] = None
    error_message: Optional[str] = None


class RenderJobResponse(BaseModel):
    id: UUID
    scene_id: UUID
    status: str
    provider: str
    parameters: Optional[Dict[str, Any]]
    output_url: Optional[str]
    thumbnail_url: Optional[str]
    error_message: Optional[str]
    progress: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ============ EPISODES SCHEMAS ============

class EpisodeCreate(BaseModel):
    name: str
    project_id: UUID
    description: Optional[str] = None
    scene_order: List[UUID] = []


class EpisodeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scene_order: Optional[List[UUID]] = None
    status: Optional[str] = None


class EpisodeResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str]
    scene_order: List[UUID]
    output_url: Optional[str]
    thumbnail_url: Optional[str]
    duration: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExportJobCreate(BaseModel):
    episode_id: UUID
    format: str = "mp4"
    resolution: str = "1080p"
    aspect_ratio: str = "16:9"


class ExportJobResponse(BaseModel):
    id: UUID
    episode_id: UUID
    status: str
    format: str
    resolution: str
    aspect_ratio: str
    output_url: Optional[str]
    error_message: Optional[str]
    progress: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
