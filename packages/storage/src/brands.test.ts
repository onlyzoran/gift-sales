import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseBrandsConfig } from "./brands";

describe("parseBrandsConfig", () => {
  it("parses a brands list", () => {
    const config = parseBrandsConfig(`
brands:
  - apple
  - steam
`);

    assert.deepEqual(config.brands, ["apple", "steam"]);
  });

  it("rejects empty brand names", () => {
    assert.throws(
      () =>
        parseBrandsConfig(`
brands:
  - ""
`),
      /non-empty string/,
    );
  });
});
