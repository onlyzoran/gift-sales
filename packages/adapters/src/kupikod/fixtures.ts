import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { KUPIKOD_APPLE_CATALOG_URL } from "./constants";
import type { FetchHtml } from "./http";

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/kupikod",
);

function fixturePathForUrl(url: string): string {
  if (url === KUPIKOD_APPLE_CATALOG_URL) {
    return join(FIXTURES_DIR, "catalog.html");
  }

  const slug = new URL(url).pathname.split("/").filter(Boolean).at(-1);
  if (!slug) {
    throw new Error(`No fixture mapping for ${url}`);
  }

  return join(FIXTURES_DIR, `${slug}.html`);
}

export function createFixtureFetch(): FetchHtml {
  return async (url: string) => {
    try {
      return await readFile(fixturePathForUrl(url), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return "";
      }

      throw error;
    }
  };
}
