"""
AI-specific Pydantic schemas for Q Studio.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


# ============ SCRIPT GENERATION ============

class ScriptGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, description="Describe the film/video you want to create")
    style: str = Field(default="cinematic", description="Script style: cinematic, documentary, commercial, animation")
    max_tokens: int = Field(default=2000, ge=100, le=4000)
    project_id: Optional[UUID] = None


class ScriptGenerateResponse(BaseModel):
    script: Dict[str, Any]
    usage: Dict[str, Any] = {}
    model: str = ""


# ============ IMAGE GENERATION ============

class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=5, description="Image description")
    provider: str = Field(default="flux", description="Provider: dalle, flux")
    style: str = Field(default="cinematic film still", description="Visual style")
    aspect_ratio: str = Field(default="16:9", description="Aspect ratio (for FLUX)")
    size: str = Field(default="1792x1024", description="Image size (for DALL-E)")
    quality: str = Field(default="standard", description="Quality: standard, hd (for DALL-E)")
    model: str = Field(default="schnell", description="FLUX model: schnell, dev, pro")
    face_image_url: Optional[str] = Field(default=None, description="Reference face image URL for face-preserving generation")
    scene_id: Optional[UUID] = None


class ImageGenerateResponse(BaseModel):
    image_url: str
    revised_prompt: str = ""
    prediction_id: str = ""
    provider: str = ""


# ============ VIDEO GENERATION ============

class VideoGenerateRequest(BaseModel):
    image_url: str = Field(..., description="Source image URL for image-to-video")
    prompt: str = Field(default="", description="Motion/action description")
    duration: int = Field(default=5, ge=1, le=10, description="Video duration in seconds")
    resolution: str = Field(default="480p", description="Resolution: 480p, 720p")
    scene_id: Optional[UUID] = None


class VideoGenerateResponse(BaseModel):
    video_url: str
    prediction_id: str = ""
    duration: int = 0


# ============ VOICE GENERATION ============

class VoiceGenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to speak")
    speaker: str = Field(default="v2/en_speaker_6", description="Speaker voice preset")
    character_id: Optional[UUID] = None


class VoiceGenerateResponse(BaseModel):
    audio_url: str
    prediction_id: str = ""


# ============ FACE PORTRAIT ============

class FacePortraitRequest(BaseModel):
    face_image_url: str = Field(..., description="Reference face image URL")
    prompt: str = Field(default="professional headshot", description="Portrait style description")
    style: str = Field(default="photorealistic", description="Style: photorealistic, cinematic, artistic")
    character_id: Optional[UUID] = None


class FacePortraitResponse(BaseModel):
    image_url: str
    prediction_id: str = ""


# ============ SCENE DESCRIPTION ============

class SceneDescriptionRequest(BaseModel):
    scene_id: UUID
    additional_context: str = Field(default="", description="Additional context for the description")


class SceneDescriptionResponse(BaseModel):
    visual_prompt: str = ""
    negative_prompt: str = ""
    style_keywords: List[str] = []
    mood: str = ""
    lighting: str = ""
    color_palette: List[str] = []


# ============ FULL SCENE RENDER (AI Pipeline) ============

class AIRenderRequest(BaseModel):
    scene_id: UUID
    generate_image: bool = Field(default=True, description="Generate storyboard image")
    generate_video: bool = Field(default=True, description="Generate video from image")
    generate_voice: bool = Field(default=False, description="Generate voice for dialogue")
    image_provider: str = Field(default="flux", description="Image provider: dalle, flux")
    video_resolution: str = Field(default="480p", description="Video resolution: 480p, 720p")
    voice_speaker: str = Field(default="v2/en_speaker_6", description="Voice preset")
    face_image_url: Optional[str] = Field(default=None, description="Reference face image URL for face-preserving generation")


class AIRenderResponse(BaseModel):
    scene_id: UUID
    status: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    scene_description: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ============ AI STATUS ============

class AIStatusResponse(BaseModel):
    openai_configured: bool = False
    replicate_configured: bool = False
    available_providers: Dict[str, List[str]] = {}
