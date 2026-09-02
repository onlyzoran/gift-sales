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
