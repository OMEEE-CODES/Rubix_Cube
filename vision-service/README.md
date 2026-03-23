# Vision Service

Python FastAPI service for cube-face image analysis.

## Endpoints

- `GET /health`
- `POST /analyze-faces`

## Local run

```bash
cd vision-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The Next.js app calls this service using `VISION_SERVICE_URL`.
