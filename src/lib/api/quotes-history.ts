import { API_ERROR_CODES } from "@gift-sales/storage";
import { NextResponse } from "next/server";

import { withQuoteRepository } from "@/lib/api/db";
import { apiError } from "@/lib/api/errors";
import {
  parseOptionalFrom,
  parseOptionalTo,
  parseRequiredBrand,
  parseRequiredFaceValue,
  parseRequiredRegion,
} from "@/lib/api/query";

export async function handleGetQuoteHistory(
  request: Request,
): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const brandResult = parseRequiredBrand(searchParams.get("brand"));
  if (!brandResult.ok) {
    return brandResult.response;
  }

  const faceValueResult = parseRequiredFaceValue(
    searchParams.get("face_value"),
  );
  if (!faceValueResult.ok) {
    return faceValueResult.response;
  }

  const regionResult = parseRequiredRegion(searchParams.get("region"));
  if (!regionResult.ok) {
    return regionResult.response;
  }

  const fromResult = parseOptionalFrom(searchParams.get("from"));
  if (!fromResult.ok) {
    return fromResult.response;
  }

  const toResult = parseOptionalTo(searchParams.get("to"));
  if (!toResult.ok) {
    return toResult.response;
  }

  try {
    const quotes = withQuoteRepository((repo) =>
      repo.getQuoteHistory({
        brand: brandResult.brand,
        face_value: faceValueResult.faceValue,
        region: regionResult.region,
        from: fromResult.value,
        to: toResult.value,
      }),
    );

    return NextResponse.json(quotes);
  } catch {
    return apiError(500, API_ERROR_CODES.DB_ERROR, "Failed to read quotes");
  }
}
