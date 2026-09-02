import { readFileSync } from "node:fs";

import yaml from "js-yaml";

export type KupikodSourceConfig = {
  enabled: boolean;
  catalog_url?: string;
};

export type AppleSourceConfig = {
  enabled: boolean;
};

export type SourcesConfig = {
  kupikod: KupikodSourceConfig;
  apple: AppleSourceConfig;
};

function parseSourceSection(
  raw: unknown,
  sourceName: string,
): { enabled: boolean; catalog_url?: string } {
  if (raw === undefined || raw === null) {
    return { enabled: false };
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`sources.yaml: "${sourceName}" must be an object`);
  }

  const section = raw as Record<string, unknown>;

  if (section.enabled !== undefined && typeof section.enabled !== "boolean") {
    throw new Error(`sources.yaml: "${sourceName}.enabled" must be a boolean`);
  }

  if (
    section.catalog_url !== undefined &&
    typeof section.catalog_url !== "string"
  ) {
    throw new Error(
      `sources.yaml: "${sourceName}.catalog_url" must be a string`,
    );
  }

  const result: { enabled: boolean; catalog_url?: string } = {
    enabled: section.enabled === true,
  };

  if (typeof section.catalog_url === "string") {
    result.catalog_url = section.catalog_url;
  }

  return result;
}

export function parseSourcesConfig(content: string): SourcesConfig {
  const parsed = yaml.load(content);

  if (parsed === undefined || parsed === null) {
    throw new Error("sources.yaml: config is empty");
  }

  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("sources.yaml: root must be an object");
  }

  const root = parsed as Record<string, unknown>;
  const kupikod = parseSourceSection(root.kupikod, "kupikod");
  const apple = parseSourceSection(root.apple, "apple");

  return { kupikod, apple };
}

export function loadSourcesConfig(configPath: string): SourcesConfig {
  const content = readFileSync(configPath, "utf8");
  return parseSourcesConfig(content);
}
