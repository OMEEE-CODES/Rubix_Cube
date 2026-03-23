import { NextResponse } from "next/server";

type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "NOT_IMPLEMENTED"
  | "INTERNAL_ERROR";

type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: string[];
  };
};

type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessBody<T>>(
    {
      ok: true,
      data,
    },
    { status },
  );
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: string[],
) {
  return NextResponse.json<ApiErrorBody>(
    {
      ok: false,
      error: {
        code,
        message,
        details: details && details.length > 0 ? details : undefined,
      },
    },
    { status },
  );
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
}
