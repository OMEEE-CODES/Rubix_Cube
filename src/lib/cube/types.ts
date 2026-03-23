import type {
  CENTER_COLOR_BY_FACE,
  CUBE_COLORS,
  FACE_IDS,
  IMAGE_MIME_TYPES,
  SOLVER_MODES,
} from "@/lib/cube/constants";

export type FaceId = (typeof FACE_IDS)[number];
export type CubeColor = (typeof CUBE_COLORS)[number];
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];
export type SolverMode = (typeof SOLVER_MODES)[number];

export type CubeCenterColorByFace = typeof CENTER_COLOR_BY_FACE;
export type CubeStateNotation = string;
export type CubeFaceStickers = CubeColor[];
export type CubeState = Record<FaceId, CubeFaceStickers>;

export type FaceCaptureInput = {
  faceId: FaceId;
  imageBase64: string;
  mimeType: ImageMimeType;
  capturedAt?: string;
};

export type AnalyzeCubeRequest = {
  sessionId?: string;
  captures: FaceCaptureInput[];
};

export type StickerDetection = {
  index: number;
  color: CubeColor;
  confidence: number;
};

export type FaceAnalysis = {
  faceId: FaceId;
  stickers: CubeFaceStickers;
  detections: StickerDetection[];
  averageConfidence: number;
  source: "vision" | "manual";
};

export type AnalyzeCubeResponse = {
  sessionId: string;
  faces: Partial<Record<FaceId, FaceAnalysis>>;
  missingFaces: FaceId[];
  isComplete: boolean;
  overallConfidence: number;
  warnings: string[];
};

export type VisionAnalyzeFacesRequest = {
  captures: FaceCaptureInput[];
};

export type VisionAnalyzeFacesResponse = {
  faces: FaceAnalysis[];
  warnings: string[];
};

export type SolvePreference = "fastest" | "balanced" | "beginner";

export type SolveCubeRequest = {
  sessionId?: string;
  cubeState: CubeState;
  preference?: SolvePreference;
};

export type SolvePath = {
  id: string;
  label: string;
  description: string;
  moveCount: number;
  moves: string[];
};

export type SolveCubeResponse = {
  cubeState: CubeStateNotation;
  shortest: SolvePath;
  alternatives: SolvePath[];
  totalAlternatives: number;
  confidence: number;
  warnings: string[];
};

export type CubeStateValidationResult = {
  isValid: boolean;
  notation: CubeStateNotation;
  colorCounts: Record<CubeColor, number>;
  errors: string[];
  warnings: string[];
};

export type CubeServiceEnv = {
  nextPublicAppUrl: string;
  visionServiceUrl: string;
  solverMode: SolverMode;
  maxFaceUploadBytes: number;
};

export type ParseSuccess<T> = {
  success: true;
  data: T;
};

export type ParseFailure = {
  success: false;
  errors: string[];
};

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;
