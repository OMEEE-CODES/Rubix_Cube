from typing import Literal

from pydantic import BaseModel, Field


CubeColor = Literal["white", "red", "green", "yellow", "orange", "blue"]
FaceId = Literal["up", "right", "front", "down", "left", "back"]
ImageMimeType = Literal["image/jpeg", "image/png", "image/webp"]


class FaceCaptureInput(BaseModel):
    faceId: FaceId
    imageBase64: str = Field(min_length=1)
    mimeType: ImageMimeType
    capturedAt: str | None = None


class AnalyzeFacesRequest(BaseModel):
    captures: list[FaceCaptureInput] = Field(min_length=1, max_length=6)


class StickerDetection(BaseModel):
    index: int
    color: CubeColor
    confidence: float


class FaceAnalysis(BaseModel):
    faceId: FaceId
    stickers: list[CubeColor] = Field(min_length=9, max_length=9)
    detections: list[StickerDetection] = Field(min_length=9, max_length=9)
    averageConfidence: float
    source: Literal["vision", "manual"]


class AnalyzeFacesResponse(BaseModel):
    faces: list[FaceAnalysis]
    warnings: list[str] = Field(default_factory=list)
