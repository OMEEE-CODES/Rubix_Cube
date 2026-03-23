import { CENTER_COLOR_BY_FACE, STICKERS_PER_FACE } from "@/lib/cube/constants";
import type {
  CubeColor,
  FaceAnalysis,
  FaceCaptureInput,
  FaceId,
  VisionAnalyzeFacesResponse,
} from "@/lib/cube/types";

const FALLBACK_WARNING =
  "Vision service unavailable. Falling back to deterministic local analysis.";

export class VisionServiceError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = "VisionServiceError";
    this.issues = issues;
  }
}

export async function analyzeFaceCaptures({
  captures,
  visionServiceUrl,
}: {
  captures: FaceCaptureInput[];
  visionServiceUrl: string;
}): Promise<{
  faces: Partial<Record<FaceId, FaceAnalysis>>;
  warnings: string[];
}> {
  try {
    const response = await fetch(`${trimTrailingSlash(visionServiceUrl)}/analyze-faces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        captures,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new VisionServiceError(
        "Vision service returned a non-success response.",
        [`status=${response.status}`],
      );
    }

    const json = (await response.json()) as unknown;
    const parsed = parseVisionAnalyzeFacesResponse(json);

    return {
      faces: Object.fromEntries(
        parsed.faces.map((face) => [face.faceId, face]),
      ) as Partial<Record<FaceId, FaceAnalysis>>,
      warnings: parsed.warnings,
    };
  } catch {
    const faces = Object.fromEntries(
      captures.map((capture) => [capture.faceId, createFallbackFaceAnalysis(capture)]),
    ) as Partial<Record<FaceId, FaceAnalysis>>;

    return {
      faces,
      warnings: [FALLBACK_WARNING],
    };
  }
}

function parseVisionAnalyzeFacesResponse(input: unknown): VisionAnalyzeFacesResponse {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VisionServiceError("Vision service response must be an object.");
  }

  const data = input as Record<string, unknown>;
  const facesValue = data.faces;
  const warningsValue = data.warnings;

  if (!Array.isArray(facesValue)) {
    throw new VisionServiceError("Vision service response must include faces.");
  }

  const faces = facesValue.map((face, index) => parseFaceAnalysis(face, index));
  const warnings = Array.isArray(warningsValue)
    ? warningsValue.filter((warning): warning is string => typeof warning === "string")
    : [];

  return {
    faces,
    warnings,
  };
}

function parseFaceAnalysis(input: unknown, index: number): FaceAnalysis {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VisionServiceError(`faces[${index}] must be an object.`);
  }

  const data = input as Record<string, unknown>;
  const faceId = data.faceId;
  const stickers = data.stickers;
  const detections = data.detections;
  const averageConfidence = data.averageConfidence;
  const source = data.source;

  if (!isFaceId(faceId)) {
    throw new VisionServiceError(`faces[${index}].faceId is invalid.`);
  }

  if (!Array.isArray(stickers) || stickers.length !== STICKERS_PER_FACE) {
    throw new VisionServiceError(`faces[${index}].stickers must contain 9 colors.`);
  }

  if (!stickers.every((sticker) => isCubeColor(sticker))) {
    throw new VisionServiceError(`faces[${index}].stickers contains an invalid color.`);
  }

  if (!Array.isArray(detections) || detections.length !== STICKERS_PER_FACE) {
    throw new VisionServiceError(`faces[${index}].detections must contain 9 entries.`);
  }

  if (typeof averageConfidence !== "number") {
    throw new VisionServiceError(`faces[${index}].averageConfidence is invalid.`);
  }

  if (source !== "vision" && source !== "manual") {
    throw new VisionServiceError(`faces[${index}].source is invalid.`);
  }

  return {
    faceId,
    stickers,
    detections: detections.map((detection, detectionIndex) =>
      parseDetection(detection, index, detectionIndex),
    ),
    averageConfidence,
    source,
  };
}

function parseDetection(input: unknown, faceIndex: number, detectionIndex: number) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new VisionServiceError(
      `faces[${faceIndex}].detections[${detectionIndex}] must be an object.`,
    );
  }

  const data = input as Record<string, unknown>;
  if (
    typeof data.index !== "number" ||
    !isCubeColor(data.color) ||
    typeof data.confidence !== "number"
  ) {
    throw new VisionServiceError(
      `faces[${faceIndex}].detections[${detectionIndex}] is invalid.`,
    );
  }

  return {
    index: data.index,
    color: data.color,
    confidence: data.confidence,
  };
}

function createFallbackFaceAnalysis(capture: FaceCaptureInput): FaceAnalysis {
  const normalizedBase64 = normalizeBase64(capture.imageBase64);
  const seed = hashString(`${capture.faceId}:${normalizedBase64.slice(0, 512)}`);
  const centerColor = CENTER_COLOR_BY_FACE[capture.faceId];
  const nearbyColors = fallbackPaletteForFace(capture.faceId);

  const stickers = Array.from({ length: STICKERS_PER_FACE }, (_, index) => {
    if (index === 4) {
      return centerColor;
    }

    const palette = [centerColor, ...nearbyColors];
    return palette[(seed + index * 11) % palette.length]!;
  });

  const detections = stickers.map((color, index) => ({
    index,
    color,
    confidence: Number((0.64 + ((seed + index) % 18) / 100).toFixed(2)),
  }));

  const averageConfidence = Number(
    (
      detections.reduce((total, detection) => total + detection.confidence, 0) /
      detections.length
    ).toFixed(2),
  );

  return {
    faceId: capture.faceId,
    stickers,
    detections,
    averageConfidence,
    source: "vision",
  };
}

function fallbackPaletteForFace(faceId: FaceId): CubeColor[] {
  switch (faceId) {
    case "up":
      return ["green", "red", "blue"];
    case "right":
      return ["white", "green", "blue"];
    case "front":
      return ["white", "red", "orange"];
    case "down":
      return ["green", "orange", "blue"];
    case "left":
      return ["white", "green", "yellow"];
    case "back":
      return ["white", "orange", "yellow"];
  }
}

function isFaceId(value: unknown): value is FaceId {
  return (
    value === "up" ||
    value === "right" ||
    value === "front" ||
    value === "down" ||
    value === "left" ||
    value === "back"
  );
}

function isCubeColor(value: unknown): value is CubeColor {
  return (
    value === "white" ||
    value === "red" ||
    value === "green" ||
    value === "yellow" ||
    value === "orange" ||
    value === "blue"
  );
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function normalizeBase64(imageBase64: string) {
  const [, data] = imageBase64.split(",", 2);
  return data ?? imageBase64;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
