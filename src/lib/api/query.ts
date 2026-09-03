import { API_ERROR_CODES } from "@gift-sales/storage";

import { getKnownBrands } from "./brands";
import { apiError } from "./errors";

type BrandValidationResult =
  | { ok: true; brand: string }
  | { ok: false; response: ReturnType<typeof apiError> };

export function parseRequiredBrand(
  rawBrand: string | null,
): BrandValidationResult {
  if (rawBrand === null || rawBrand.trim() === "") {
    return {
      ok: false,
      response: apiError(
        400,
        API_ERROR_CODES.MISSING_BRAND,
        'Query parameter "brand" is required',
      ),
    };
  }

  const brand = rawBrand.trim();

  if (!/^[a-z0-9-]+$/.test(brand)) {
    return {
      ok: false,
      response: apiError(
        400,
        API_ERROR_CODES.INVALID_BRAND,
        'Query parameter "brand" must contain only lowercase letters, digits, and hyphens',
      ),
    };
  }

  const knownBrands = getKnownBrands();
  if (!knownBrands.has(brand)) {
    return {
      ok: false,
      response: apiError(
        404,
        API_ERROR_CODES.UNKNOWN_BRAND,
        `Unknown brand "${brand}"`,
      ),
    };
  }

  return { ok: true, brand };
}

export function parseOptionalFaceValue(
  rawFaceValue: string | null,
):
  | { ok: true; faceValue: number | undefined }
  | { ok: false; response: ReturnType<typeof apiError> } {
  if (rawFaceValue === null || rawFaceValue.trim() === "") {
    return { ok: true, faceValue: undefined };
  }

  const faceValue = Number(rawFaceValue);
  if (!Number.isFinite(faceValue) || faceValue <= 0) {
    return {
      ok: false,
      response: apiError(
        400,
        API_ERROR_CODES.INVALID_FACE_VALUE,
        'Query parameter "face_value" must be a positive number',
      ),
    };
  }

  return { ok: true, faceValue };
}

export function parseOptionalRegion(
  rawRegion: string | null,
): string | undefined {
  if (rawRegion === null || rawRegion.trim() === "") {
    return undefined;
  }

  return rawRegion.trim();
}

type RequiredFaceValueResult =
  | { ok: true; faceValue: number }
  | { ok: false; response: ReturnType<typeof apiError> };

export function parseRequiredFaceValue(
  rawFaceValue: string | null,
): RequiredFaceValueResult {
  if (rawFaceValue === null || rawFaceValue.trim() === "") {
    return {
      ok: false,
      response: apiError(
        400,
        API_ERROR_CODES.MISSING_FACE_VALUE,
        'Query parameter "face_value" is required',
      ),
    };
  }

  const faceValue = Number(rawFaceValue);
  if (!Number.isFinite(faceValue) || faceValue <= 0) {
    return {
      ok: false,
      response: apiError(
        400,
        API_ERROR_CODES.INVALID_FACE_VALUE,
        'Query parameter "face_value" must be a positive number',
      ),
    };
  }

  return { ok: true, faceValue };
}

type RequiredRegionResult =
  | { ok: true; region: string }
  | { ok: false; response: ReturnType<typeof apiError> };

export function parseRequiredRegion(
  rawRegion: string | null,
): RequiredRegionResult {
  if (rawRegion === null || rawRegion.trim() === "") {
    return {
      ok: false,
      response: apiError(
        400,
        API_ERROR_CODES.MISSING_REGION,
        'Query parameter "region" is required',
      ),
    };
  }

  return { ok: true, region: rawRegion.trim() };
}

type OptionalIsoDateResult =
  | { ok: true; value: string | undefined }
  | { ok: false; response: ReturnType<typeof apiError> };

function parseOptionalIso8601Utc(
  rawValue: string | null,
  paramName: "from" | "to",
): OptionalIsoDateResult {
  if (rawValue === null || rawValue.trim() === "") {
    return { ok: true, value: undefined };
  }

  const trimmed = rawValue.trim();
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    const code =
      paramName === "from"
        ? API_ERROR_CODES.INVALID_FROM
        : API_ERROR_CODES.INVALID_TO;
    return {
      ok: false,
      response: apiError(
        400,
        code,
        `Query parameter "${paramName}" must be a valid ISO 8601 UTC datetime`,
      ),
    };
  }

  return { ok: true, value: new Date(timestamp).toISOString() };
}

export function parseOptionalFrom(
  rawFrom: string | null,
): OptionalIsoDateResult {
  return parseOptionalIso8601Utc(rawFrom, "from");
}

export function parseOptionalTo(rawTo: string | null): OptionalIsoDateResult {
  return parseOptionalIso8601Utc(rawTo, "to");
}
