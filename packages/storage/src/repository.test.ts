import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { Quote } from "./quote";
import { initSchema } from "./schema";
import { QuoteRepository } from "./repository";
import Database from "better-sqlite3";

function makeQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    brand: "apple",
    face_value: 100,
    face_currency: "USD",
    region: "US",
    price_rub: 9500,
    price_rub_was: 10000,
    discount_pct: 5,
    source: "store-a",
    source_url: "https://example.com/apple-100",
    fetched_at: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("initSchema", () => {
  it("creates quotes table and indexes", () => {
    const db = new Database(":memory:");
    initSchema(db);

    const table = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'quotes'",
      )
      .get() as { name: string } | undefined;
    assert.equal(table?.name, "quotes");

    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'quotes'",
      )
      .all() as Array<{ name: string }>;

    const indexNames = indexes.map((row) => row.name).sort();
    assert.deepEqual(indexNames, [
      "idx_quotes_brand",
      "idx_quotes_face_value",
      "idx_quotes_fetched_at",
      "idx_quotes_lookup",
      "idx_quotes_region",
    ]);

    db.close();
  });
});

describe("QuoteRepository", () => {
  let repo: QuoteRepository;

  beforeEach(() => {
    repo = new QuoteRepository(":memory:");
  });

  afterEach(() => {
    repo.close();
  });

  it("saveQuotes inserts a batch of quotes", () => {
    const quotes = [
      makeQuote({ source: "store-a", fetched_at: "2026-09-01T10:00:00.000Z" }),
      makeQuote({ source: "store-b", fetched_at: "2026-09-01T10:05:00.000Z" }),
    ];

    repo.saveQuotes(quotes);

    const latest = repo.getLatestQuotes();
    assert.equal(latest.length, 2);
  });

  it("getLatestQuotes returns the newest quote per source key", () => {
    repo.saveQuotes([
      makeQuote({
        source: "store-a",
        price_rub: 9500,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        source: "store-a",
        price_rub: 9400,
        fetched_at: "2026-09-01T12:00:00.000Z",
      }),
      makeQuote({
        source: "store-b",
        price_rub: 9600,
        fetched_at: "2026-09-01T11:00:00.000Z",
      }),
    ]);

    const latest = repo.getLatestQuotes();
    assert.equal(latest.length, 2);

    const storeA = latest.find((quote) => quote.source === "store-a");
    assert.ok(storeA);
    assert.equal(storeA.price_rub, 9400);
    assert.equal(storeA.fetched_at, "2026-09-01T12:00:00.000Z");
  });

  it("getLatestQuotes filters by brand, face_value and region", () => {
    repo.saveQuotes([
      makeQuote({
        brand: "apple",
        face_value: 100,
        region: "US",
        source: "store-a",
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        brand: "steam",
        face_value: 50,
        region: "EU",
        source: "store-a",
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
    ]);

    const filtered = repo.getLatestQuotes({
      brand: "apple",
      face_value: 100,
      region: "US",
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.brand, "apple");
  });

  it("getQuoteHistory returns quotes ordered by fetched_at", () => {
    repo.saveQuotes([
      makeQuote({
        source: "store-a",
        price_rub: 9500,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        source: "store-a",
        price_rub: 9400,
        fetched_at: "2026-09-01T12:00:00.000Z",
      }),
      makeQuote({
        source: "store-b",
        price_rub: 9600,
        fetched_at: "2026-09-01T11:00:00.000Z",
      }),
      makeQuote({
        brand: "steam",
        face_value: 50,
        region: "EU",
        source: "store-a",
        fetched_at: "2026-09-01T13:00:00.000Z",
      }),
    ]);

    const history = repo.getQuoteHistory({
      brand: "apple",
      face_value: 100,
      region: "US",
    });

    assert.equal(history.length, 3);
    assert.deepEqual(
      history.map((quote) => quote.fetched_at),
      [
        "2026-09-01T10:00:00.000Z",
        "2026-09-01T11:00:00.000Z",
        "2026-09-01T12:00:00.000Z",
      ],
    );
  });

  it("getQuoteHistory supports from/to time range", () => {
    repo.saveQuotes([
      makeQuote({ fetched_at: "2026-09-01T09:00:00.000Z", price_rub: 9700 }),
      makeQuote({ fetched_at: "2026-09-01T10:00:00.000Z", price_rub: 9500 }),
      makeQuote({ fetched_at: "2026-09-01T12:00:00.000Z", price_rub: 9400 }),
      makeQuote({ fetched_at: "2026-09-01T15:00:00.000Z", price_rub: 9300 }),
    ]);

    const history = repo.getQuoteHistory({
      brand: "apple",
      face_value: 100,
      region: "US",
      from: "2026-09-01T10:00:00.000Z",
      to: "2026-09-01T12:00:00.000Z",
    });

    assert.equal(history.length, 2);
    assert.deepEqual(
      history.map((quote) => quote.price_rub),
      [9500, 9400],
    );
  });

  it("getBestQuotes returns the lowest price per face_value and region", () => {
    repo.saveQuotes([
      makeQuote({
        face_value: 100,
        region: "US",
        source: "store-a",
        price_rub: 9500,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        face_value: 100,
        region: "US",
        source: "store-b",
        price_rub: 9200,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        face_value: 100,
        region: "US",
        source: "store-a",
        price_rub: 9400,
        fetched_at: "2026-09-01T12:00:00.000Z",
      }),
      makeQuote({
        face_value: 50,
        region: "EU",
        source: "store-a",
        price_rub: 4800,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        face_value: 50,
        region: "EU",
        source: "store-b",
        price_rub: 5000,
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
    ]);

    const best = repo.getBestQuotes("apple");

    assert.equal(best.length, 2);

    const us100 = best.find(
      (quote) => quote.face_value === 100 && quote.region === "US",
    );
    assert.ok(us100);
    assert.equal(us100.source, "store-b");
    assert.equal(us100.price_rub, 9200);

    const eu50 = best.find(
      (quote) => quote.face_value === 50 && quote.region === "EU",
    );
    assert.ok(eu50);
    assert.equal(eu50.source, "store-a");
    assert.equal(eu50.price_rub, 4800);
  });

  it("getSourceLastFetchedAt returns max fetched_at per source", () => {
    repo.saveQuotes([
      makeQuote({
        source: "store-a",
        fetched_at: "2026-09-01T10:00:00.000Z",
      }),
      makeQuote({
        source: "store-a",
        fetched_at: "2026-09-01T12:00:00.000Z",
      }),
      makeQuote({
        source: "store-b",
        fetched_at: "2026-09-01T11:00:00.000Z",
      }),
    ]);

    const sources = repo.getSourceLastFetchedAt().sort((a, b) =>
      a.source.localeCompare(b.source),
    );

    assert.deepEqual(sources, [
      {
        source: "store-a",
        last_fetched_at: "2026-09-01T12:00:00.000Z",
      },
      {
        source: "store-b",
        last_fetched_at: "2026-09-01T11:00:00.000Z",
      },
    ]);
  });

  it("persists data to a file-backed database", () => {
    const dir = mkdtempSync(join(tmpdir(), "gift-sales-storage-"));
    const dbPath = join(dir, "quotes.db");

    try {
      const writer = new QuoteRepository(dbPath);
      writer.saveQuotes([
        makeQuote({
          source: "store-a",
          fetched_at: "2026-09-01T10:00:00.000Z",
        }),
      ]);
      writer.close();

      const reader = new QuoteRepository(dbPath);
      const latest = reader.getLatestQuotes();
      reader.close();

      assert.equal(latest.length, 1);
      assert.equal(latest[0]?.source, "store-a");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
