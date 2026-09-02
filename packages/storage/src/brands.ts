import { readFileSync } from "node:fs";

import yaml from "js-yaml";

export type BrandsConfig = {
  brands: string[];
};

export function parseBrandsConfig(content: string): BrandsConfig {
  const parsed = yaml.load(content);

  if (parsed === undefined || parsed === null) {
    throw new Error("brands.yaml: config is empty");
  }

  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("brands.yaml: root must be an object");
  }

  const root = parsed as Record<string, unknown>;
  const brands = root.brands;

  if (!Array.isArray(brands)) {
    throw new Error('brands.yaml: "brands" must be an array');
  }

  for (const brand of brands) {
    if (typeof brand !== "string" || brand.trim() === "") {
      throw new Error('brands.yaml: each brand must be a non-empty string');
    }
  }

  return { brands: brands as string[] };
}

export function loadBrandsConfig(configPath: string): BrandsConfig {
  const content = readFileSync(configPath, "utf8");
  return parseBrandsConfig(content);
}
