import type { Quote } from "./quote";

/** Stable quote fields returned by GET /api/quotes and GET /api/quotes/best. */
export type QuoteResponse = Quote;

/** Unified API error body. */
export type ApiErrorResponse = {
  error: string;
  code: string;
};

/** Source entry returned by GET /api/sources. */
export type SourceResponse = {
  source: string;
  last_fetched_at: string | null;
  enabled?: boolean;
  catalog_url?: string;
};

export const API_ERROR_CODES = {
  MISSING_BRAND: "MISSING_BRAND",
  INVALID_BRAND: "INVALID_BRAND",
  UNKNOWN_BRAND: "UNKNOWN_BRAND",
  INVALID_FACE_VALUE: "INVALID_FACE_VALUE",
  DB_ERROR: "DB_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
