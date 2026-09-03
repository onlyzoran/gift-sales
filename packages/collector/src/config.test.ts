import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSourcesConfig } from "./config";

const VALID_CONFIG = `
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 2
    categories:
      - url: https://kupikod.com/shop/catalog
        brand: apple
  - id: apple-app-store
    base_url: https://www.apple.com
    rate_limit_rps: 1
    categories:
      - url: https://www.apple.com/shop/gift-cards
        brand: apple
`;

describe("parseSourcesConfig", () => {
  it("parses kupikod and apple-app-store with brand validation", () => {
    const config = parseSourcesConfig(VALID_CONFIG, {
      brandsPath: new URL("../../../brands.yaml", import.meta.url).pathname,
    });

    assert.equal(config.sources.length, 2);
    assert.equal(config.sources[0].id, "kupikod");
    assert.equal(config.sources[0].categories[0].url, "https://kupikod.com/shop/catalog");
    assert.equal(config.sources[1].id, "apple-app-store");
  });

  it("rejects unknown brand with field path", () => {
    assert.throws(
      () =>
        parseSourcesConfig(
          `
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 1
    categories:
      - url: https://kupikod.com/catalog
        brand: netflix
`,
          {
            brandsPath: new URL("../../../brands.yaml", import.meta.url).pathname,
          },
        ),
      /sources\[0\]\.categories\[0\]\.brand: unknown brand "netflix"/,
    );
  });

  it("rejects invalid rate_limit_rps", () => {
    assert.throws(
      () =>
        parseSourcesConfig(`
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: -1
    categories:
      - url: https://kupikod.com/catalog
        brand: apple
`),
      /sources\[0\]\.rate_limit_rps/,
    );
  });

  it("rejects non-object root", () => {
    assert.throws(
      () => parseSourcesConfig("- item\n"),
      /Expected object, received array/,
    );
  });
});
