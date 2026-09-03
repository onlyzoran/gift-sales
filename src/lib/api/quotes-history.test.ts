import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { API_ERROR_CODES, QuoteRepository, type Quote } from "@gift-sales/storage";

import { resetBrandsCache } from "./brands";
import { handleGetQuoteHistory } from "./quotes-history";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    brand: "apple",
    face_value: 100,
    face_currency: "USD",
    region: "US",
    price_rub: 9500,
    price_rub_was: null,
    discount_pct: null,
    source: "kupikod",
    source_url: "https://example.com",
    fetched_at: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function historyUrl(query: Record<string, string>): string {
  const params = new URLSearchParams(query);
  return `http://localhost/gift-sales/api/quotes/history?${params.toString()}`;
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe("GET /api/quotes/history handler", () => {
  let tempDir: string;
  let dbPath: string;
  let brandsPath: string;
  let previousDbPath: string | undefined;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "gift-sales-history-api-"));
    dbPath = join(tempDir, "quotes.db");
    brandsPath = join(tempDir, "brands.yaml");
    writeFileSync(brandsPath, `brands:\n  - apple\n`, "utf8");
    process.env.BRANDS_CONFIG_PATH = brandsPath;
    previousDbPath = process.env.GIFT_SALES_DB;
    process.env.GIFT_SALES_DB = dbPath;

    const repo = new QuoteRepository(dbPath);
    repo.saveQuotes([
      makeQuote({
        source: "store-a",
        price_rub: 9500,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        source: "store-b",
        price_rub: 9400,
        fetched_at: "2026-09-01T12:00:00.000Z",
      }),
      makeQuote({
        source: "store-a",
        price_rub: 9600,
        fetched_at: "2026-09-01T11:00:00.000Z",
      }),
      makeQuote({
        face_value: 50,
        region: "EU",
        source: "store-a",
        fetched_at: "2026-09-01T13:00:00.000Z",
      }),
    ]);
    repo.close();
    resetBrandsCache();
  });

  afterEach(() => {
    delete process.env.BRANDS_CONFIG_PATH;
    if (previousDbPath === undefined) {
      delete process.env.GIFT_SALES_DB;
    } else {
      process.env.GIFT_SALES_DB = previousDbPath;
    }
    resetBrandsCache();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns quote history sorted by fetched_at ascending", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "100",
          region: "US",
        }),
      ),
    );

    assert.equal(response.status, 200);
    const quotes = await readJson<Quote[]>(response);
    assert.equal(quotes.length, 3);
    assert.deepEqual(
      quotes.map((quote) => quote.fetched_at),
      [
        "2026-09-01T10:00:00.000Z",
        "2026-09-01T11:00:00.000Z",
        "2026-09-01T12:00:00.000Z",
      ],
    );
  });

  it("returns an empty array when no history exists", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "100",
          region: "JP",
        }),
      ),
    );

    assert.equal(response.status, 200);
    const quotes = await readJson<Quote[]>(response);
    assert.deepEqual(quotes, []);
  });

  it("filters history by from/to range", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "100",
          region: "US",
          from: "2026-09-01T10:30:00.000Z",
          to: "2026-09-01T11:30:00.000Z",
        }),
      ),
    );

    assert.equal(response.status, 200);
    const quotes = await readJson<Quote[]>(response);
    assert.equal(quotes.length, 1);
    assert.equal(quotes[0]?.fetched_at, "2026-09-01T11:00:00.000Z");
  });

  it("returns 400 when brand is missing", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          face_value: "100",
          region: "US",
        }),
      ),
    );

    assert.equal(response.status, 400);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.MISSING_BRAND);
  });

  it("returns 400 when face_value is missing", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          region: "US",
        }),
      ),
    );

    assert.equal(response.status, 400);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.MISSING_FACE_VALUE);
  });

  it("returns 400 when region is missing", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "100",
        }),
      ),
    );

    assert.equal(response.status, 400);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.MISSING_REGION);
  });

  it("returns 400 for invalid face_value", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "abc",
          region: "US",
        }),
      ),
    );

    assert.equal(response.status, 400);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.INVALID_FACE_VALUE);
  });

  it("returns 404 for unknown brand", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "netflix",
          face_value: "100",
          region: "US",
        }),
      ),
    );

    assert.equal(response.status, 404);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.UNKNOWN_BRAND);
  });

  it("returns 400 for invalid from date", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "100",
          region: "US",
          from: "not-a-date",
        }),
      ),
    );

    assert.equal(response.status, 400);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.INVALID_FROM);
  });

  it("returns 400 for invalid to date", async () => {
    const response = await handleGetQuoteHistory(
      new Request(
        historyUrl({
          brand: "apple",
          face_value: "100",
          region: "US",
          to: "yesterday",
        }),
      ),
    );

    assert.equal(response.status, 400);
    const body = await readJson<{ code: string }>(response);
    assert.equal(body.code, API_ERROR_CODES.INVALID_TO);
  });
});
