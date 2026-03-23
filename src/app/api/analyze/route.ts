import { FACE_IDS } from "@/lib/cube/constants";
import { analyzeFaceCaptures } from "@/lib/cube/image-analysis";
import { assertValidCubeEnv, assertValidAnalyzeCubeRequest, SchemaError } from "@/lib/cube/schemas";
import type { AnalyzeCubeResponse } from "@/lib/cube/types";
import { apiError, apiSuccess, readJsonBody } from "@/lib/server/api-response";

export async function POST(request: Request) {
  try {
    const env = assertValidCubeEnv(process.env);
    const body = await readJsonBody(request);
    const analyzeRequest = assertValidAnalyzeCubeRequest(body);

    const oversizedFaces = analyzeRequest.captures.filter((capture) => {
      return estimateBase64Bytes(capture.imageBase64) > env.maxFaceUploadBytes;
    });

    if (oversizedFaces.length > 0) {
      return apiError(
        413,
        "PAYLOAD_TOO_LARGE",
        "One or more uploaded faces exceed the configured upload size limit.",
        oversizedFaces.map((capture) => capture.faceId),
      );
    }

    const { faces, warnings } = await analyzeFaceCaptures({
      captures: analyzeRequest.captures,
      visionServiceUrl: env.visionServiceUrl,
    });

    const missingFaces = FACE_IDS.filter((faceId) => !(faceId in faces));
    const confidenceValues = Object.values(faces).map(
      (face) => face?.averageConfidence ?? 0,
    );
    const overallConfidence =
      confidenceValues.length > 0
        ? Number(
            (
              confidenceValues.reduce((sum, value) => sum + value, 0) /
              confidenceValues.length
            ).toFixed(2),
          )
        : 0;

    const response: AnalyzeCubeResponse = {
      sessionId: analyzeRequest.sessionId ?? crypto.randomUUID(),
      faces,
      missingFaces,
      isComplete: missingFaces.length === 0,
      overallConfidence,
      warnings,
    };

    return apiSuccess(response);
  } catch (error) {
    if (error instanceof SchemaError) {
      return apiError(400, "INVALID_REQUEST", error.message, error.issues);
    }

    if (error instanceof Error && error.message === "INVALID_JSON") {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }

    return apiError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while analyzing cube captures.",
    );
  }
}

function estimateBase64Bytes(imageBase64: string) {
  const normalized = normalizeBase64(imageBase64);
  return Math.floor((normalized.length * 3) / 4);
}

function normalizeBase64(imageBase64: string) {
  const [, data] = imageBase64.split(",", 2);
  return data ?? imageBase64;
}
