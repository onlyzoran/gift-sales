import {
  extractJsonLdBlocks,
  findJsonLdByType,
  type JsonLdNode,
} from "./parse-json-ld";

type ItemList = JsonLdNode & {
  itemListElement?: Array<{ url?: string; item?: string | { url?: string } }>;
};

function itemListUrls(itemList: ItemList): string[] {
  const urls: string[] = [];

  for (const element of itemList.itemListElement ?? []) {
    if (typeof element.url === "string") {
      urls.push(element.url);
      continue;
    }

    if (typeof element.item === "string") {
      urls.push(element.item);
      continue;
    }

    if (element.item && typeof element.item.url === "string") {
      urls.push(element.item.url);
    }
  }

  return urls;
}

export function parseCatalogProductUrls(html: string): string[] {
  const blocks = extractJsonLdBlocks(html);

  for (const block of blocks) {
    if (block["@type"] === "ItemList") {
      return itemListUrls(block as ItemList);
    }

    const mainEntity = block.mainEntity;
    if (
      mainEntity &&
      typeof mainEntity === "object" &&
      !Array.isArray(mainEntity) &&
      (mainEntity as JsonLdNode)["@type"] === "ItemList"
    ) {
      return itemListUrls(mainEntity as ItemList);
    }
  }

  const collectionPage = findJsonLdByType<JsonLdNode & { mainEntity?: ItemList }>(
    blocks,
    "CollectionPage",
  );
  if (collectionPage?.mainEntity) {
    return itemListUrls(collectionPage.mainEntity);
  }

  return [];
}
