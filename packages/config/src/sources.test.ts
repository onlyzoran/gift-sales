import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSourcesRegistry } from "./sources";

const VALID_CONFIG = `
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 2
    categories:
      - url: https://kupikod.com/shop/podarocnye-karty/appstore-itunes
        brand: apple
  - id: apple-app-store
    base_url: https://www.apple.com
    rate_limit_rps: 1
    categories:
      - url: https://www.apple.com/shop/gift-cards
        brand: apple
`;

describe("parseSourcesRegistry", () => {
  it("parses a valid registry", () => {
    const registry = parseSourcesRegistry(VALID_CONFIG, {
      knownBrands: new Set(["apple", "steam"]),
    });

    assert.equal(registry.sources.length, 2);
    assert.equal(registry.sources[0].id, "kupikod");
    assert.equal(registry.sources[0].rate_limit_rps, 2);
    assert.equal(registry.sources[1].id, "apple-app-store");
  });

  it("rejects empty config", () => {
    assert.throws(() => parseSourcesRegistry(""), /config is empty/);
  });

  it("rejects missing sources array", () => {
    assert.throws(
      () => parseSourcesRegistry("enabled: true\n"),
      /sources: Required/,
    );
  });

  it("rejects invalid rate_limit_rps", () => {
    assert.throws(
      () =>
        parseSourcesRegistry(`
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 0
    categories:
      - url: https://kupikod.com/catalog
        brand: apple
`),
      /sources\[0\]\.rate_limit_rps/,
    );
  });

  it("rejects invalid category url", () => {
    assert.throws(
      () =>
        parseSourcesRegistry(`
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 1
    categories:
      - url: not-a-url
        brand: apple
`),
      /sources\[0\]\.categories\[0\]\.url/,
    );
  });

  it("rejects unknown brand with field path", () => {
    assert.throws(
      () =>
        parseSourcesRegistry(
          `
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 1
    categories:
      - url: https://kupikod.com/catalog
        brand: netflix
`,
          { knownBrands: new Set(["apple"]) },
        ),
      /sources\[0\]\.categories\[0\]\.brand: unknown brand "netflix"/,
    );
  });

  it("rejects duplicate source ids", () => {
    assert.throws(
      () =>
        parseSourcesRegistry(`
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 1
    categories:
      - url: https://kupikod.com/a
        brand: apple
  - id: kupikod
    base_url: https://example.com
    rate_limit_rps: 1
    categories:
      - url: https://example.com/b
        brand: apple
`),
      /sources\[1\]\.id: duplicate id "kupikod"/,
    );
  });

  it("rejects empty categories array", () => {
    assert.throws(
      () =>
        parseSourcesRegistry(`
sources:
  - id: kupikod
    base_url: https://kupikod.com
    rate_limit_rps: 1
    categories: []
`),
      /sources\[0\]\.categories/,
    );
  });
});
