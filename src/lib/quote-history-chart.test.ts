import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatHistoryDateRange,
  transformQuoteHistoryForChart,
} from "./quote-history-chart";

const sampleQuote = {
  brand: "apple",
  face_value: 100,
  face_currency: "USD",
  region: "US",
  price_rub: 9500,
  price_rub_was: null,
  discount_pct: null,
  source: "kupikod",
  source_url: null,
  fetched_at: "2026-09-01T10:00:00.000Z",
};

describe("transformQuoteHistoryForChart", () => {
  it("maps quotes to chart points with Date on the x axis", () => {
    const points = transformQuoteHistoryForChart([sampleQuote]);

    assert.equal(points.length, 1);
    assert.equal(points[0]?.source, "kupikod");
    assert.equal(points[0]?.price_rub, 9500);
    assert.equal(points[0]?.fetched_at.toISOString(), "2026-09-01T10:00:00.000Z");
  });
});

describe("formatHistoryDateRange", () => {
  it("returns null for empty history", () => {
    assert.equal(formatHistoryDateRange([]), null);
  });

  it("returns a single timestamp when all points share fetched_at", () => {
    const range = formatHistoryDateRange([sampleQuote, { ...sampleQuote, source: "other" }]);

    assert.ok(range);
    assert.match(range, /1\s+сент\./);
  });

  it("returns a range when history spans multiple timestamps", () => {
    const range = formatHistoryDateRange([
      sampleQuote,
      { ...sampleQuote, fetched_at: "2026-09-02T12:00:00.000Z" },
    ]);

    assert.ok(range);
    assert.match(range, /—/);
  });
});
