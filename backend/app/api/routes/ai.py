"""
AI Generation Routes for Q Studio.
Provides endpoints for script, image, video, voice, and face generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import logging
import os

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
    replicate_ok = bool(os.environ.get("REPLICATE_API_TOKEN", ""))

    providers = {}
    if openai_ok:
        providers["openai"] = ["script_generation", "dalle_images", "scene_descriptions"]
    if replicate_ok:
        providers["replicate"] = ["flux_images", "video_generation", "voice_synthesis", "face_portraits"]

    return AIStatusResponse(
        openai_configured=openai_ok,
        replicate_configured=replicate_ok,
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
    """Generate a video from an image using Wan 2.1 on Replicate."""
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
    """Generate voice audio using Bark on Replicate."""
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
    """Generate a consistent face portrait using InstantID on Replicate."""
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
        replicate_configured = bool(os.environ.get("REPLICATE_API_TOKEN", ""))

        visual_prompt = scene.description or scene.name

        if openai_configured:
            try:
                desc = await ai_service.generate_scene_description(scene_data)
                result.scene_description = desc
                visual_prompt = desc.get("visual_prompt", visual_prompt)
            except Exception as e:
                logger.warning(f"Scene description generation failed, using fallback: {e}")

        # Step 2: Generate image
        if request.generate_image and replicate_configured:
            try:
                if request.image_provider == "dalle" and openai_configured:
                    img = await ai_service.generate_storyboard_image(
                        prompt=visual_prompt,
                        style="cinematic film still",
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
        if request.generate_video and result.image_url and replicate_configured:
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
        if request.generate_voice and replicate_configured:
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
