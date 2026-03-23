import { assertValidCubeEnv, assertValidSolveCubeRequest, SchemaError } from "@/lib/cube/schemas";
import { CubeSolverError, solveCubeState } from "@/lib/cube/solver";
import { CubeStateValidationError } from "@/lib/cube/validate-state";
import { apiError, apiSuccess, readJsonBody } from "@/lib/server/api-response";

export async function POST(request: Request) {
  try {
    const env = assertValidCubeEnv(process.env);
    const body = await readJsonBody(request);
    const solveRequest = assertValidSolveCubeRequest(body);
    const response = await solveCubeState({
      cubeState: solveRequest.cubeState,
      preference: solveRequest.preference,
      solverMode: env.solverMode,
    });

    return apiSuccess(response);
  } catch (error) {
    if (error instanceof SchemaError) {
      return apiError(400, "INVALID_REQUEST", error.message, error.issues);
    }

    if (error instanceof CubeStateValidationError) {
      return apiError(422, "INVALID_REQUEST", error.message, error.issues);
    }

    if (error instanceof CubeSolverError) {
      return apiError(500, "INTERNAL_ERROR", error.message, error.issues);
    }

    if (error instanceof Error && error.message === "INVALID_JSON") {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }

    return apiError(
      500,
      "INTERNAL_ERROR",
      "Unexpected error while preparing solve output.",
    );
  }
}
