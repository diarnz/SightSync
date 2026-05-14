# SightSync 👁️ – AI Scene Description Assistant

> **Real-time multimodal AI guidance for visually impaired users, powered by Google Gemini.**

---

## Project Structure

```
SightSync/
├── frontend/                  # React + TypeScript + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx         # Fixed nav bar with auth controls
│   │   │   ├── ImageCapture.tsx   # Drag-drop upload + webcam capture
│   │   │   ├── AnalysisResult.tsx # Gemini response with TTS controls
│   │   │   └── AnalyzeButton.tsx  # Context-aware CTA button
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # Firebase auth state listener
│   │   │   ├── useTTS.ts          # SpeechSynthesis wrapper
│   │   │   └── useImageAnalysis.ts # Core workflow orchestration
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx      # Unauthenticated landing page
│   │   │   └── SceneAssistantPage.tsx  # Main feature page
│   │   ├── services/
│   │   │   └── api.ts             # Axios client → FastAPI backend
│   │   ├── config/
│   │   │   └── firebase.ts        # Firebase app initialisation
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                # Root component with auth gating
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
│       ├── config.py          # Pydantic-settings (reads .env)
│       ├── models.py          # Pydantic response models
│       ├── routers/
│       │   └── image_analysis.py  # POST /analyze-image
│       └── services/
│           └── gemini_service.py  # Gemini Multimodal API calls
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
# A Google Cloud project with Gemini API enabled
# A Firebase project with Authentication (Google provider) enabled
```

### 2. Frontend setup

```bash
cd frontend
cp .env.example .env.local      # fill in Firebase + API values
npm install
npm run dev                      # → http://localhost:5173
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

cp .env.example .env            # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create project**
2. Enable **Authentication** → Sign-in methods → **Google**
3. Register your web app → copy the config object
4. Paste values into `frontend/.env.local`

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourproject
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

---

## Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) → **Get API key**
2. Add to `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
```

The default model is `gemini-2.0-flash` (fast multimodal). Change via `GEMINI_MODEL` env var.

---

## Cloud Run Deployment

```bash
# 1. Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Build & push container image
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/sightsync-api

# 3. Deploy to Cloud Run
gcloud run deploy sightsync-api \
  --image gcr.io/YOUR_PROJECT_ID/sightsync-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key \
  --memory 512Mi \
  --cpu 1

# 4. Update frontend .env.local with the Cloud Run URL:
# VITE_API_BASE_URL=https://sightsync-api-xxxx-uc.a.run.app

# 5. Add your production domain to Firebase → Authorised domains
```

---

## API Reference

### `POST /analyze-image`

| Field | Value |
|-------|-------|
| Content-Type | `multipart/form-data` |
| Body param | `file` – image file (JPEG, PNG, WebP, GIF, max 10 MB) |

**Response 200:**
```json
{
  "description": "A busy street corner with two people waiting at a pedestrian crossing...",
  "confidence": "high",
  "tags": ["street", "person", "pedestrian", "traffic light", "urban"],
  "timestamp": "2026-05-14T20:00:00.000Z",
  "processing_time_ms": 1243
}
```

**Error codes:** `400` empty file · `413` too large · `415` unsupported type · `502` Gemini error

---

## Accessibility Features

- All interactive elements have descriptive `aria-label` attributes
- Keyboard navigable (Tab + Enter for all actions)
- Large touch targets (min 52px height for all buttons)
- Auto-reads descriptions aloud via `SpeechSynthesis` API
- High contrast dark theme with 18px base font size
- Loading states announced via `aria-live` / `role="status"`
- `role="alert"` on error messages for immediate screen reader announcement

---

## Suggested Next MVP Milestone

1. **Firestore history** – persist the last N descriptions per user with timestamps
2. **Continuous mode** – stream webcam frames every N seconds automatically
3. **Audio-only mode** – skip visual UI entirely, designed for headphone use
4. **Navigation assistance** – detect obstacles and suggest directions
5. **Multi-language TTS** – detect scene language and match voice accordingly
