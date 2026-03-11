"""
AI Service Layer for Q Studio.
Integrates OpenAI (scripts, storyboards) and Replicate (video, face, voice).
"""
import os
import json
import logging
import httpx
import time
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")

OPENAI_BASE_URL = "https://api.openai.com/v1"
REPLICATE_BASE_URL = "https://api.replicate.com/v1"


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


# ============ REPLICATE SERVICES ============

async def _run_replicate_model(
    model_version: str,
    input_data: Dict[str, Any],
    poll_interval: float = 2.0,
    max_wait: float = 300.0,
) -> Dict[str, Any]:
    """Run a Replicate model and wait for the result."""
    if not REPLICATE_API_TOKEN:
        raise ValueError("REPLICATE_API_TOKEN not configured")

    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
        "Prefer": "wait",
    }

    async with httpx.AsyncClient(timeout=max_wait + 30) as client:
        # Create prediction
        response = await client.post(
            f"{REPLICATE_BASE_URL}/predictions",
            headers=headers,
            json={
                "version": model_version,
                "input": input_data,
            },
        )
        response.raise_for_status()
        prediction = response.json()

        # If the "Prefer: wait" header worked, result may already be done
        if prediction.get("status") in ("succeeded", "failed", "canceled"):
            return prediction

        # Otherwise poll for completion
        prediction_id = prediction["id"]
        elapsed = 0.0
        while elapsed < max_wait:
            await _async_sleep(poll_interval)
            elapsed += poll_interval

            poll_response = await client.get(
                f"{REPLICATE_BASE_URL}/predictions/{prediction_id}",
                headers={"Authorization": f"Bearer {REPLICATE_API_TOKEN}"},
            )
            poll_response.raise_for_status()
            prediction = poll_response.json()

            if prediction["status"] in ("succeeded", "failed", "canceled"):
                return prediction

        raise TimeoutError(f"Replicate prediction {prediction_id} timed out after {max_wait}s")


async def _async_sleep(seconds: float):
    """Async sleep helper."""
    import asyncio
    await asyncio.sleep(seconds)


async def generate_image_flux(
    prompt: str,
    aspect_ratio: str = "16:9",
    model: str = "schnell",
) -> Dict[str, Any]:
    """Generate an image using FLUX on Replicate."""
    model_versions = {
        "schnell": "black-forest-labs/flux-schnell",
        "dev": "black-forest-labs/flux-dev",
        "pro": "black-forest-labs/flux-1.1-pro",
    }

    model_id = model_versions.get(model, model_versions["schnell"])

    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
        "Prefer": "wait",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{REPLICATE_BASE_URL}/models/{model_id}/predictions",
            headers=headers,
            json={
                "input": {
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "output_format": "png",
                },
            },
        )
        response.raise_for_status()
        prediction = response.json()

        # Poll if not done
        if prediction.get("status") not in ("succeeded", "failed", "canceled"):
            prediction_id = prediction["id"]
            for _ in range(150):
                await _async_sleep(2.0)
                poll = await client.get(
                    f"{REPLICATE_BASE_URL}/predictions/{prediction_id}",
                    headers={"Authorization": f"Bearer {REPLICATE_API_TOKEN}"},
                )
                poll.raise_for_status()
                prediction = poll.json()
                if prediction["status"] in ("succeeded", "failed", "canceled"):
                    break

        if prediction["status"] == "succeeded":
            output = prediction.get("output")
            if isinstance(output, list):
                image_url = output[0]
            elif isinstance(output, str):
                image_url = output
            else:
                image_url = str(output)
            return {"image_url": image_url, "prediction_id": prediction["id"]}
        else:
            error = prediction.get("error", "Unknown error")
            raise RuntimeError(f"FLUX generation failed: {error}")


async def generate_video(
    image_url: str,
    prompt: str = "",
    duration: int = 5,
    resolution: str = "480p",
) -> Dict[str, Any]:
    """Generate a video from an image using Wan 2.1 on Replicate."""
    model_map = {
        "480p": "wavespeedai/wan-2.1-i2v-480p",
        "720p": "wavespeedai/wan-2.1-i2v-720p",
    }

    model_id = model_map.get(resolution, model_map["480p"])

    input_data = {
        "image": image_url,
        "prompt": prompt or "cinematic motion, smooth camera movement, high quality",
        "max_frames": min(duration * 24, 81),
    }

    headers = {
        "Authorization": f"Bearer {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json",
        "Prefer": "wait",
    }

    async with httpx.AsyncClient(timeout=600.0) as client:
        response = await client.post(
            f"{REPLICATE_BASE_URL}/models/{model_id}/predictions",
            headers=headers,
            json={"input": input_data},
        )
        response.raise_for_status()
        prediction = response.json()

        # Poll if not done
        if prediction.get("status") not in ("succeeded", "failed", "canceled"):
            prediction_id = prediction["id"]
            for _ in range(300):
                await _async_sleep(2.0)
                poll = await client.get(
                    f"{REPLICATE_BASE_URL}/predictions/{prediction_id}",
                    headers={"Authorization": f"Bearer {REPLICATE_API_TOKEN}"},
                )
                poll.raise_for_status()
                prediction = poll.json()
                if prediction["status"] in ("succeeded", "failed", "canceled"):
                    break

        if prediction["status"] == "succeeded":
            output = prediction.get("output")
            if isinstance(output, list):
                video_url = output[0]
            elif isinstance(output, str):
                video_url = output
            else:
                video_url = str(output)
            return {"video_url": video_url, "prediction_id": prediction["id"]}
        else:
            error = prediction.get("error", "Unknown error")
            raise RuntimeError(f"Video generation failed: {error}")


async def generate_voice(
    text: str,
    speaker: str = "v2/en_speaker_6",
) -> Dict[str, Any]:
    """Generate voice audio using Bark on Replicate."""
    model_id = "suno-ai/bark"
    model_version = "b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787"

    input_data = {
        "prompt": text,
        "text_temp": 0.7,
        "waveform_temp": 0.7,
        "history_prompt": speaker,
    }

    prediction = await _run_replicate_model(model_version, input_data, max_wait=120.0)

    if prediction["status"] == "succeeded":
        output = prediction.get("output", {})
        audio_url = output.get("audio_out", "") if isinstance(output, dict) else str(output)
        return {"audio_url": audio_url, "prediction_id": prediction["id"]}
    else:
        error = prediction.get("error", "Unknown error")
        raise RuntimeError(f"Voice generation failed: {error}")


async def generate_face_portrait(
    face_image_url: str,
    prompt: str,
    style: str = "photorealistic",
) -> Dict[str, Any]:
    """Generate a consistent face portrait using InstantID on Replicate."""
    model_id = "zsxkib/instant-id"
    model_version = "6af8583c541261472e92155d87bfb4dd19e96beb8d58c47128bef07e39db457e"

    input_data = {
        "image": face_image_url,
        "prompt": f"{style} portrait, {prompt}, highly detailed, professional",
        "negative_prompt": "blurry, low quality, distorted, deformed",
        "ip_adapter_scale": 0.8,
        "controlnet_conditioning_scale": 0.8,
        "num_inference_steps": 30,
    }

    prediction = await _run_replicate_model(model_version, input_data, max_wait=120.0)

    if prediction["status"] == "succeeded":
        output = prediction.get("output")
        if isinstance(output, list):
            image_url = output[0]
        elif isinstance(output, str):
            image_url = output
        else:
            image_url = str(output)
        return {"image_url": image_url, "prediction_id": prediction["id"]}
    else:
        error = prediction.get("error", "Unknown error")
        raise RuntimeError(f"Face portrait generation failed: {error}")
