import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSourcesConfig } from "./config";

describe("parseSourcesConfig", () => {
  it("parses kupikod and disabled apple sections", () => {
    const config = parseSourcesConfig(`
kupikod:
  enabled: true
  catalog_url: https://example.com/catalog
apple:
  enabled: false
`);

    assert.deepEqual(config, {
      kupikod: {
        enabled: true,
        catalog_url: "https://example.com/catalog",
      },
      apple: {
        enabled: false,
      },
    });
  });

  it("treats missing sections as disabled", () => {
    const config = parseSourcesConfig("kupikod:\n  enabled: false\n");

    assert.deepEqual(config, {
      kupikod: { enabled: false },
      apple: { enabled: false },
    });
  });

  it("rejects invalid enabled type", () => {
    assert.throws(
      () =>
        parseSourcesConfig(`
kupikod:
  enabled: yes
apple:
  enabled: false
`),
      /enabled.*boolean/,
    );
  });

  it("rejects non-object root", () => {
    assert.throws(() => parseSourcesConfig("- item\n"), /root must be an object/);
  });
});
