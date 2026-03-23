import {
  CENTER_COLOR_BY_FACE,
  CUBE_COLORS,
  FACE_IDS,
  IMAGE_MIME_TYPES,
  SOLVER_MODES,
  STICKERS_PER_FACE,
} from "@/lib/cube/constants";
import type {
  AnalyzeCubeRequest,
  CubeServiceEnv,
  CubeState,
  CubeStateNotation,
  FaceCaptureInput,
  FaceId,
  ParseFailure,
  ParseResult,
  SolveCubeRequest,
  SolvePreference,
} from "@/lib/cube/types";

const SOLVE_PREFERENCES = ["fastest", "balanced", "beginner"] as const;

export class SchemaError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[]) {
    super(message);
    this.name = "SchemaError";
    this.issues = issues;
  }
}

export function isFaceId(value: unknown): value is FaceId {
  return typeof value === "string" && FACE_IDS.includes(value as FaceId);
}

export function isCubeColor(value: unknown): value is (typeof CUBE_COLORS)[number] {
  return typeof value === "string" && CUBE_COLORS.includes(value as (typeof CUBE_COLORS)[number]);
}

export function isCubeStateNotation(value: unknown): value is CubeStateNotation {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSolvePreference(value: unknown): value is SolvePreference {
  return (
    typeof value === "string" &&
    SOLVE_PREFERENCES.includes(value as SolvePreference)
  );
}

export function parseAnalyzeCubeRequest(input: unknown): ParseResult<AnalyzeCubeRequest> {
  const object = asRecord(input, "Analyze request body must be an object.");
  if (!object.success) {
    return object;
  }

  const errors: string[] = [];
  const sessionId = parseOptionalString(object.data.sessionId, "sessionId", errors);
  const capturesValue = object.data.captures;

  if (!Array.isArray(capturesValue) || capturesValue.length === 0) {
    errors.push("captures must be a non-empty array.");
  }

  const captures: FaceCaptureInput[] = [];
  if (Array.isArray(capturesValue)) {
    for (const [index, capture] of capturesValue.entries()) {
      const captureResult = parseFaceCaptureInput(capture, index);
      if (captureResult.success) {
        captures.push(captureResult.data);
      } else {
        errors.push(...captureResult.errors);
      }
    }
  }

  const uniqueFaces = new Set(captures.map((capture) => capture.faceId));
  if (captures.length !== uniqueFaces.size) {
    errors.push("captures must not contain duplicate faceId values.");
  }

  if (captures.length > FACE_IDS.length) {
    errors.push(`captures must contain at most ${FACE_IDS.length} faces.`);
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success({
    sessionId,
    captures,
  });
}

export function parseSolveCubeRequest(input: unknown): ParseResult<SolveCubeRequest> {
  const object = asRecord(input, "Solve request body must be an object.");
  if (!object.success) {
    return object;
  }

  const errors: string[] = [];
  const sessionId = parseOptionalString(object.data.sessionId, "sessionId", errors);
  let preference: SolvePreference | undefined;
  const preferenceValue = object.data.preference;

  if (preferenceValue !== undefined && !isSolvePreference(preferenceValue)) {
    errors.push(
      `preference must be one of: ${SOLVE_PREFERENCES.join(", ")}.`,
    );
  } else if (isSolvePreference(preferenceValue)) {
    preference = preferenceValue;
  }

  const cubeStateResult = parseCubeState(object.data.cubeState);
  if (!cubeStateResult.success) {
    return failure([...errors, ...cubeStateResult.errors]);
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success({
    sessionId,
    cubeState: cubeStateResult.data,
    preference,
  });
}

export function parseCubeState(input: unknown): ParseResult<CubeState> {
  const object = asRecord(input, "cubeState must be an object keyed by face id.");
  if (!object.success) {
    return object;
  }

  const errors: string[] = [];
  const cubeState = {} as CubeState;

  for (const faceId of FACE_IDS) {
    const faceValue = object.data[faceId];

    if (!Array.isArray(faceValue)) {
      errors.push(`${faceId} must be an array of ${STICKERS_PER_FACE} colors.`);
      continue;
    }

    if (faceValue.length !== STICKERS_PER_FACE) {
      errors.push(
        `${faceId} must contain exactly ${STICKERS_PER_FACE} stickers.`,
      );
      continue;
    }

    if (!faceValue.every((sticker) => isCubeColor(sticker))) {
      errors.push(`${faceId} contains an invalid cube color.`);
      continue;
    }

    const centerSticker = faceValue[4];
    if (centerSticker !== CENTER_COLOR_BY_FACE[faceId]) {
      errors.push(
        `${faceId} center must be ${CENTER_COLOR_BY_FACE[faceId]}.`,
      );
      continue;
    }

    cubeState[faceId] = [...faceValue];
  }

  for (const key of Object.keys(object.data)) {
    if (!isFaceId(key)) {
      errors.push(`Unexpected face key "${key}" in cubeState.`);
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return success(cubeState);
}

export function parseCubeEnv(env: NodeJS.ProcessEnv): ParseResult<CubeServiceEnv> {
  const errors: string[] = [];

  const nextPublicAppUrl = parseRequiredUrl(
    env.NEXT_PUBLIC_APP_URL,
    "NEXT_PUBLIC_APP_URL",
    errors,
  );
  const visionServiceUrl = parseRequiredUrl(
    env.VISION_SERVICE_URL,
    "VISION_SERVICE_URL",
    errors,
  );

  const solverMode = env.SOLVER_MODE;
  if (!solverMode || !SOLVER_MODES.includes(solverMode as (typeof SOLVER_MODES)[number])) {
    errors.push(`SOLVER_MODE must be one of: ${SOLVER_MODES.join(", ")}.`);
  }

  const maxFaceUploadBytes = parsePositiveInteger(
    env.MAX_FACE_UPLOAD_BYTES,
    "MAX_FACE_UPLOAD_BYTES",
    errors,
  );

  if (errors.length > 0) {
    return failure(errors);
  }

  return success({
    nextPublicAppUrl,
    visionServiceUrl,
    solverMode: solverMode as CubeServiceEnv["solverMode"],
    maxFaceUploadBytes,
  });
}

export function assertValidAnalyzeCubeRequest(input: unknown): AnalyzeCubeRequest {
  const result = parseAnalyzeCubeRequest(input);
  if (!result.success) {
    throw new SchemaError("Invalid analyze request.", result.errors);
  }

  return result.data;
}

export function assertValidSolveCubeRequest(input: unknown): SolveCubeRequest {
  const result = parseSolveCubeRequest(input);
  if (!result.success) {
    throw new SchemaError("Invalid solve request.", result.errors);
  }

  return result.data;
}

export function assertValidCubeEnv(env: NodeJS.ProcessEnv): CubeServiceEnv {
  const result = parseCubeEnv(env);
  if (!result.success) {
    throw new SchemaError("Invalid cube service environment.", result.errors);
  }

  return result.data;
}

function parseFaceCaptureInput(
  input: unknown,
  index: number,
): ParseResult<FaceCaptureInput> {
  const result = asRecord(input, `captures[${index}] must be an object.`);
  if (!result.success) {
    return result;
  }

  const errors: string[] = [];
  const faceId = result.data.faceId;
  const imageBase64 = result.data.imageBase64;
  const mimeType = result.data.mimeType;
  const capturedAt = parseOptionalString(
    result.data.capturedAt,
    `captures[${index}].capturedAt`,
    errors,
  );

  if (!isFaceId(faceId)) {
    errors.push(
      `captures[${index}].faceId must be one of: ${FACE_IDS.join(", ")}.`,
    );
  }

  if (typeof imageBase64 !== "string" || imageBase64.trim().length === 0) {
    errors.push(`captures[${index}].imageBase64 must be a non-empty string.`);
  }

  if (
    typeof mimeType !== "string" ||
    !IMAGE_MIME_TYPES.includes(mimeType as (typeof IMAGE_MIME_TYPES)[number])
  ) {
    errors.push(
      `captures[${index}].mimeType must be one of: ${IMAGE_MIME_TYPES.join(", ")}.`,
    );
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const parsedFaceId = faceId as FaceCaptureInput["faceId"];
  const parsedImageBase64 = imageBase64 as string;
  const parsedMimeType = mimeType as FaceCaptureInput["mimeType"];

  return success({
    faceId: parsedFaceId,
    imageBase64: parsedImageBase64,
    mimeType: parsedMimeType,
    capturedAt,
  });
}

function parseRequiredUrl(
  value: string | undefined,
  key: string,
  errors: string[],
): string {
  if (!value) {
    errors.push(`${key} is required.`);
    return "";
  }

  try {
    return new URL(value).toString();
  } catch {
    errors.push(`${key} must be a valid absolute URL.`);
    return "";
  }
}

function parsePositiveInteger(
  value: string | undefined,
  key: string,
  errors: string[],
): number {
  if (!value) {
    errors.push(`${key} is required.`);
    return 0;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    errors.push(`${key} must be a positive integer.`);
    return 0;
  }

  return parsedValue;
}

function parseOptionalString(
  value: unknown,
  key: string,
  errors: string[],
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${key} must be a non-empty string when provided.`);
    return undefined;
  }

  return value;
}

function asRecord(
  value: unknown,
  message: string,
): ParseResult<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return failure([message]);
  }

  return success(value as Record<string, unknown>);
}

function success<T>(data: T): ParseResult<T> {
  return {
    success: true,
    data,
  };
}

function failure(errors: string[]): ParseFailure {
  return {
    success: false,
    errors,
  };
}
