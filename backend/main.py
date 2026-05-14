# ============================================================
# SightSync Backend – FastAPI Application Entry Point
# ============================================================
# Run locally:   uvicorn main:app --reload --port 8000
# Deploy:        See Dockerfile + Cloud Run steps in README
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import image_analysis
from app.config import settings

# ------------------------------------------------------------------
# App initialisation
# ------------------------------------------------------------------
app = FastAPI(
    title="SightSync API",
    description="Accessibility-focused multimodal AI backend powered by Google Gemini.",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI – handy for hackathon demos
    redoc_url="/redoc",
)

# ------------------------------------------------------------------
# CORS – allow the Vite dev server and production frontend origin.
# Tighten origins[] before going to production.
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------
app.include_router(image_analysis.router, prefix="", tags=["Image Analysis"])


# ------------------------------------------------------------------
# Health check (used by Cloud Run readiness probe)
# ------------------------------------------------------------------
@app.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "service": "SightSync API"}
