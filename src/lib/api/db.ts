import { join } from "node:path";

import { QuoteRepository } from "@gift-sales/storage";

const DEFAULT_DB_PATH = join(process.cwd(), "data", "quotes.db");

export function getDbPath(): string {
  return process.env.QUOTES_DB_PATH ?? DEFAULT_DB_PATH;
}

export function createQuoteRepository(): QuoteRepository {
  return new QuoteRepository(getDbPath());
}

export function withQuoteRepository<T>(
  fn: (repo: QuoteRepository) => T,
): T | never {
  const repo = createQuoteRepository();
  try {
    return fn(repo);
  } finally {
    repo.close();
  }
}
