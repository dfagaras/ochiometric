import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDisplayNumber,
  formatGroupedInteger,
  guessSizeClass,
  parseGroupedInteger,
} from "../app/number-format.ts";

test("grupează estimările cu virgulă în timp ce utilizatorul scrie", () => {
  assert.equal(formatGroupedInteger("3600000000"), "3,600,000,000");
  assert.equal(formatGroupedInteger("003,600,000,000"), "3,600,000,000");
  assert.equal(parseGroupedInteger("3,600,000,000"), 3_600_000_000);
  assert.equal(formatDisplayNumber(86_847), "86,847");
});

test("micșorează progresiv numerele lungi", () => {
  assert.equal(guessSizeClass("999"), "guess-value-short");
  assert.equal(guessSizeClass("3,600,000,000"), "guess-value-medium");
  assert.equal(guessSizeClass("555,555,555,555,555"), "guess-value-long");
  assert.equal(guessSizeClass("555,555,555,555,555,555"), "guess-value-xlong");
});
