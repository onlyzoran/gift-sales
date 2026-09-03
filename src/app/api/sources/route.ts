import { API_ERROR_CODES } from "@gift-sales/storage";
import { NextResponse } from "next/server";

import { withQuoteRepository } from "@/lib/api/db";
import { apiError } from "@/lib/api/errors";
import {
  buildSourceResponses,
  loadSourcesRegistryFromFile,
} from "@/lib/api/sources";

export async function GET(): Promise<Response> {
  try {
    const registry = loadSourcesRegistryFromFile();
    const sources = withQuoteRepository((repo) =>
      buildSourceResponses(registry, repo.getSourceLastFetchedAt()),
    );

    return NextResponse.json(sources);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("sources.yaml:")) {
      return apiError(
        500,
        API_ERROR_CODES.CONFIG_ERROR,
        "Failed to load sources config",
      );
    }

    return apiError(500, API_ERROR_CODES.DB_ERROR, "Failed to read sources");
  }
}
