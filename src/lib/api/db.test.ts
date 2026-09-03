import assert from "node:assert/strict";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import { getDbPath } from "./db";

describe("getDbPath", () => {
  const envKeys = ["GIFT_SALES_DB", "QUOTES_DB_PATH"] as const;

  afterEach(() => {
    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  it("prefers GIFT_SALES_DB over QUOTES_DB_PATH and default", () => {
    process.env.QUOTES_DB_PATH = "/tmp/quotes-legacy.db";
    process.env.GIFT_SALES_DB = "/var/lib/gift-sales/data/quotes.db";

    assert.equal(getDbPath(), "/var/lib/gift-sales/data/quotes.db");
  });

  it("falls back to QUOTES_DB_PATH when GIFT_SALES_DB is unset", () => {
    process.env.QUOTES_DB_PATH = "/tmp/quotes-legacy.db";

    assert.equal(getDbPath(), "/tmp/quotes-legacy.db");
  });

  it("falls back to data/quotes.db in cwd when no env is set", () => {
    assert.equal(getDbPath(), join(process.cwd(), "data", "quotes.db"));
  });
});
