import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import { createFixtureFetch } from "@gift-sales/adapters";
import { QuoteRepository } from "@gift-sales/storage";

import { formatCollectLog, runCollect } from "./run";

const FETCHED_AT = "2026-09-02T12:00:00.000Z";

describe("runCollect", () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  it("collects fixture-backed kupikod quotes and persists them", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "gift-sales-collector-"));
    const dbPath = join(tempDir, "quotes.db");

    const { result, exitCode } = await runCollect({
      config: {
        kupikod: { enabled: true },
        apple: { enabled: false },
      },
      dbPath,
      dryRun: true,
      fetchedAt: FETCHED_AT,
      fetchHtml: createFixtureFetch(),
    });

    assert.equal(exitCode, 0);
    assert.ok(result.quotes.length > 0);
    assert.equal(result.sourceCounts.kupikod, result.quotes.length);
    assert.equal(
      result.quotes.every((quote) => quote.fetched_at === FETCHED_AT),
      true,
    );

    const repo = new QuoteRepository(dbPath);
    try {
      const saved = repo.getLatestQuotes();
      assert.equal(saved.length, result.quotes.length);
    } finally {
      repo.close();
    }
  });

  it("returns exit code 1 when all enabled sources fail", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "gift-sales-collector-"));
    const dbPath = join(tempDir, "quotes.db");

    const failingFetch = async () => {
      throw new Error("network down");
    };

    const { result, exitCode } = await runCollect({
      config: {
        kupikod: { enabled: true },
        apple: { enabled: false },
      },
      dbPath,
      fetchedAt: FETCHED_AT,
      fetchHtml: failingFetch,
      skipPersist: true,
    });

    assert.equal(exitCode, 1);
    assert.equal(result.quotes.length, 0);
    assert.ok(result.errors.length > 0);
  });

  it("returns exit code 0 on partial success with at least one quote", async () => {
    const { exitCode } = await runCollect({
      config: {
        kupikod: {
          enabled: true,
        },
        apple: { enabled: false },
      },
      dbPath: ":memory:",
      fetchedAt: FETCHED_AT,
      fetchHtml: createFixtureFetch(),
      skipPersist: true,
    });

    assert.equal(exitCode, 0);
  });

  it("records per-url fetch errors without aborting the run", async () => {
    const fixtureFetch = createFixtureFetch();
    const fetchHtml = async (url: string) => {
      if (url.includes("appstore-itunes")) {
        return fixtureFetch(url);
      }

      throw new Error(`HTTP 503 for ${url}`);
    };

    const { result, exitCode } = await runCollect({
      config: {
        kupikod: { enabled: true },
        apple: { enabled: false },
      },
      dbPath: ":memory:",
      fetchedAt: FETCHED_AT,
      fetchHtml,
      skipPersist: true,
    });

    assert.equal(exitCode, 1);
    assert.equal(result.quotes.length, 0);
    assert.ok(result.errors.some((error) => error.message.includes("503")));
  });

  it("formats run summary for stdout", () => {
    const log = formatCollectLog(
      {
        quotes: [{ fetched_at: FETCHED_AT } as never],
        errors: [
          {
            source: "kupikod",
            url: "https://example.com/bad",
            message: "HTTP 404",
          },
        ],
        sourceCounts: { kupikod: 1 },
        fetchedAt: FETCHED_AT,
        durationMs: 42,
      },
      "data/quotes.db",
    );

    assert.match(log, /Collected 1 quotes from kupikod/);
    assert.match(log, /Errors \(1\)/);
    assert.match(log, /Duration: 42ms/);
    assert.match(log, /Saved 1 quotes to data\/quotes.db/);
  });
});
