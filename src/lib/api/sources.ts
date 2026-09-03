import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  parseSourcesRegistry,
  type SourcesRegistry,
} from "@gift-sales/config";
import type { SourceResponse } from "@gift-sales/storage";

import { getKnownBrands } from "./brands";

const DEFAULT_SOURCES_PATH = join(process.cwd(), "sources.yaml");

export function loadSourcesRegistryFromFile(
  configPath: string = process.env.SOURCES_CONFIG_PATH ?? DEFAULT_SOURCES_PATH,
): SourcesRegistry {
  const content = readFileSync(configPath, "utf8");
  return parseSourcesRegistry(content, { knownBrands: getKnownBrands() });
}

export function buildSourceResponses(
  registry: SourcesRegistry,
  dbSources: Array<{ source: string; last_fetched_at: string }>,
): SourceResponse[] {
  const fetchedBySource = new Map(
    dbSources.map((row) => [row.source, row.last_fetched_at]),
  );

  const registryIds = new Set(registry.sources.map((source) => source.id));
  const orphanDbSources = dbSources.filter((row) => !registryIds.has(row.source));

  const responses: SourceResponse[] = registry.sources.map((source) => ({
    id: source.id,
    base_url: source.base_url,
    categories: source.categories.map((category) => ({
      url: category.url,
      brand: category.brand,
    })),
    last_fetched_at: fetchedBySource.get(source.id) ?? null,
  }));

  for (const row of orphanDbSources) {
    responses.push({
      id: row.source,
      base_url: "",
      categories: [],
      last_fetched_at: row.last_fetched_at,
    });
  }

  return responses.sort((left, right) => left.id.localeCompare(right.id));
}
