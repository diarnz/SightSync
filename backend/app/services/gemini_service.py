# ============================================================
# app/services/gemini_service.py
# All Gemini Multimodal API logic — uses the new google-genai SDK
# ============================================================

import os
import re
import time
import logging
from typing import Tuple, List, Optional

from dotenv import load_dotenv

# Load .env explicitly from the backend directory so the API key
# is available no matter where uvicorn is invoked from.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from google import genai    
from google.genai import types

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Lazy client — instantiated on first use so the API key is
# guaranteed to be present by the time we call genai.Client().
# ------------------------------------------------------------------
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. "
                "Add it to backend/.env and restart the server."
            )
        _client = genai.Client(api_key=api_key)
    return _client


GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

SYSTEM_PROMPT = (
    "You are a dedicated accessibility assistant for users who are blind or have severe vision impairment. "
    "Analyze the image and provide a JSON response with two keys:\n"
    "1. 'description': An extremely concise, direct, and spoken-word-friendly description (strictly under 300 characters). "
    "Get straight to the point. Mention colours, spatial layout, and text only if critical. Note immediate hazards. "
    "CRITICAL: Always use precise spatial language (e.g., 'top-left', 'center', 'bottom-right'). "
    "If describing controls (buttons, dials), describe their exact relative position "
    "(e.g., 'the second button from the left', 'the dial in the top-right corner'). "
    "No conversational filler. Do not use markdown or bullet points. Do not start with 'I see'.\n"
    "2. 'tags': A list of up to 8 short label words or phrases (e.g. ['street', 'person', 'car'])."
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
) -> Tuple[str, List[str], int]:
    """
    Send image bytes to Gemini and return (description, tags, processing_ms).
    Raises RuntimeError on failure so the router returns a clean 502.
    """
    start = time.monotonic()
    client = _get_client()

    try:
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part(text="Analyze this scene for a visually impaired person."),
                        types.Part(
                            inline_data=types.Blob(
                                mime_type=mime_type,
                                data=image_bytes,
                            )
                        ),
                    ],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.4,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )

        data = response.parsed
        if not data:
            # Fallback for unexpected parsing issues
            import json
            data = json.loads(response.text)

        description = data.get("description", "No description generated.")
        if len(description) > 500:
            # Ensure it strictly doesn't exceed 500 characters
            description = description[:497] + "..."
        tags = data.get("tags", [])
        processing_ms = int((time.monotonic() - start) * 1000)

        logger.info("Gemini analysis complete in %d ms (single call)", processing_ms)
        return description, tags, processing_ms

    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("Gemini API error: %s", exc, exc_info=True)
        raise RuntimeError(f"Gemini API error: {exc}") from exc


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
    client = _get_client()

    try:
        parts = []
        for img_bytes, mime in images:
            parts.append(
                types.Part(
                    inline_data=types.Blob(
                        mime_type=mime,
                        data=img_bytes,
                    )
                )
            )
        parts.append(types.Part(text=question))

        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=parts,
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_PROMPT,
                temperature=0.5,
                max_output_tokens=512,
            ),
        )

        answer = (response.text or "").strip()
        if not answer:
            answer = "Sorry, I couldn't find an answer from the scene."

        processing_ms = int((time.monotonic() - start) * 1000)
        logger.info("Chat response generated in %d ms with %d images", processing_ms, len(images))
        return answer, processing_ms

    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("Gemini chat error: %s", exc, exc_info=True)
        raise RuntimeError(f"Gemini API error: {exc}") from exc
