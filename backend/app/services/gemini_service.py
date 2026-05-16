# ============================================================
# app/services/gemini_service.py
# Vision/chat provider logic via OpenRouter.
# ============================================================

import base64
import json
import os
import time
import logging
from typing import Tuple, List, Literal, Any, Optional

import httpx
from dotenv import load_dotenv

# Load .env explicitly from the backend directory so the API key
# is available no matter where uvicorn is invoked from.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = (os.getenv("OPENROUTER_API_KEY") or os.getenv("GEMINI_API_KEY", "")).strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL") or os.getenv("GEMINI_MODEL", "google/gemma-3-12b-it")
OPENROUTER_FALLBACK_MODELS = [
    model.strip()
    for model in os.getenv("OPENROUTER_FALLBACK_MODELS", "google/gemma-3-27b-it").split(",")
    if model.strip()
]

SYSTEM_PROMPT = (
    "You are a dedicated accessibility assistant for users who are blind or have severe vision impairment. "
    "Analyze the image and provide a JSON response with four keys:\n"
    "1. 'description': An extremely concise, direct, and spoken-word-friendly description (strictly under 300 characters). "
    "Get straight to the point. Mention colours, spatial layout, and text only if critical. Note immediate hazards. "
    "CRITICAL: Always use precise spatial language (e.g., 'top-left', 'center', 'bottom-right'). "
    "If describing controls (buttons, dials), describe their exact relative position "
    "(e.g., 'the second button from the left', 'the dial in the top-right corner'). "
    "No conversational filler. Do not use markdown or bullet points. Do not start with 'I see'.\n"
    "2. 'tags': A list of up to 8 short label words or phrases (e.g. ['street', 'person', 'car']).\n"
    "3. 'urgency': Either 'normal' or 'critical'. Use 'critical' only for immediate safety, navigation, "
    "or warning information: obstacles, vehicles, stairs, drop-offs, crossings, wet floors, warning signs, "
    "or people very close to the user.\n"
    "4. 'should_speak': Boolean. True only when urgency is 'critical'."
)

CHAT_SYSTEM_PROMPT = (
    "You are an assistant for a user who is blind. The user will provide an image of their scene and ask a question. "
    "Answer the question with an extremely short, direct, and actionable response. "
    "Get straight to the point without any conversational filler. "
    "CRITICAL SPATIAL RULES: Always use highly precise spatial language. "
    "Instead of saying 'turn the dial' or 'press the button', tell the user exactly where it is "
    "(e.g., 'press the square button in the top-right corner', 'turn the lowest dial on the left', "
    "'the middle button of the three'). Describe positions relative to the user or obvious landmarks. "
    "No markdown, no bullet points, no lists. Keep your answer under 150 characters if possible. "
    "If you cannot answer from the image alone, say so honestly."
)



async def analyse_image_bytes(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> Tuple[str, List[str], Literal["normal", "critical"], bool, int]:
    """
    Send image bytes to OpenRouter and return
    (description, tags, urgency, should_speak, processing_ms).
    Raises RuntimeError on failure so the router returns a clean 502.
    """
    start = time.monotonic()

    try:
        image_url = _image_data_url(image_bytes, mime_type)
        content = await _openrouter_chat(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this scene for a visually impaired person."},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                },
            ],
            temperature=0.4,
            max_tokens=1024,
            response_format={"type": "json_object"},
        )

        data = _parse_json_object(content)

        description = str(data.get("description", "No description generated.")).strip()
        if len(description) > 500:
            # Ensure it strictly doesn't exceed 500 characters
            description = description[:497] + "..."
        raw_tags = data.get("tags", [])
        tags = raw_tags if isinstance(raw_tags, list) else []
        tags = [str(tag).strip() for tag in tags[:8] if str(tag).strip()]
        urgency = data.get("urgency", "normal")
        if urgency not in {"normal", "critical"}:
            urgency = "normal"
        should_speak = bool(data.get("should_speak", urgency == "critical"))
        should_speak = should_speak and urgency == "critical"
        processing_ms = int((time.monotonic() - start) * 1000)

        logger.info("OpenRouter analysis complete in %d ms using %s", processing_ms, OPENROUTER_MODEL)
        return description, tags, urgency, should_speak, processing_ms

    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("OpenRouter API error: %s", exc, exc_info=True)
        raise RuntimeError(f"OpenRouter API error: {exc}") from exc


async def chat_with_images(
    question: str,
    images: List[Tuple[bytes, str]],
) -> Tuple[str, int]:
    """
    Answer a natural-language question about a sequence of images (temporal context).
    images is a list of tuples: (image_bytes, mime_type).
    Returns (answer_text, processing_ms).
    Raises RuntimeError on failure.
    """
    start = time.monotonic()

    try:
        content_parts = []
        for img_bytes, mime in images:
            content_parts.append(
                {"type": "image_url", "image_url": {"url": _image_data_url(img_bytes, mime)}}
            )
        content_parts.append({"type": "text", "text": question})

        answer = await _openrouter_chat(
            messages=[
                {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                {"role": "user", "content": content_parts},
            ],
            temperature=0.5,
            max_tokens=512,
        )
        answer = answer.strip()
        if not answer:
            answer = "Sorry, I couldn't find an answer from the scene."

        processing_ms = int((time.monotonic() - start) * 1000)
        logger.info(
            "OpenRouter chat response generated in %d ms with %d images using %s",
            processing_ms,
            len(images),
            OPENROUTER_MODEL,
        )
        return answer, processing_ms

    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("OpenRouter chat error: %s", exc, exc_info=True)
        raise RuntimeError(f"OpenRouter API error: {exc}") from exc


def _image_data_url(image_bytes: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


async def _openrouter_chat(
    *,
    messages: List[dict],
    temperature: float,
    max_tokens: int,
    response_format: Optional[dict] = None,
) -> str:
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. Add it to backend/.env or Cloud Run secrets."
        )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sightsync-web-t4szch3t4q-uc.a.run.app",
        "X-Title": "SightSync",
    }

    errors = []
    for model in _model_candidates():
        payload: dict = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)

        if response.status_code < 400:
            body = response.json()
            break

        error_text = response.text[:500]
        errors.append(f"{model}: {response.status_code}: {error_text}")
        if not _is_retryable_provider_error(response.status_code, error_text):
            raise RuntimeError(errors[-1])
    else:
        raise RuntimeError("; ".join(errors))

    choices = body.get("choices") or []
    if not choices:
        raise RuntimeError("OpenRouter returned no choices.")

    content = choices[0].get("message", {}).get("content", "")
    if isinstance(content, list):
        text_parts = [
            str(part.get("text", ""))
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        ]
        return "\n".join(text_parts).strip()
    return str(content).strip()


def _parse_json_object(text: str) -> dict[str, Any]:
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        data = json.loads(text[start:end + 1])

    if not isinstance(data, dict):
        raise RuntimeError("OpenRouter returned JSON that was not an object.")
    return data


def _model_candidates() -> List[str]:
    seen = set()
    models = []
    for model in [OPENROUTER_MODEL] + OPENROUTER_FALLBACK_MODELS:
        if model and model not in seen:
            seen.add(model)
            models.append(model)
    return models


def _is_retryable_provider_error(status_code: int, error_text: str) -> bool:
    retry_markers = (
        "rate-limited",
        "temporarily",
        "overloaded",
        "provider returned error",
        "timeout",
    )
    normalized = error_text.lower()
    return status_code in {408, 429, 500, 502, 503, 504} or any(
        marker in normalized for marker in retry_markers
    )
