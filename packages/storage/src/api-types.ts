import type { Quote } from "./quote";

/** Stable quote fields returned by GET /api/quotes and GET /api/quotes/best. */
export type QuoteResponse = Quote;

/** Unified API error body. */
export type ApiErrorResponse = {
  error: string;
  code: string;
};

/** Category entry within a source from sources.yaml. */
export type SourceCategoryResponse = {
  url: string;
  brand: string;
};

/** Source entry returned by GET /api/sources. */
export type SourceResponse = {
  id: string;
  base_url: string;
  categories: SourceCategoryResponse[];
  last_fetched_at: string | null;
};

export const API_ERROR_CODES = {
  MISSING_BRAND: "MISSING_BRAND",
  INVALID_BRAND: "INVALID_BRAND",
  UNKNOWN_BRAND: "UNKNOWN_BRAND",
  MISSING_FACE_VALUE: "MISSING_FACE_VALUE",
  INVALID_FACE_VALUE: "INVALID_FACE_VALUE",
  MISSING_REGION: "MISSING_REGION",
  INVALID_FROM: "INVALID_FROM",
  INVALID_TO: "INVALID_TO",
  DB_ERROR: "DB_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
