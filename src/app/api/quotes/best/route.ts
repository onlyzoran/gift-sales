import { API_ERROR_CODES } from "@gift-sales/storage";
import { NextResponse } from "next/server";

import { withQuoteRepository } from "@/lib/api/db";
import { apiError } from "@/lib/api/errors";
import { parseRequiredBrand } from "@/lib/api/query";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const brandResult = parseRequiredBrand(searchParams.get("brand"));
  if (!brandResult.ok) {
    return brandResult.response;
  }

  try {
    const quotes = withQuoteRepository((repo) =>
      repo.getBestQuotes(brandResult.brand),
    );

    return NextResponse.json(quotes);
  } catch {
    return apiError(500, API_ERROR_CODES.DB_ERROR, "Failed to read quotes");
  }
}
