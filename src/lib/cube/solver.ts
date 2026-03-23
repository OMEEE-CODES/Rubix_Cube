import Cube from "cubejs";

import type {
  CubeState,
  CubeStateValidationResult,
  SolveCubeResponse,
  SolvePath,
  SolvePreference,
  SolverMode,
} from "@/lib/cube/types";
import { assertValidCubeState, toCubeStateNotation, validateCubeState } from "@/lib/cube/validate-state";

const MOCK_SOLUTIONS: Record<SolvePreference, SolvePath[]> = {
  fastest: [
    {
      id: "fastest-primary",
      label: "Shortest path",
      description: "Lowest move count found in mock solver mode.",
      moveCount: 18,
      moves: ["R", "U", "R'", "U'", "F", "R", "F'"],
    },
    {
      id: "fastest-alt-a",
      label: "Short alternate",
      description: "Close move count with a different early branch.",
      moveCount: 19,
      moves: ["U", "R", "U'", "R'", "U'", "F'", "U", "F"],
    },
    {
      id: "fastest-alt-b",
      label: "Rotation-friendly",
      description: "Slightly longer, but easier to execute without regrips.",
      moveCount: 20,
      moves: ["F", "R", "U", "R'", "U'", "F'"],
    },
  ],
  balanced: [
    {
      id: "balanced-primary",
      label: "Best overall path",
      description: "Balanced for move count and human readability.",
      moveCount: 20,
      moves: ["R", "U", "R'", "U", "R", "U2", "R'"],
    },
    {
      id: "balanced-alt-a",
      label: "Stable finger tricks",
      description: "A slightly longer route with repeatable move groups.",
      moveCount: 21,
      moves: ["U", "R", "U'", "L'", "U", "R'", "U'", "L"],
    },
    {
      id: "balanced-alt-b",
      label: "Low-pause route",
      description: "Keeps the solve rhythm consistent across the middle steps.",
      moveCount: 22,
      moves: ["F", "U", "R", "U'", "R'", "F'"],
    },
  ],
  beginner: [
    {
      id: "beginner-primary",
      label: "Easy to follow",
      description: "Longer path grouped into recognizable beginner steps.",
      moveCount: 26,
      moves: ["R", "U", "R'", "U'", "R'", "F", "R", "F'"],
    },
    {
      id: "beginner-alt-a",
      label: "Layer-by-layer",
      description: "Alternative beginner-friendly pattern with repeated triggers.",
      moveCount: 28,
      moves: ["U", "R", "U'", "R'", "U'", "F'", "U", "F"],
    },
    {
      id: "beginner-alt-b",
      label: "Corner-first route",
      description: "Useful if the user prefers slower but clearer sequences.",
      moveCount: 29,
      moves: ["R", "U2", "R'", "U'", "R", "U", "R'"],
    },
  ],
};

let solverInitialized = false;

export class CubeSolverError extends Error {
  readonly issues: string[];

  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = "CubeSolverError";
    this.issues = issues;
  }
}

export async function solveCubeState({
  cubeState,
  preference = "balanced",
  solverMode,
}: {
  cubeState: CubeState;
  preference?: SolvePreference;
  solverMode: SolverMode;
}): Promise<SolveCubeResponse> {
  const validation = assertValidCubeState(cubeState);

  if (solverMode === "mock") {
    return buildMockSolveResponse(validation, preference);
  }

  await ensureSolverInitialized();
  return buildCubejsSolveResponse(cubeState, validation, preference);
}

export function previewCubeStateValidation(cubeState: CubeState) {
  return validateCubeState(cubeState);
}

async function ensureSolverInitialized() {
  if (solverInitialized) {
    return;
  }

  Cube.initSolver();
  solverInitialized = true;
}

function buildMockSolveResponse(
  validation: CubeStateValidationResult,
  preference: SolvePreference,
): SolveCubeResponse {
  const [shortest, ...alternatives] = MOCK_SOLUTIONS[preference];

  return {
    cubeState: validation.notation,
    shortest,
    alternatives,
    totalAlternatives: alternatives.length,
    confidence: validation.warnings.length > 0 ? 0.99 : 0.81,
    warnings: [
      ...validation.warnings,
      "Using mock solver mode. cubejs integration is available when SOLVER_MODE=cubejs.",
    ],
  };
}

function buildCubejsSolveResponse(
  cubeState: CubeState,
  validation: CubeStateValidationResult,
  preference: SolvePreference,
): SolveCubeResponse {
  const cube = Cube.fromString(toCubeStateNotation(cubeState));

  if (cube.isSolved()) {
    return {
      cubeState: validation.notation,
      shortest: {
        id: "already-solved",
        label: "Already solved",
        description: "The scanned cube is already in a solved state.",
        moveCount: 0,
        moves: [],
      },
      alternatives: [],
      totalAlternatives: 0,
      confidence: 0.99,
      warnings: [...validation.warnings],
    };
  }

  const algorithm = cube.solve(maxDepthForPreference(preference)).trim();
  if (algorithm.length === 0) {
    throw new CubeSolverError("Solver returned an empty algorithm for a non-solved cube.");
  }

  const moves = algorithm.split(/\s+/).filter(Boolean);

  return {
    cubeState: validation.notation,
    shortest: {
      id: `cubejs-${preference}`,
      label: labelForPreference(preference),
      description: descriptionForPreference(preference),
      moveCount: moves.length,
      moves,
    },
    alternatives: [],
    totalAlternatives: 0,
    confidence: 0.94,
    warnings: [...validation.warnings],
  };
}

function maxDepthForPreference(preference: SolvePreference) {
  switch (preference) {
    case "fastest":
      return 22;
    case "balanced":
      return 24;
    case "beginner":
      return 26;
  }
}

function labelForPreference(preference: SolvePreference) {
  switch (preference) {
    case "fastest":
      return "Fastest cubejs path";
    case "balanced":
      return "Balanced cubejs path";
    case "beginner":
      return "Beginner-friendly cubejs path";
  }
}

function descriptionForPreference(preference: SolvePreference) {
  switch (preference) {
    case "fastest":
      return "A direct cubejs solve biased toward the shortest search depth.";
    case "balanced":
      return "A cubejs solve with slightly more search space for stable results.";
    case "beginner":
      return "A cubejs solve exposed as a single path for a guided walkthrough.";
  }
}
