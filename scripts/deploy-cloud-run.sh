#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your Google Cloud project id.}"
REGION="${REGION:-us-central1}"
BACKEND_SERVICE="${BACKEND_SERVICE:-sightsync-api}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-sightsync-web}"
OPENROUTER_SECRET="${OPENROUTER_SECRET:-sightsync-openrouter-api-key}"
CAMBAI_SECRET="${CAMBAI_SECRET:-sightsync-cambai-api-key}"
OPENROUTER_MODEL="${OPENROUTER_MODEL:-google/gemma-3-12b-it}"
OPENROUTER_FALLBACK_MODELS="${OPENROUTER_FALLBACK_MODELS:-google/gemma-3-27b-it}"
MAX_IMAGE_SIZE_MB="${MAX_IMAGE_SIZE_MB:-10}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ensure_secret() {
  local secret_name="$1"
  local secret_value="$2"
  local required="$3"

  if gcloud secrets describe "${secret_name}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
    if [[ -n "${secret_value}" ]]; then
      printf "%s" "${secret_value}" | gcloud secrets versions add "${secret_name}" \
        --project "${PROJECT_ID}" \
        --data-file=-
    fi
    return
  fi

  if [[ -z "${secret_value}" ]]; then
    if [[ "${required}" == "true" ]]; then
      echo "Missing required secret ${secret_name}. Set OPENROUTER_API_KEY or create the secret first." >&2
      exit 1
    fi
    return
  fi

  printf "%s" "${secret_value}" | gcloud secrets create "${secret_name}" \
    --project "${PROJECT_ID}" \
    --replication-policy="automatic" \
    --data-file=-
}

echo "Using project ${PROJECT_ID} in ${REGION}"
gcloud config set project "${PROJECT_ID}" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format "value(projectNumber)")"
RUNTIME_SERVICE_ACCOUNT="${RUNTIME_SERVICE_ACCOUNT:-${PROJECT_NUMBER}-compute@developer.gserviceaccount.com}"

echo "Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  --project "${PROJECT_ID}"

echo "Configuring secrets..."
ensure_secret "${OPENROUTER_SECRET}" "${OPENROUTER_API_KEY:-}" "true"
ensure_secret "${CAMBAI_SECRET}" "${CAMBAI_API_KEY:-}" "false"

echo "Granting Cloud Run runtime access to secrets..."
gcloud secrets add-iam-policy-binding "${OPENROUTER_SECRET}" \
  --project "${PROJECT_ID}" \
  --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
  --role "roles/secretmanager.secretAccessor" \
  --quiet >/dev/null

if gcloud secrets describe "${CAMBAI_SECRET}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud secrets add-iam-policy-binding "${CAMBAI_SECRET}" \
    --project "${PROJECT_ID}" \
    --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role "roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
fi

SECRET_ENV="OPENROUTER_API_KEY=${OPENROUTER_SECRET}:latest"
if gcloud secrets describe "${CAMBAI_SECRET}" --project "${PROJECT_ID}" >/dev/null 2>&1; then
  SECRET_ENV="${SECRET_ENV},CAMBAI_API_KEY=${CAMBAI_SECRET}:latest"
fi

echo "Deploying backend service ${BACKEND_SERVICE}..."
BACKEND_URL="$(
  gcloud run deploy "${BACKEND_SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --source "${ROOT_DIR}/backend" \
    --allow-unauthenticated \
    --service-account "${RUNTIME_SERVICE_ACCOUNT}" \
    --set-secrets "${SECRET_ENV}" \
    --set-env-vars "OPENROUTER_MODEL=${OPENROUTER_MODEL},OPENROUTER_FALLBACK_MODELS=${OPENROUTER_FALLBACK_MODELS},MAX_IMAGE_SIZE_MB=${MAX_IMAGE_SIZE_MB}" \
    --format "value(status.url)"
)"

echo "Deploying frontend service ${FRONTEND_SERVICE}..."
FRONTEND_URL="$(
  gcloud run deploy "${FRONTEND_SERVICE}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --source "${ROOT_DIR}/frontend" \
    --allow-unauthenticated \
    --set-env-vars "VITE_API_BASE_URL=${BACKEND_URL}" \
    --format "value(status.url)"
)"

echo "Updating backend CORS for frontend origin..."
gcloud run services update "${BACKEND_SERVICE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --update-env-vars "CORS_ORIGINS=${FRONTEND_URL}" >/dev/null

echo
echo "Deployment complete."
echo "Frontend: ${FRONTEND_URL}"
echo "Backend:  ${BACKEND_URL}"
