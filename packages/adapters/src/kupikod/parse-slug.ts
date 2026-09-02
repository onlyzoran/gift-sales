export type SlugParts = {
  face_value: number;
  face_currency: string;
  region: string;
};

const SLUG_PATTERN =
  /^apple-itunes-(?<value>\d+(?:\.\d+)?)-(?<currency>[a-z]{3})-(?<region>[a-z]{2})$/i;

export function parseProductSlug(slug: string): SlugParts | null {
  const match = slug.match(SLUG_PATTERN);
  if (!match?.groups) {
    return null;
  }

  const face_value = Number(match.groups.value);
  if (!Number.isFinite(face_value)) {
    return null;
  }

  return {
    face_value,
    face_currency: match.groups.currency.toUpperCase(),
    region: match.groups.region.toUpperCase(),
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
