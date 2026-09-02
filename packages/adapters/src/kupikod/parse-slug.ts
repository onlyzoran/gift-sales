export type SlugParts = {
  face_value: number;
  face_currency: string;
  region: string;
};

const SLUG_PATTERN =
  /^apple-itunes-(\d+(?:\.\d+)?)-([a-z]{3})-([a-z]{2})$/i;

export function parseProductSlug(slug: string): SlugParts | null {
  const match = slug.match(SLUG_PATTERN);
  if (!match) {
    return null;
  }

  const face_value = Number(match[1]);
  if (!Number.isFinite(face_value)) {
    return null;
  }

  const currency = match[2];
  const region = match[3];
  if (!currency || !region) {
    return null;
  }

  return {
    face_value,
    face_currency: currency.toUpperCase(),
    region: region.toUpperCase(),
  };
}

export function slugFromProductUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).at(-1);
    return slug ?? null;
  } catch {
    return null;
  }
}
