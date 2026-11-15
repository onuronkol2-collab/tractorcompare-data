import assert from "node:assert/strict";
import test from "node:test";
import { specificationIdentity } from "../src/lib/catalog.ts";

const base = {
  canonical_key: "engine_max_power",
  spec_name: "Maximum engine power",
  spec_value: "53",
  unit: "kW",
  measurement_standard: null,
  rated_rpm: null,
};
const identity = (changes = {}) => specificationIdentity({ ...base, ...changes });

test("different numeric values are never conflated by punctuation removal", () => {
  assert.notEqual(identity({ spec_value: "5.3" }), identity({ spec_value: "53" }));
  assert.notEqual(identity({ spec_value: "3,5" }), identity({ spec_value: "35" }));
  assert.notEqual(identity({ spec_value: "1/2" }), identity({ spec_value: "12" }));
});

test("gear-count delimiters remain meaningful", () => {
  assert.notEqual(identity({ spec_value: "16F/8R" }), identity({ spec_value: "16F8R" }));
  assert.notEqual(identity({ spec_value: "24-12" }), identity({ spec_value: "2412" }));
});

test("cosmetic whitespace and case still collapse exact duplicates", () => {
  assert.equal(identity({ spec_value: "53 kW / 72 HP" }), identity({ spec_value: "  53 KW/72 hp  " }));
  assert.equal(identity({ spec_value: "16F / 8R" }), identity({ spec_value: "16f/8r" }));
});

test("different units, measurement contexts and RPMs stay separate", () => {
  assert.notEqual(identity({ unit: "HP" }), identity({ unit: "kW" }));
  assert.notEqual(identity({ measurement_standard: "at ball ends" }),
    identity({ measurement_standard: "610 mm behind ball ends" }));
  assert.notEqual(identity({ rated_rpm: 2500 }), identity({ rated_rpm: 2600 }));
  assert.notEqual(identity({ rated_rpm: null }), identity({ rated_rpm: 0 }));
});

test("delimiter characters cannot cause collisions between fields", () => {
  assert.notEqual(identity({ spec_value: "53|kw", unit: "hp" }),
    identity({ spec_value: "53", unit: "kw|hp" }));
});

test("distinct specifications are not collapsed into the same identity", () => {
  assert.notEqual(identity(), identity({ canonical_key: "engine_torque" }));
});
