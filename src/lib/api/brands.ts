import { join } from "node:path";

import { loadBrandsConfig } from "@gift-sales/storage";

const DEFAULT_BRANDS_PATH = join(process.cwd(), "brands.yaml");

let cachedBrands: Set<string> | null = null;

export function getKnownBrands(): Set<string> {
  if (cachedBrands) {
    return cachedBrands;
  }

  const configPath = process.env.BRANDS_CONFIG_PATH ?? DEFAULT_BRANDS_PATH;
  const config = loadBrandsConfig(configPath);
  cachedBrands = new Set(config.brands);
  return cachedBrands;
}

export function resetBrandsCache(): void {
  cachedBrands = null;
}
