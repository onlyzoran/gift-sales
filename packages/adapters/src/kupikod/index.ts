export {
  KUPIKOD_APPLE_CATALOG_URL,
  KUPIKOD_BRAND,
  KUPIKOD_RATE_LIMIT_MS,
  KUPIKOD_SOURCE,
  DEFAULT_USER_AGENT,
} from "./constants";
export { collectKupikodAppleQuotes, type CollectKupikodOptions } from "./collect";
export { createFixtureFetch } from "./fixtures";
export { createRateLimitedFetch, type FetchHtml } from "./http";
export { parseCatalogProductUrls } from "./parse-catalog";
export {
  computeDiscountPct,
  parseOldPriceRub,
  parseProductQuote,
} from "./parse-product";
export { parseProductSlug, slugFromProductUrl, type SlugParts } from "./parse-slug";
