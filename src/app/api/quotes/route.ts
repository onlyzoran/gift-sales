import { API_ERROR_CODES } from "@gift-sales/storage";
import { NextResponse } from "next/server";

import { withQuoteRepository } from "@/lib/api/db";
import { apiError } from "@/lib/api/errors";
import {
  parseOptionalFaceValue,
  parseOptionalRegion,
  parseRequiredBrand,
} from "@/lib/api/query";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const brandResult = parseRequiredBrand(searchParams.get("brand"));
  if (!brandResult.ok) {
    return brandResult.response;
  }

  const faceValueResult = parseOptionalFaceValue(searchParams.get("face_value"));
  if (!faceValueResult.ok) {
    return faceValueResult.response;
  }

  const region = parseOptionalRegion(searchParams.get("region"));

  try {
    const quotes = withQuoteRepository((repo) =>
      repo.getLatestQuotes({
        brand: brandResult.brand,
        face_value: faceValueResult.faceValue,
        region,
      }),
    );

    return NextResponse.json(quotes);
  } catch {
    return apiError(500, API_ERROR_CODES.DB_ERROR, "Failed to read quotes");
  }
}
