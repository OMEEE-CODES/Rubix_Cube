import base64
import io

from PIL import Image, ImageStat

from app.colors import classify_rgb
from app.schemas import FaceAnalysis, FaceCaptureInput, StickerDetection


def analyze_face_capture(capture: FaceCaptureInput) -> FaceAnalysis:
    image = decode_image(capture.imageBase64)
    image = image.convert("RGB")

    cell_width = image.width / 3
    cell_height = image.height / 3

    stickers: list[str] = []
    detections: list[StickerDetection] = []

    for row in range(3):
        for column in range(3):
            index = row * 3 + column
            crop = crop_center_region(image, column, row, cell_width, cell_height)
            mean_rgb = ImageStat.Stat(crop).mean
            color, confidence = classify_rgb(
                (float(mean_rgb[0]), float(mean_rgb[1]), float(mean_rgb[2]))
            )
            stickers.append(color)
            detections.append(
                StickerDetection(index=index, color=color, confidence=confidence)
            )

    average_confidence = round(
        sum(detection.confidence for detection in detections) / len(detections), 2
    )

    return FaceAnalysis(
        faceId=capture.faceId,
        stickers=stickers,
        detections=detections,
        averageConfidence=average_confidence,
        source="vision",
    )


def decode_image(image_base64: str) -> Image.Image:
    _, _, data = image_base64.partition(",")
    encoded = data or image_base64
    binary = base64.b64decode(encoded)
    return Image.open(io.BytesIO(binary))


def crop_center_region(
    image: Image.Image,
    column: int,
    row: int,
    cell_width: float,
    cell_height: float,
) -> Image.Image:
    left = int(column * cell_width + cell_width * 0.18)
    upper = int(row * cell_height + cell_height * 0.18)
    right = int((column + 1) * cell_width - cell_width * 0.18)
    lower = int((row + 1) * cell_height - cell_height * 0.18)
    return image.crop((left, upper, right, lower))
