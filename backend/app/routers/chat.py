# ============================================================
# app/routers/chat.py
# POST /api/chat endpoint — conversational Q&A about the scene
# ============================================================

import logging
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.models import ChatResponse
from app.services.gemini_service import chat_with_images
from app.services.camb_service import generate_speech_base64
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask a question about the current scene",
    description=(
        "Accepts a question (form field) and an image (multipart upload). "
        "Sends both to Gemini and returns a spoken-word-friendly answer."
    ),
)
async def chat_about_scene(
    question: str = Form(..., description="The user's natural-language question about the scene."),
    files: list[UploadFile] = File(..., description="The current sequence of scene images (JPEG, PNG, WebP, GIF)."),
) -> ChatResponse:
    # ------ Validation ------
    if not files:
        raise HTTPException(status_code=400, detail="Empty image files list.")

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Too many files. Max 10 allowed.")

    total_size = 0
    images = []

    for file in files:
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=(
                    f"Unsupported media type '{file.content_type}'. "
                    f"Accepted: {', '.join(ALLOWED_MIME_TYPES)}"
                ),
            )
        image_bytes = await file.read()
        total_size += len(image_bytes)
        
        if len(image_bytes) == 0:
            continue
            
        images.append((image_bytes, file.content_type or "image/jpeg"))

    if total_size > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Total image size exceeds maximum of {settings.MAX_IMAGE_SIZE_MB} MB.",
        )

    if not images:
        raise HTTPException(status_code=400, detail="Empty image files.")

    question = question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    logger.info(
        "Chat request: question=%r  num_images=%d  total_size=%d bytes",
        question, len(images), total_size,
    )

    # ------ Gemini Q&A ------
    try:
        answer, processing_ms = await chat_with_images(
            question=question,
            images=images,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # ------ TTS ------
    audio_base64 = None
    if answer:
        audio_base64 = await generate_speech_base64(answer)

    return ChatResponse(
        answer=answer,
        processing_time_ms=processing_ms,
        audio_base64=audio_base64,
    )
