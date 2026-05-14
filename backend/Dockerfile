# ============================================================
# Dockerfile – FastAPI backend for Cloud Run
# Multi-stage build keeps the final image lean (~150 MB).
# ============================================================

# ---- Stage 1: dependency installer ----
FROM python:3.12-slim AS builder
WORKDIR /app

# Install build tools needed for some native wheels
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 2: runtime image ----
FROM python:3.12-slim AS runtime
WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Cloud Run sets PORT; uvicorn must bind to it
ENV PORT=8080
EXPOSE 8080

# Ensure Python output is not buffered (important for Cloud Run logs)
ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2"]
