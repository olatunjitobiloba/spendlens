# Build from the repository root:
# docker build -f api/Dockerfile -t spendlens-api .
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r api/requirements.txt

COPY ai ./ai
COPY api ./api
COPY ml ./ml

EXPOSE 8000

# Render and similar hosts supply PORT; 8000 remains the local default.
CMD ["sh", "-c", "uvicorn api.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
