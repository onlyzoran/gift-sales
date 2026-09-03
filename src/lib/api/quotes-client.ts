import type { ApiErrorResponse, QuoteResponse } from "@gift-sales/storage";

import { apiUrl } from "./paths";

export type QuoteFilters = {
  brand: string;
  region?: string;
  faceValue?: number;
};

export class QuotesFetchError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "QuotesFetchError";
    this.status = status;
    this.code = code;
  }
}

async function parseQuotesResponse(response: Response): Promise<QuoteResponse[]> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let code: string | undefined;

    try {
      const body = (await response.json()) as ApiErrorResponse;
      message = body.error ?? message;
      code = body.code;
    } catch {
      // ignore JSON parse errors
    }

    throw new QuotesFetchError(message, response.status, code);
  }

  return (await response.json()) as QuoteResponse[];
}

function buildQuotesSearchParams(filters: QuoteFilters): URLSearchParams {
  const params = new URLSearchParams({ brand: filters.brand });

  if (filters.region) {
    params.set("region", filters.region);
  }

  if (filters.faceValue !== undefined) {
    params.set("face_value", String(filters.faceValue));
  }

  return params;
}

export async function fetchQuotes(filters: QuoteFilters): Promise<QuoteResponse[]> {
  const params = buildQuotesSearchParams(filters);
  const response = await fetch(apiUrl(`/api/quotes?${params.toString()}`));
  return parseQuotesResponse(response);
}

export async function fetchBestQuotes(brand: string): Promise<QuoteResponse[]> {
  const params = new URLSearchParams({ brand });
  const response = await fetch(apiUrl(`/api/quotes/best?${params.toString()}`));
  return parseQuotesResponse(response);
}

export type QuoteHistoryParams = {
  brand: string;
  faceValue: number;
  region: string;
  from?: string;
  to?: string;
};

export async function fetchQuoteHistory(
  params: QuoteHistoryParams,
): Promise<QuoteResponse[]> {
  const searchParams = new URLSearchParams({
    brand: params.brand,
    face_value: String(params.faceValue),
    region: params.region,
  });

  if (params.from) {
    searchParams.set("from", params.from);
  }

  if (params.to) {
    searchParams.set("to", params.to);
  }

  const response = await fetch(
    apiUrl(`/api/quotes/history?${searchParams.toString()}`),
  );
  return parseQuotesResponse(response);
}
