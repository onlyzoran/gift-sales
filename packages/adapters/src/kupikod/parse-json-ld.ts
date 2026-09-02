export type JsonLdNode = Record<string, unknown>;

export function extractJsonLdBlocks(html: string): JsonLdNode[] {
  const blocks: JsonLdNode[] = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const raw = match[1]?.trim();
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as JsonLdNode | JsonLdNode[];
      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return blocks;
}

export function findJsonLdByType<T extends JsonLdNode>(
  blocks: JsonLdNode[],
  type: string,
): T | undefined {
  return blocks.find((block) => block["@type"] === type) as T | undefined;
}
