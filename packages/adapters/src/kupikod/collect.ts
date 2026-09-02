import type { Quote } from "@gift-sales/storage";

import { KUPIKOD_APPLE_CATALOG_URL } from "./constants";
import type { FetchHtml } from "./http";
import { parseCatalogProductUrls } from "./parse-catalog";
import { parseProductQuote } from "./parse-product";

export type CollectKupikodOptions = {
  catalogUrl?: string;
  fetchHtml: FetchHtml;
  fetchedAt?: string;
  productUrls?: string[];
};

export async function collectKupikodAppleQuotes(
  options: CollectKupikodOptions,
): Promise<Quote[]> {
  const catalogUrl = options.catalogUrl ?? KUPIKOD_APPLE_CATALOG_URL;
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();

  const productUrls =
    options.productUrls ??
    parseCatalogProductUrls(await options.fetchHtml(catalogUrl));

  const quotes: Quote[] = [];

  for (const productUrl of productUrls) {
    const html = await options.fetchHtml(productUrl);
    const quote = parseProductQuote(html, fetchedAt, productUrl);
    if (quote) {
      quotes.push(quote);
    }
  }

  return quotes.sort((left, right) => {
    const regionCompare = left.region.localeCompare(right.region);
    if (regionCompare !== 0) {
      return regionCompare;
    }

    if (left.face_currency !== right.face_currency) {
      return left.face_currency.localeCompare(right.face_currency);
    }

    return left.face_value - right.face_value;
  });
}
