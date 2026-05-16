# SightSync - AI Scene Description Assistant

> **Real-time multimodal AI guidance for visually impaired users, powered by OpenRouter and Gemma.**

---

## Project Structure

```
SightSync/
├── frontend/                  # React + TypeScript + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatPanel.tsx      # Scene Q&A with spoken answers
│   │   ├── hooks/
│   │   │   ├── useTTS.ts          # Camb audio + browser SpeechSynthesis fallback
│   │   │   └── useVoiceControl.ts # Browser speech-recognition commands
│   │   ├── pages/
│   │   │   └── SceneAssistantPage.tsx  # Camera, live mode, scene result, voice controls
│   │   ├── services/
│   │   │   └── api.ts             # Fetch client to FastAPI backend
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                # Root component
│   │   ├── main.tsx               # Vite entry point
│   │   └── index.css              # Design system (tokens, animations)
│   ├── index.html
│   ├── vite.config.ts
│   └── .env.example
│
├── backend/                   # Python FastAPI
│   ├── main.py                # App entry point + CORS middleware
│   ├── requirements.txt
│   ├── Dockerfile             # Cloud Run ready
│   ├── .env.example
│   └── app/
│       ├── config.py          # Environment settings
│       ├── models.py          # Pydantic response models
│       ├── routers/
│       │   └── image_analysis.py  # POST /analyze-image
│       └── services/
│           └── gemini_service.py  # OpenRouter multimodal API calls
│
└── .gitignore
```

---

## Quick Start

### 1. Clone & prerequisites

```bash
git clone <your-repo>
cd SightSync

# Requirements:
# Node >= 18, npm >= 9
# Python >= 3.11
# A Google Cloud project
```

### 2. Frontend setup

```bash
cd frontend
cp .env.example .env.local      # optional; defaults to /api locally
npm install
npm run dev                      # https://localhost:5173
```

### 3. Backend setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env            # add your OPENROUTER_API_KEY
uvicorn main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

## OpenRouter Setup

1. Go to [OpenRouter](https://openrouter.ai/settings/keys) and get an API key.
2. Add to `backend/.env`:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=google/gemma-3-12b-it
OPENROUTER_FALLBACK_MODELS=google/gemma-3-27b-it
# Optional server-generated audio. If omitted, the frontend uses browser TTS.
CAMBAI_API_KEY=your_camb_key_here
```

The default model is `google/gemma-3-12b-it`, with `google/gemma-3-27b-it` as a fallback for temporary upstream rate limits. Change these via `OPENROUTER_MODEL` and `OPENROUTER_FALLBACK_MODELS`.

---

## Cloud Run Deployment

The repo includes a deployment script that publishes two Cloud Run services:

- `sightsync-api` - FastAPI backend
- `sightsync-web` - React frontend served by nginx

```bash
# 1. Authenticate and choose your Google Cloud project
gcloud auth login

# 2. Deploy. OPENROUTER_API_KEY is stored in Secret Manager.
PROJECT_ID=your-gcp-project-id \
REGION=us-central1 \
OPENROUTER_API_KEY=your_openrouter_key \
./scripts/deploy-cloud-run.sh
```

Optional: set `CAMBAI_API_KEY=...` in the same command to enable server-generated WAV audio.

---

## API Reference

### `POST /analyze-image`

| Field | Value |
|-------|-------|
| Content-Type | `multipart/form-data` |
| Body param | `file` - image file (JPEG, PNG, WebP, GIF, max 10 MB) |

**Response 200:**
```json
{
  "description": "A busy street corner with two people waiting at a pedestrian crossing...",
  "confidence": "high",
  "urgency": "normal",
  "should_speak": false,
  "tags": ["street", "person", "pedestrian", "traffic light", "urban"],
  "timestamp": "2026-05-14T20:00:00.000Z",
  "processing_time_ms": 1243,
  "audio_base64": null
}
```

**Error codes:** `400` empty file · `413` too large · `415` unsupported type · `502` model provider error

---

## Accessibility Features

- All interactive elements have descriptive `aria-label` attributes
- Keyboard navigable (Tab + Enter for all actions)
- Large touch targets (min 52px height for all buttons)
- Auto-reads only critical scene descriptions aloud, such as hazards and navigation risks
- Reads chat answers aloud when audio is enabled
- Falls back to browser `SpeechSynthesis` when Camb AI audio is unavailable
- High contrast dark theme with 18px base font size
- Loading states announced via `aria-live` / `role="status"`
- `role="alert"` on error messages for immediate screen reader announcement

---

## Suggested Next MVP Milestone

1. **Audio-only mode** - skip visual UI entirely, designed for headphone use
2. **Firestore history** - persist the last N descriptions per user with timestamps
3. **Optional login** - allow saved history without blocking anonymous use
4. **Navigation assistance** - detect obstacles and suggest directions
5. **Multi-language TTS** - detect scene language and match voice accordingly
