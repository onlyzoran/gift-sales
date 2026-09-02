import type { Quote } from "@gift-sales/storage";

import { KUPIKOD_BRAND, KUPIKOD_SOURCE } from "./constants";
import { extractJsonLdBlocks, findJsonLdByType } from "./parse-json-ld";
import { parseProductSlug, slugFromProductUrl } from "./parse-slug";

type ProductOffer = {
  price?: string | number;
  priceCurrency?: string;
  url?: string;
};

type ProductJsonLd = {
  url?: string;
  offers?: ProductOffer | ProductOffer[];
};

export function parseOldPriceRub(
  html: string,
  priceRub?: number,
): number | null {
  const pairPattern =
    /(?:&quot;|")priceRub(?:&quot;|")\s*:\s*\[\s*\d+\s*,\s*(\d+)\s*\]\s*,\s*(?:&quot;|")oldPriceRub(?:&quot;|")\s*:\s*\[\s*\d+\s*,\s*(\d+)\s*\]/g;

  for (const match of html.matchAll(pairPattern)) {
    const currentPrice = Number(match[1]);
    const oldPrice = Number(match[2]);
    if (!Number.isFinite(oldPrice) || oldPrice <= 0) {
      continue;
    }

    if (priceRub !== undefined && currentPrice !== priceRub) {
      continue;
    }

    return oldPrice;
  }

  const fallbackPattern =
    /(?:&quot;|")oldPriceRub(?:&quot;|")\s*:\s*\[\s*\d+\s*,\s*(\d+)\s*\]/;
  const fallbackMatch = html.match(fallbackPattern);
  if (!fallbackMatch) {
    return null;
  }

  const value = Number(fallbackMatch[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function computeDiscountPct(
  priceRub: number,
  priceRubWas: number | null,
): number | null {
  if (priceRubWas === null || priceRubWas <= priceRub) {
    return null;
  }

  return Math.round(((priceRubWas - priceRub) / priceRubWas) * 100);
}

function firstOffer(product: ProductJsonLd): ProductOffer | null {
  if (!product.offers) {
    return null;
  }

  return Array.isArray(product.offers) ? (product.offers[0] ?? null) : product.offers;
}

export function parseProductQuote(
  html: string,
  fetchedAt: string,
  sourceUrl?: string,
): Quote | null {
  const blocks = extractJsonLdBlocks(html);
  const product = findJsonLdByType<ProductJsonLd>(blocks, "Product");
  if (!product) {
    return null;
  }

  const offer = firstOffer(product);
  if (!offer?.price) {
    return null;
  }

  const priceRub = Number(offer.price);
  if (!Number.isFinite(priceRub) || offer.priceCurrency !== "RUB") {
    return null;
  }

  const resolvedUrl = sourceUrl ?? product.url ?? offer.url;
  if (!resolvedUrl) {
    return null;
  }

  const slug = slugFromProductUrl(resolvedUrl);
  if (!slug) {
    return null;
  }

  const slugParts = parseProductSlug(slug);
  if (!slugParts) {
    return null;
  }

  const priceRubWas = parseOldPriceRub(html, priceRub);

  return {
    brand: KUPIKOD_BRAND,
    face_value: slugParts.face_value,
    face_currency: slugParts.face_currency,
    region: slugParts.region,
    price_rub: priceRub,
    price_rub_was: priceRubWas,
    discount_pct: computeDiscountPct(priceRub, priceRubWas),
    source: KUPIKOD_SOURCE,
    source_url: resolvedUrl,
    fetched_at: fetchedAt,
  };
}
