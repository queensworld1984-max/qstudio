"""
AI Service Layer for Q Studio.
Integrates OpenAI (scripts, storyboards) and fal.ai (video, face, voice, FLUX images).
"""
import os
import json
import logging
import httpx
import asyncio
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
FAL_KEY = os.environ.get("FAL_KEY", "")

OPENAI_BASE_URL = "https://api.openai.com/v1"
FAL_QUEUE_URL = "https://queue.fal.run"


# ============ OPENAI SERVICES ============

async def generate_script(
    prompt: str,
    style: str = "cinematic",
    max_tokens: int = 2000,
) -> Dict[str, Any]:
    """Generate a film/video script using OpenAI GPT-4."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")

    system_prompt = f"""You are a professional screenwriter and film director. 
Write scripts in {style} style. Include:
- Scene descriptions with visual details
- Character dialogue with emotion cues
- Camera directions and cinematography notes
- Mood and lighting descriptions

Format the output as structured JSON with:
- title: string
- scenes: array of objects with:
  - scene_number: int
  - location: string
  - time_of_day: string
  - description: string
  - characters: array of character names
  - dialogue: array of {{character, line, emotion}}
  - camera_notes: string
  - duration_seconds: int
"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.8,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        try:
            script_data = json.loads(content)
        except json.JSONDecodeError:
            script_data = {"raw_text": content}
        return {
            "script": script_data,
            "usage": data.get("usage", {}),
            "model": data.get("model", "gpt-4o"),
        }


async def generate_storyboard_image(
    prompt: str,
    style: str = "cinematic film still",
    size: str = "1792x1024",
    quality: str = "standard",
) -> Dict[str, Any]:
    """Generate a storyboard image using OpenAI DALL-E 3."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")

    enhanced_prompt = f"{style}, {prompt}, high quality, detailed, professional film production"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/images/generations",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "dall-e-3",
                "prompt": enhanced_prompt,
                "n": 1,
                "size": size,
                "quality": quality,
                "response_format": "url",
            },
        )
        response.raise_for_status()
        data = response.json()
        return {
            "image_url": data["data"][0]["url"],
            "revised_prompt": data["data"][0].get("revised_prompt", ""),
        }


async def generate_scene_description(
    scene_data: Dict[str, Any],
) -> Dict[str, Any]:
    """Use OpenAI to generate a detailed visual description for a scene."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")

    prompt = f"""Based on this scene data, generate a detailed visual description 
suitable for image/video generation:

Scene: {json.dumps(scene_data, default=str)}

Return JSON with:
- visual_prompt: a detailed description for image generation (1-2 paragraphs)
- negative_prompt: what to avoid in the generation
- style_keywords: array of style keywords
- mood: the emotional mood
- lighting: lighting description
- color_palette: array of dominant colors
"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You are a visual director who creates detailed scene descriptions for AI image/video generation."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1000,
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"visual_prompt": content}


# ============ FAL.AI SERVICES ============

async def _fal_submit_and_poll(
    endpoint: str,
    payload: Dict[str, Any],
    max_wait: float = 300.0,
    poll_interval: float = 5.0,
) -> Dict[str, Any]:
    """Submit a job to fal.ai queue and poll until complete."""
    if not FAL_KEY:
        raise ValueError("FAL_KEY not configured")

    headers = {
        "Authorization": f"Key {FAL_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=max_wait + 30, follow_redirects=True) as client:
        # Submit to queue
        response = await client.post(
            f"{FAL_QUEUE_URL}/{endpoint}",
            headers=headers,
            json=payload,
        )

        if response.status_code not in (200, 201):
            raise RuntimeError(f"fal.ai submission failed: {response.status_code} - {response.text[:300]}")

        data = response.json()
        request_id = data.get("request_id")
        response_url = data.get("response_url")
        status_url = data.get("status_url")

        if not request_id:
            # Synchronous response
            return data

        # Poll for completion
        elapsed = 0.0
        while elapsed < max_wait:
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

            try:
                status_resp = await client.get(status_url, headers=headers)
                status_data = status_resp.json()
                status = status_data.get("status", "")

                if status == "COMPLETED":
                    result_resp = await client.get(response_url, headers=headers)
                    if result_resp.status_code == 200:
                        return result_resp.json()
                    else:
                        raise RuntimeError(f"Failed to fetch fal.ai result: {result_resp.status_code}")
                elif status == "FAILED":
                    error = status_data.get("error", "Unknown error")
                    raise RuntimeError(f"fal.ai job failed: {error}")
                # IN_QUEUE or IN_PROGRESS - keep polling
            except httpx.HTTPError as e:
                logger.warning(f"fal.ai poll error: {e}")
                await asyncio.sleep(poll_interval)
                elapsed += poll_interval

        raise TimeoutError(f"fal.ai job timed out after {max_wait}s")


async def generate_image_flux(
    prompt: str,
    aspect_ratio: str = "16:9",
    model: str = "schnell",
) -> Dict[str, Any]:
    """Generate an image using FLUX on fal.ai."""
    size_map = {
        "16:9": "landscape_16_9",
        "9:16": "portrait_16_9",
        "1:1": "square",
        "4:3": "landscape_4_3",
        "3:4": "portrait_4_3",
    }

    model_endpoints = {
        "schnell": "fal-ai/flux/schnell",
        "dev": "fal-ai/flux/dev",
        "pro": "fal-ai/flux-pro/v1.1",
    }

    endpoint = model_endpoints.get(model, model_endpoints["schnell"])
    image_size = size_map.get(aspect_ratio, "landscape_16_9")

    result = await _fal_submit_and_poll(endpoint, {
        "prompt": prompt,
        "image_size": image_size,
        "num_images": 1,
        "enable_safety_checker": False,
    })

    if result and "images" in result:
        images = result["images"]
        if images and len(images) > 0:
            image_url = images[0].get("url", "")
            return {"image_url": image_url, "prediction_id": ""}

    raise RuntimeError("FLUX generation returned no images")


async def generate_video(
    image_url: str,
    prompt: str = "",
    duration: int = 5,
    resolution: str = "480p",
) -> Dict[str, Any]:
    """Generate a video from an image using Wan 2.1 on fal.ai."""
    result = await _fal_submit_and_poll("fal-ai/wan-i2v", {
        "image_url": image_url,
        "prompt": prompt or "cinematic motion, smooth camera movement, high quality",
        "num_frames": min(duration * 16, 81),
        "resolution": resolution,
        "enable_safety_checker": False,
    }, max_wait=600.0)

    if result and "video" in result:
        video = result["video"]
        url = video.get("url", "") if isinstance(video, dict) else str(video)
        return {"video_url": url, "prediction_id": ""}

    if result and "output" in result:
        output = result["output"]
        if isinstance(output, str):
            return {"video_url": output, "prediction_id": ""}

    raise RuntimeError("Video generation returned no output")


async def generate_voice(
    text: str,
    speaker: str = "v2/en_speaker_6",
) -> Dict[str, Any]:
    """Generate voice audio using MiniMax TTS on fal.ai."""
    result = await _fal_submit_and_poll("fal-ai/minimax-tts", {
        "text": text,
    }, max_wait=120.0)

    if result and "audio" in result:
        audio = result["audio"]
        url = audio.get("url", "") if isinstance(audio, dict) else str(audio)
        return {"audio_url": url, "prediction_id": ""}

    raise RuntimeError("Voice generation returned no output")


async def face_swap(
    source_face_url: str,
    target_image_url: str,
) -> Dict[str, Any]:
    """Swap a face from a source image onto a target image using fal.ai.
    
    Uses fal-ai/face-swap which takes a reference face (swap_image_url)
    and blends it onto the target scene (base_image_url).
    """
    result = await _fal_submit_and_poll("fal-ai/face-swap", {
        "base_image_url": target_image_url,
        "swap_image_url": source_face_url,
    }, max_wait=120.0)

    if result and "image" in result:
        image = result["image"]
        url = image.get("url", "") if isinstance(image, dict) else str(image)
        return {"image_url": url, "prediction_id": ""}

    raise RuntimeError("Face swap returned no output")


async def generate_image_with_face(
    prompt: str,
    face_image_url: str,
    aspect_ratio: str = "16:9",
    model: str = "schnell",
) -> Dict[str, Any]:
    """Generate a scene image with FLUX, then swap in the reference face.
    
    Two-step pipeline:
    1. FLUX generates the scene (text-to-image)
    2. Face swap replaces the character's face with the reference face
    """
    # Step 1: Generate scene image with FLUX
    logger.info(f"Step 1: Generating scene image with FLUX ({model})...")
    flux_result = await generate_image_flux(
        prompt=prompt,
        aspect_ratio=aspect_ratio,
        model=model,
    )
    scene_image_url = flux_result["image_url"]
    logger.info(f"Scene image generated: {scene_image_url[:80]}...")

    # Step 2: Swap the reference face onto the scene character
    logger.info("Step 2: Swapping reference face onto scene character...")
    swap_result = await face_swap(
        source_face_url=face_image_url,
        target_image_url=scene_image_url,
    )
    logger.info(f"Face swap complete: {swap_result['image_url'][:80]}...")

    return {
        "image_url": swap_result["image_url"],
        "original_scene_url": scene_image_url,
        "prediction_id": "",
    }


async def generate_face_portrait(
    face_image_url: str,
    prompt: str,
    style: str = "photorealistic",
) -> Dict[str, Any]:
    """Generate a consistent face portrait using IP-Adapter on fal.ai."""
    result = await _fal_submit_and_poll("fal-ai/ip-adapter-face-id", {
        "image_url": face_image_url,
        "prompt": f"{style} portrait, {prompt}, highly detailed, professional",
        "negative_prompt": "blurry, low quality, distorted, deformed",
        "num_inference_steps": 30,
    }, max_wait=120.0)

    if result and "images" in result:
        images = result["images"]
        if images and len(images) > 0:
            image_url = images[0].get("url", "")
            return {"image_url": image_url, "prediction_id": ""}

    raise RuntimeError("Face portrait generation returned no output")
