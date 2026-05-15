# ============================================================
# app/models.py – Pydantic response / request models
# ============================================================

from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime, timezone


class AnalysisResponse(BaseModel):
    """Structured response returned to the frontend after Gemini analysis."""

    description: str = Field(
        ...,
        description="Accessibility-focused natural language description of the scene."
    )
    confidence: Literal["high", "medium", "low"] = Field(
        default="high",
        description="Rough confidence level based on image quality heuristics."
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Key objects or scene labels extracted from the description."
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of when the response was generated."
    )
    processing_time_ms: int = Field(
        default=0,
        description="Wall-clock processing time in milliseconds."
    )
    audio_base64: Optional[str] = Field(
        default=None,
        description="Base64 encoded audio string of the description spoken out loud."
    )


class ChatResponse(BaseModel):
    """Structured response for a conversational Q&A turn about the current scene."""

    answer: str = Field(
        ...,
        description="Natural language answer to the user's question about the scene."
    )
    processing_time_ms: int = Field(
        default=0,
        description="Wall-clock processing time in milliseconds."
    )
    audio_base64: Optional[str] = Field(
        default=None,
        description="Base64 encoded audio of the spoken answer (WAV)."
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp."
    )
