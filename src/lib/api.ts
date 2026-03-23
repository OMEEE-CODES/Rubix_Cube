import type {
  AnalyzeCubeRequest,
  AnalyzeCubeResponse,
  SolveCubeRequest,
  SolveCubeResponse,
} from "@/lib/cube/types";

type ApiEnvelope<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: string[];
      };
    };

export class ApiClientError extends Error {
  readonly code: string;
  readonly details: string[];

  constructor(message: string, code = "UNKNOWN", details: string[] = []) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

export async function analyzeCube(request: AnalyzeCubeRequest) {
  return postJson<AnalyzeCubeRequest, AnalyzeCubeResponse>("/api/analyze", request);
}

export async function solveCube(request: SolveCubeRequest) {
  return postJson<SolveCubeRequest, SolveCubeResponse>("/api/solve", request);
}

async function postJson<TRequest, TResponse>(url: string, body: TRequest) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ApiEnvelope<TResponse>;

  if (!response.ok || !json.ok) {
    const message =
      "error" in json ? json.error.message : "Request failed unexpectedly.";
    const code = "error" in json ? json.error.code : "UNKNOWN";
    const details = "error" in json ? json.error.details ?? [] : [];
    throw new ApiClientError(message, code, details);
  }

  return json.data;
}
