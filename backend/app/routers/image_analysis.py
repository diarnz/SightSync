# ============================================================
# app/routers/image_analysis.py
# POST /analyze-image endpoint
# ============================================================

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.models import AnalysisResponse
from app.services.gemini_service import analyse_image_bytes
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Allowed MIME types (Gemini supports these natively)
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


@router.post(
    "/analyze-image",
    response_model=AnalysisResponse,
    summary="Analyse an image with Gemini Vision",
    description=(
        "Accepts a multipart/form-data image upload. "
        "Sends the image to Gemini Multimodal API and returns an "
        "accessibility-focused scene description."
    ),
)
async def analyze_image(
    file: UploadFile = File(..., description="Image file (JPEG, PNG, WebP, GIF)"),
) -> AnalysisResponse:
    # ------ Validation ------
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{file.content_type}'. "
                   f"Accepted: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    image_bytes = await file.read()

    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds maximum size of {settings.MAX_IMAGE_SIZE_MB} MB.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file.")

    logger.info(
        "Received image: name=%s type=%s size=%d bytes",
        file.filename, file.content_type, len(image_bytes),
    )

    # ------ Gemini analysis ------
    try:
        description, tags, processing_ms = await analyse_image_bytes(
            image_bytes=image_bytes,
            mime_type=file.content_type or "image/jpeg",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # ------ Confidence heuristic (simple size-based proxy) ------
    if len(image_bytes) < 20_000:
        confidence = "low"
    elif len(image_bytes) < 100_000:
        confidence = "medium"
    else:
        confidence = "high"

    return AnalysisResponse(
        description=description,
        confidence=confidence,
        tags=tags,
        processing_time_ms=processing_ms,
    )
