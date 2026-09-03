import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import {
  collectKupikodAppleQuotes,
  createFixtureFetch,
  createRateLimitedFetch,
  type FetchHtml,
} from "@gift-sales/adapters";
import type { SourceEntry, SourcesRegistry } from "@gift-sales/config";
import { QuoteRepository, type Quote } from "@gift-sales/storage";

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
  config: SourcesRegistry;
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

function createSourceFetch(
  source: SourceEntry,
  dryRun: boolean | undefined,
  overrideFetch: FetchHtml | undefined,
): FetchHtml {
  if (overrideFetch) {
    return overrideFetch;
  }

  if (dryRun) {
    return createFixtureFetch();
  }

  const minIntervalMs = Math.ceil(1000 / source.rate_limit_rps);
  return createRateLimitedFetch({ minIntervalMs });
}

async function collectFromKupikod(
  source: SourceEntry,
  fetchedAt: string,
  fetchHtml: FetchHtml,
): Promise<SourceRunResult> {
  const errors: CollectError[] = [];
  const collectingFetch = createErrorCollectingFetch(fetchHtml, source.id, errors);
  const quotes: Quote[] = [];

  for (const category of source.categories) {
    try {
      const categoryQuotes = await collectKupikodAppleQuotes({
        catalogUrl: category.url,
        fetchHtml: collectingFetch,
        fetchedAt,
      });
      quotes.push(...categoryQuotes);
    } catch (error) {
      errors.push({
        source: source.id,
        url: category.url,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { source: source.id, quotes, errors };
}

async function collectFromAppleAppStore(
  source: SourceEntry,
): Promise<SourceRunResult> {
  return {
    source: source.id,
    quotes: [],
    errors: source.categories.map((category) => ({
      source: source.id,
      url: category.url,
      message: "Apple App Store adapter is not implemented yet",
    })),
  };
}

async function collectFromSource(
  source: SourceEntry,
  fetchedAt: string,
  fetchHtml: FetchHtml,
): Promise<SourceRunResult> {
  if (source.id === "kupikod") {
    return collectFromKupikod(source, fetchedAt, fetchHtml);
  }

  if (source.id === "apple-app-store") {
    return collectFromAppleAppStore(source);
  }

  return {
    source: source.id,
    quotes: [],
    errors: [
      {
        source: source.id,
        url: source.base_url,
        message: `No collector adapter registered for source "${source.id}"`,
      },
    ],
  };
}

export async function runCollect(
  options: RunCollectOptions,
): Promise<{ result: CollectRunResult; exitCode: number }> {
  const startedAt = Date.now();
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();

  const sourceResults: SourceRunResult[] = [];

  for (const source of options.config.sources) {
    const fetchHtml = createSourceFetch(source, options.dryRun, options.fetchHtml);
    sourceResults.push(await collectFromSource(source, fetchedAt, fetchHtml));
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

  const exitCode = quotes.length === 0 ? 1 : 0;

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
