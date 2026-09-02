import { readFileSync } from "node:fs";
import { join } from "node:path";

import yaml from "js-yaml";

import type { SourceResponse } from "@gift-sales/storage";

type SourceSection = {
  enabled?: boolean;
  catalog_url?: string;
};

export type SourcesYaml = Record<string, SourceSection>;

const DEFAULT_SOURCES_PATH = join(process.cwd(), "sources.yaml");

export function loadSourcesYaml(
  configPath: string = process.env.SOURCES_CONFIG_PATH ?? DEFAULT_SOURCES_PATH,
): SourcesYaml {
  const content = readFileSync(configPath, "utf8");
  const parsed = yaml.load(content);

  if (parsed === undefined || parsed === null) {
    throw new Error("sources.yaml: config is empty");
  }

  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("sources.yaml: root must be an object");
  }

  return parsed as SourcesYaml;
}

export function buildSourceResponses(
  yamlSources: SourcesYaml,
  dbSources: Array<{ source: string; last_fetched_at: string }>,
): SourceResponse[] {
  const fetchedBySource = new Map(
    dbSources.map((row) => [row.source, row.last_fetched_at]),
  );

  const sourceNames = new Set([
    ...Object.keys(yamlSources),
    ...dbSources.map((row) => row.source),
  ]);

  return Array.from(sourceNames)
    .sort((a, b) => a.localeCompare(b))
    .map((source) => {
      const meta = yamlSources[source];
      const response: SourceResponse = {
        source,
        last_fetched_at: fetchedBySource.get(source) ?? null,
      };

      if (meta?.enabled !== undefined) {
        response.enabled = meta.enabled;
      }
      if (typeof meta?.catalog_url === "string") {
        response.catalog_url = meta.catalog_url;
      }

      return response;
    });
}
