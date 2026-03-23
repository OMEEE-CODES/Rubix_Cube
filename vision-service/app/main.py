from fastapi import FastAPI

from app.detect import analyze_face_capture
from app.schemas import AnalyzeFacesRequest, AnalyzeFacesResponse


app = FastAPI(title="Rubix Cube Vision Service", version="0.1.0")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-faces", response_model=AnalyzeFacesResponse)
def analyze_faces(payload: AnalyzeFacesRequest) -> AnalyzeFacesResponse:
    faces = [analyze_face_capture(capture) for capture in payload.captures]
    return AnalyzeFacesResponse(
        faces=faces,
        warnings=[],
    )
