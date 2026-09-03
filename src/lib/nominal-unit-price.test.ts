import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compareNominalUnitPrice,
  formatNominalUnitPrice,
  getNominalUnitPriceRub,
  nominalUnitPriceColumnTitle,
} from "./nominal-unit-price";

describe("getNominalUnitPriceRub", () => {
  it("returns price divided by face value", () => {
    assert.equal(getNominalUnitPriceRub(9500, 100), 95);
    assert.equal(getNominalUnitPriceRub(102, 100), 1.02);
  });

  it("returns null for non-positive face value", () => {
    assert.equal(getNominalUnitPriceRub(9500, 0), null);
    assert.equal(getNominalUnitPriceRub(9500, -10), null);
  });

  it("returns null for non-finite inputs", () => {
    assert.equal(getNominalUnitPriceRub(Number.NaN, 100), null);
    assert.equal(getNominalUnitPriceRub(9500, Number.NaN), null);
  });
});

describe("formatNominalUnitPrice", () => {
  it("formats value with two decimals and currency suffix", () => {
    assert.equal(formatNominalUnitPrice(9500, 100, "USD"), "95,00 ₽ / USD");
    assert.equal(formatNominalUnitPrice(102, 100, "RUB"), "1,02 ₽ / RUB");
  });

  it("returns dash when calculation is unavailable", () => {
    assert.equal(formatNominalUnitPrice(9500, 0, "USD"), "—");
  });
});

describe("nominalUnitPriceColumnTitle", () => {
  it("uses face currency when all rows share one currency", () => {
    assert.equal(nominalUnitPriceColumnTitle(["USD", "USD"]), "₽ за 1 USD");
  });

  it("falls back to generic title for mixed currencies", () => {
    assert.equal(
      nominalUnitPriceColumnTitle(["USD", "EUR"]),
      "₽ за 1 ед. номинала",
    );
  });
});

describe("compareNominalUnitPrice", () => {
  it("sorts by computed value ascending", () => {
    assert.ok(compareNominalUnitPrice(9500, 100, 10200, 100, "ascend") < 0);
    assert.ok(compareNominalUnitPrice(9500, 100, 9000, 100, "ascend") > 0);
  });

  it("keeps unavailable values at the end when ascending", () => {
    assert.equal(compareNominalUnitPrice(9500, 0, 9000, 100, "ascend"), 1);
    assert.equal(compareNominalUnitPrice(9000, 100, 9500, 0, "ascend"), -1);
  });

  it("keeps unavailable values at the end when descending", () => {
    assert.equal(compareNominalUnitPrice(9500, 0, 9000, 100, "descend"), -1);
    assert.equal(compareNominalUnitPrice(9000, 100, 9500, 0, "descend"), 1);
  });
});
