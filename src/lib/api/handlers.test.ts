import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { QuoteRepository, type Quote } from "@gift-sales/storage";

import { resetBrandsCache } from "./brands";
import {
  parseOptionalFaceValue,
  parseRequiredBrand,
} from "./query";
import { buildSourceResponses } from "./sources";

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

describe("parseRequiredBrand", () => {
  let brandsPath: string;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "gift-sales-api-"));
    brandsPath = join(tempDir, "brands.yaml");
    writeFileSync(
      brandsPath,
      `brands:\n  - apple\n  - steam\n`,
      "utf8",
    );
    process.env.BRANDS_CONFIG_PATH = brandsPath;
    resetBrandsCache();
  });

  afterEach(() => {
    delete process.env.BRANDS_CONFIG_PATH;
    resetBrandsCache();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns 400 when brand is missing", () => {
    const result = parseRequiredBrand(null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.response.status, 400);
    }
  });

  it("returns 404 for unknown brand", () => {
    const result = parseRequiredBrand("netflix");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.response.status, 404);
    }
  });

  it("accepts a known brand", () => {
    const result = parseRequiredBrand("apple");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.brand, "apple");
    }
  });
});

describe("parseOptionalFaceValue", () => {
  it("rejects invalid face_value", () => {
    const result = parseOptionalFaceValue("abc");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.response.status, 400);
    }
  });

  it("accepts a positive number", () => {
    const result = parseOptionalFaceValue("100");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.faceValue, 100);
    }
  });
});

describe("buildSourceResponses", () => {
  it("merges registry entries with db timestamps", () => {
    const responses = buildSourceResponses(
      {
        sources: [
          {
            id: "kupikod",
            base_url: "https://kupikod.com",
            rate_limit_rps: 2,
            categories: [
              {
                url: "https://kupikod.com/catalog",
                brand: "apple",
              },
            ],
          },
          {
            id: "apple-app-store",
            base_url: "https://www.apple.com",
            rate_limit_rps: 1,
            categories: [
              {
                url: "https://www.apple.com/shop/gift-cards",
                brand: "apple",
              },
            ],
          },
        ],
      },
      [{ source: "kupikod", last_fetched_at: "2026-09-01T12:00:00.000Z" }],
    );

    assert.deepEqual(responses, [
      {
        id: "apple-app-store",
        base_url: "https://www.apple.com",
        categories: [
          {
            url: "https://www.apple.com/shop/gift-cards",
            brand: "apple",
          },
        ],
        last_fetched_at: null,
      },
      {
        id: "kupikod",
        base_url: "https://kupikod.com",
        categories: [
          {
            url: "https://kupikod.com/catalog",
            brand: "apple",
          },
        ],
        last_fetched_at: "2026-09-01T12:00:00.000Z",
      },
    ]);
  });
});

describe("quotes API data flow", () => {
  let tempDir: string;
  let dbPath: string;
  let brandsPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "gift-sales-api-db-"));
    dbPath = join(tempDir, "quotes.db");
    brandsPath = join(tempDir, "brands.yaml");
    writeFileSync(brandsPath, `brands:\n  - apple\n`, "utf8");
    process.env.BRANDS_CONFIG_PATH = brandsPath;

    const repo = new QuoteRepository(dbPath);
    repo.saveQuotes([
      makeQuote({
        face_value: 100,
        region: "US",
        source: "kupikod",
        price_rub: 9500,
      }),
      makeQuote({
        face_value: 100,
        region: "US",
        source: "other",
        price_rub: 9200,
      }),
      makeQuote({
        face_value: 50,
        region: "EU",
        source: "kupikod",
        price_rub: 4800,
      }),
    ]);
    repo.close();
    resetBrandsCache();
  });

  afterEach(() => {
    delete process.env.BRANDS_CONFIG_PATH;
    resetBrandsCache();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns latest quotes and best prices from the repository", () => {
    const repo = new QuoteRepository(dbPath);

    const latest = repo.getLatestQuotes({ brand: "apple" });
    assert.equal(latest.length, 3);

    const best = repo.getBestQuotes("apple");
    assert.equal(best.length, 2);
    assert.equal(
      best.find((quote) => quote.face_value === 100 && quote.region === "US")
        ?.source,
      "other",
    );

    repo.close();
  });
});
