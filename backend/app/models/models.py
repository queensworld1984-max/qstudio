"""
Database models for Q Studio Phase 1.1.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    """User model for authentication and multi-tenancy."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="user")  # user, editor, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    """Refresh token model for JWT authentication."""
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


class Project(Base):
    """Project model for user workspace isolation."""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="draft")  # draft, active, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="projects")
    characters = relationship("Character", back_populates="project", cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    episodes = relationship("Episode", back_populates="project", cascade="all, delete-orphan")


# ============ IDENTITY ENGINE ============

class Character(Base):
    """Character/Identity model - Module B."""
    __tablename__ = "characters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    master_portrait_url = Column(String(500))
    identity_locked = Column(Boolean, default=True)
    similarity_threshold = Column(Integer, default=80)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="characters")
    face_references = relationship("FaceReference", back_populates="character", cascade="all, delete-orphan")
    versions = relationship("CharacterVersion", back_populates="character", cascade="all, delete-orphan")


class FaceReference(Base):
    """Face reference images for identity verification."""
    __tablename__ = "face_references"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_master = Column(Boolean, default=False)
    similarity_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    character = relationship("Character", back_populates="face_references")


class CharacterVersion(Base):
    """Character version model for different states."""
    __tablename__ = "character_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    version_name = Column(String(50), nullable=False)  # baseline, aged, injured, sick, recovery
    age = Column(Integer)
    height = Column(Integer)  # cm
    body_proportions = Column(JSON)  # dict
    posture = Column(String(50))
    hair_style = Column(String(100))
    skin_tone = Column(String(50))
    makeup_profile = Column(JSON)  # dict
    voice_profile = Column(JSON)  # dict
    movement_style = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    character = relationship("Character", back_populates="versions")


# ============ SCENE BUILDER ============

class Scene(Base):
    """Scene model with multi-character support."""
    __tablename__ = "scenes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    duration = Column(Integer, default=10)  # seconds
    status = Column(String(50), default="draft")  # draft, rendering, completed, failed
    
    # Multi-character support - JSON array of character IDs with positions
    characters = Column(JSON, default=list)  # [{"character_id": "...", "position": {"x": 0, "y": 0}, "scale": 1.0}]
    
    # Cinematography parameters
    cinematography = Column(JSON, default=dict)  # {lens, fov, lighting, lut, film_grain, etc.}
    
    # Scene data
    scene_data = Column(JSON, default=dict)  # {space, wardrobe, makeup, emotion, action, speech}
    
    # Output
    output_url = Column(String(500))
    thumbnail_url = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="scenes")
    render_jobs = relationship("RenderJob", back_populates="scene", cascade="all, delete-orphan")


class RenderJob(Base):
    """Render job model with queue support."""
    __tablename__ = "render_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    scene_id = Column(UUID(as_uuid=True), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="queued")  # queued, processing, completed, failed
    provider = Column(String(50), default="stub")  # stub, openai, runway, etc.
    parameters = Column(JSON)  # render parameters
    output_url = Column(String(500))
    thumbnail_url = Column(String(500))
    error_message = Column(Text)
    progress = Column(Integer, default=0)  # 0-100
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scene = relationship("Scene", back_populates="render_jobs")


# ============ EPISODES ============

class Episode(Base):
    """Episode model for stitching scenes."""
    __tablename__ = "episodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    scene_order = Column(JSON, default=list)  # Ordered list of scene IDs
    
    # Output
    output_url = Column(String(500))
    thumbnail_url = Column(String(500))
    duration = Column(Integer, default=0)  # total seconds
    
    status = Column(String(50), default="draft")  # draft, exporting, completed, failed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="episodes")
    export_jobs = relationship("ExportJob", back_populates="episode", cascade="all, delete-orphan")


class ExportJob(Base):
    """Export job for episode stitching."""
    __tablename__ = "export_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=func.gen_random_uuid())
    episode_id = Column(UUID(as_uuid=True), ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="queued")  # queued, processing, completed, failed
    format = Column(String(20), default="mp4")  # mp4, webm, mov
    resolution = Column(String(20), default="1080p")  # 1080p, 4k
    aspect_ratio = Column(String(10), default="16:9")  # 16:9, 9:16, 1:1
    output_url = Column(String(500))
    error_message = Column(Text)
    progress = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    episode = relationship("Episode", back_populates="export_jobs")
