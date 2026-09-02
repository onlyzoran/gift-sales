import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  collectKupikodAppleQuotes,
  computeDiscountPct,
  createFixtureFetch,
  parseCatalogProductUrls,
  parseOldPriceRub,
  parseProductQuote,
  parseProductSlug,
  slugFromProductUrl,
} from "./kupikod";

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/kupikod",
);
const FETCHED_AT = "2026-09-02T09:00:00.000Z";

async function readFixture(name: string): Promise<string> {
  return readFile(join(FIXTURES_DIR, name), "utf8");
}

describe("parseProductSlug", () => {
  it("parses RUB, USD and TRY slugs", () => {
    assert.deepEqual(parseProductSlug("apple-itunes-500-rub-ru"), {
      face_value: 500,
      face_currency: "RUB",
      region: "RU",
    });
    assert.deepEqual(parseProductSlug("apple-itunes-5-usd-us"), {
      face_value: 5,
      face_currency: "USD",
      region: "US",
    });
    assert.deepEqual(parseProductSlug("apple-itunes-25-try-tr"), {
      face_value: 25,
      face_currency: "TRY",
      region: "TR",
    });
  });

  it("returns null for invalid slugs", () => {
    assert.equal(parseProductSlug("steam-wallet-1000-rub-ru"), null);
    assert.equal(parseProductSlug("apple-itunes"), null);
  });
});

describe("slugFromProductUrl", () => {
  it("extracts slug from kupikod product URL", () => {
    assert.equal(
      slugFromProductUrl("https://kupikod.com/shop/apple-itunes-5-usd-us"),
      "apple-itunes-5-usd-us",
    );
  });
});

describe("parseCatalogProductUrls", () => {
  it("reads ItemList URLs from catalog fixture", async () => {
    const html = await readFixture("catalog.html");
    const urls = parseCatalogProductUrls(html);

    assert.equal(urls.length, 20);
    assert.equal(urls[0], "https://kupikod.com/shop/apple-itunes-500-rub-ru");
    assert.equal(urls[2], "https://kupikod.com/shop/apple-itunes-5-usd-us");
  });
});

describe("parseOldPriceRub", () => {
  it("extracts oldPriceRub from product HTML", async () => {
    const html = await readFixture("apple-itunes-5-usd-us.html");
    assert.equal(parseOldPriceRub(html, 550), 2750);
  });

  it("returns null when old price is absent", () => {
    const html = '<span>&quot;priceRub&quot;:[0,100],&quot;forSale&quot;:[0,true]</span>';
    assert.equal(parseOldPriceRub(html, 100), null);
  });
});

describe("computeDiscountPct", () => {
  it("calculates rounded discount percentage", () => {
    assert.equal(computeDiscountPct(550, 2750), 80);
    assert.equal(computeDiscountPct(4028, 4426), 9);
  });

  it("returns null when there is no discount", () => {
    assert.equal(computeDiscountPct(100, null), null);
    assert.equal(computeDiscountPct(100, 100), null);
    assert.equal(computeDiscountPct(100, 90), null);
  });
});

describe("parseProductQuote", () => {
  it("parses USD card with discount from fixture", async () => {
    const html = await readFixture("apple-itunes-5-usd-us.html");
    const quote = parseProductQuote(
      html,
      FETCHED_AT,
      "https://kupikod.com/shop/apple-itunes-5-usd-us",
    );

    assert.deepEqual(quote, {
      brand: "apple",
      face_value: 5,
      face_currency: "USD",
      region: "US",
      price_rub: 550,
      price_rub_was: 2750,
      discount_pct: 80,
      source: "kupikod",
      source_url: "https://kupikod.com/shop/apple-itunes-5-usd-us",
      fetched_at: FETCHED_AT,
    });
  });

  it("parses RUB card with optional old price", async () => {
    const html = await readFixture("apple-itunes-2000-rub-ru.html");
    const quote = parseProductQuote(
      html,
      FETCHED_AT,
      "https://kupikod.com/shop/apple-itunes-2000-rub-ru",
    );

    assert.equal(quote?.face_value, 2000);
    assert.equal(quote?.face_currency, "RUB");
    assert.equal(quote?.region, "RU");
    assert.equal(quote?.price_rub, 4028);
    assert.equal(quote?.price_rub_was, 4426);
    assert.equal(quote?.discount_pct, 9);
  });

  it("parses TRY card", async () => {
    const html = await readFixture("apple-itunes-25-try-tr.html");
    const quote = parseProductQuote(
      html,
      FETCHED_AT,
      "https://kupikod.com/shop/apple-itunes-25-try-tr",
    );

    assert.equal(quote?.face_value, 25);
    assert.equal(quote?.face_currency, "TRY");
    assert.equal(quote?.region, "TR");
    assert.equal(quote?.price_rub, 63);
    assert.equal(quote?.price_rub_was, 74);
    assert.equal(quote?.discount_pct, 15);
  });
});

describe("collectKupikodAppleQuotes snapshot", () => {
  it("collects fixture-backed quotes in stable order", async () => {
    const quotes = await collectKupikodAppleQuotes({
      fetchHtml: createFixtureFetch(),
      fetchedAt: FETCHED_AT,
      productUrls: [
        "https://kupikod.com/shop/apple-itunes-5-usd-us",
        "https://kupikod.com/shop/apple-itunes-2000-rub-ru",
        "https://kupikod.com/shop/apple-itunes-25-try-tr",
      ],
    });

    assert.equal(quotes.length, 3);
    assert.deepEqual(
      quotes.map((quote) => ({
        brand: quote.brand,
        face_value: quote.face_value,
        face_currency: quote.face_currency,
        region: quote.region,
        price_rub: quote.price_rub,
        price_rub_was: quote.price_rub_was,
        discount_pct: quote.discount_pct,
        source: quote.source,
      })),
      [
        {
          brand: "apple",
          face_value: 2000,
          face_currency: "RUB",
          region: "RU",
          price_rub: 4028,
          price_rub_was: 4426,
          discount_pct: 9,
          source: "kupikod",
        },
        {
          brand: "apple",
          face_value: 25,
          face_currency: "TRY",
          region: "TR",
          price_rub: 63,
          price_rub_was: 74,
          discount_pct: 15,
          source: "kupikod",
        },
        {
          brand: "apple",
          face_value: 5,
          face_currency: "USD",
          region: "US",
          price_rub: 550,
          price_rub_was: 2750,
          discount_pct: 80,
          source: "kupikod",
        },
      ],
    );
  });

  it("walks full catalog fixture without live HTTP", async () => {
    const quotes = await collectKupikodAppleQuotes({
      fetchHtml: async (url) => {
        if (url.endsWith("appstore-itunes")) {
          return readFixture("catalog.html");
        }

        const slug = slugFromProductUrl(url);
        if (!slug) {
          throw new Error(`Missing fixture for ${url}`);
        }

        try {
          return await readFixture(`${slug}.html`);
        } catch {
          return "";
        }
      },
      fetchedAt: FETCHED_AT,
    });

    assert.equal(quotes.length, 3);
    assert.deepEqual(
      quotes.map((quote) => quote.source_url),
      [
        "https://kupikod.com/shop/apple-itunes-2000-rub-ru",
        "https://kupikod.com/shop/apple-itunes-100-try-tr",
        "https://kupikod.com/shop/apple-itunes-5-usd-us",
      ],
    );
  });
});
