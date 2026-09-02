import { NextResponse } from "next/server";

import type { ApiErrorCode, ApiErrorResponse } from "@gift-sales/storage";

export function apiError(
  status: number,
  code: ApiErrorCode,
  error: string,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error, code }, { status });
}
