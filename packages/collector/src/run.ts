import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import {
  collectKupikodAppleQuotes,
  createFixtureFetch,
  createRateLimitedFetch,
  type FetchHtml,
} from "@gift-sales/adapters";
import { QuoteRepository, type Quote } from "@gift-sales/storage";

import type { SourcesConfig } from "./config";

export type CollectError = {
  source: string;
  url: string;
  message: string;
};

export type SourceRunResult = {
  source: string;
  quotes: Quote[];
  errors: CollectError[];
};

export type CollectRunResult = {
  quotes: Quote[];
  errors: CollectError[];
  sourceCounts: Record<string, number>;
  fetchedAt: string;
  durationMs: number;
};

export type RunCollectOptions = {
  config: SourcesConfig;
  dbPath: string;
  dryRun?: boolean;
  fetchedAt?: string;
  fetchHtml?: FetchHtml;
  skipPersist?: boolean;
};

function createErrorCollectingFetch(
  inner: FetchHtml,
  source: string,
  errors: CollectError[],
): FetchHtml {
  return async (url: string) => {
    try {
      return await inner(url);
    } catch (error) {
      errors.push({
        source,
        url,
        message: error instanceof Error ? error.message : String(error),
      });
      return "";
    }
  };
}

function ensureDbDirectory(dbPath: string): void {
  if (dbPath === ":memory:") {
    return;
  }

  mkdirSync(dirname(dbPath), { recursive: true });
}

async function collectFromKupikod(
  config: SourcesConfig,
  fetchedAt: string,
  fetchHtml: FetchHtml,
): Promise<SourceRunResult> {
  const source = "kupikod";
  const errors: CollectError[] = [];
  const collectingFetch = createErrorCollectingFetch(fetchHtml, source, errors);

  try {
    const quotes = await collectKupikodAppleQuotes({
      catalogUrl: config.kupikod.catalog_url,
      fetchHtml: collectingFetch,
      fetchedAt,
    });

    return { source, quotes, errors };
  } catch (error) {
    errors.push({
      source,
      url: config.kupikod.catalog_url ?? "(catalog)",
      message: error instanceof Error ? error.message : String(error),
    });
    return { source, quotes: [], errors };
  }
}

export async function runCollect(
  options: RunCollectOptions,
): Promise<{ result: CollectRunResult; exitCode: number }> {
  const startedAt = Date.now();
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const fetchHtml =
    options.fetchHtml ??
    (options.dryRun ? createFixtureFetch() : createRateLimitedFetch());

  const sourceResults: SourceRunResult[] = [];

  if (options.config.kupikod.enabled) {
    sourceResults.push(
      await collectFromKupikod(options.config, fetchedAt, fetchHtml),
    );
  }

  if (options.config.apple.enabled) {
    sourceResults.push({
      source: "apple",
      quotes: [],
      errors: [
        {
          source: "apple",
          url: "(source)",
          message: "Apple adapter is not implemented yet",
        },
      ],
    });
  }

  const quotes: Quote[] = [];
  const errors: CollectError[] = [];
  const sourceCounts: Record<string, number> = {};

  for (const run of sourceResults) {
    quotes.push(...run.quotes);
    errors.push(...run.errors);
    sourceCounts[run.source] = run.quotes.length;
  }

  const durationMs = Date.now() - startedAt;

  if (quotes.length > 0 && !options.skipPersist) {
    ensureDbDirectory(options.dbPath);
    const repo = new QuoteRepository(options.dbPath);
    try {
      repo.saveQuotes(quotes);
    } finally {
      repo.close();
    }
  }

  const enabledSources = sourceResults.length;
  const exitCode =
    enabledSources === 0 || quotes.length === 0 ? 1 : 0;

  return {
    result: {
      quotes,
      errors,
      sourceCounts,
      fetchedAt,
      durationMs,
    },
    exitCode,
  };
}

export function formatCollectLog(result: CollectRunResult, dbPath: string): string {
  const lines: string[] = [];

  for (const [source, count] of Object.entries(result.sourceCounts)) {
    lines.push(`Collected ${count} quotes from ${source}`);
  }

  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      lines.push(`  ${error.source} ${error.url}: ${error.message}`);
    }
  }

  lines.push(`Duration: ${result.durationMs}ms`);

  if (result.quotes.length > 0) {
    lines.push(`Saved ${result.quotes.length} quotes to ${dbPath}`);
  } else {
    lines.push("No quotes saved");
  }

  return lines.join("\n");
}
