import { join, resolve } from "node:path";

import {
  loadSourcesRegistry,
  parseSourcesRegistry,
  type SourceEntry,
  type SourcesRegistry,
} from "@gift-sales/config";
import { loadBrandsConfig } from "@gift-sales/storage";

export type { SourceEntry, SourcesRegistry };

function repoRoot(): string {
  return resolve(import.meta.dirname, "../../..");
}

function defaultBrandsPath(): string {
  return join(repoRoot(), "brands.yaml");
}

export function parseSourcesConfig(
  content: string,
  options?: { brandsPath?: string },
): SourcesRegistry {
  const brandsPath = options?.brandsPath ?? defaultBrandsPath();
  const { brands } = loadBrandsConfig(brandsPath);
  return parseSourcesRegistry(content, { knownBrands: new Set(brands) });
}

export function loadSourcesConfig(
  configPath: string,
  options?: { brandsPath?: string },
): SourcesRegistry {
  const brandsPath = options?.brandsPath ?? defaultBrandsPath();
  const { brands } = loadBrandsConfig(brandsPath);
  return loadSourcesRegistry(configPath, { knownBrands: new Set(brands) });
}
