import test from "node:test";
import assert from "node:assert/strict";
import {
  specificationEvidenceLevel,
  specificationEvidenceLabel,
} from "../src/lib/catalog.ts";

const official = {
  source_url: "https://www.newholland.com.tr/traktorler/t5-bluemaster-masterdrive-faz5",
  source_type: "manufacturer_specification",
  evidence_text: "Rated engine power 110 hp",
  verified_at: "2026-11-15T12:00:00Z",
};

test("official documented specification has cautious manufacturer-document label", () => {
  const level = specificationEvidenceLevel(official);
  assert.equal(level, "manufacturer_documented");
  assert.equal(specificationEvidenceLabel(level, "tr"), "Üretici belgesine dayalı");
  assert.equal(specificationEvidenceLabel(level, "en"), "Manufacturer document sourced");
});

test("third-party source is not mislabeled as manufacturer confirmed", () => {
  const level = specificationEvidenceLevel({
    ...official,
    source_type: "independent_test",
    source_url: "https://example.org/review/tractor-model",
  });
  assert.equal(level, "third_party_reported");
  assert.match(specificationEvidenceLabel(level, "tr"), /üretici teyidi yok/);
});

test("missing source, missing evidence, or missing check yields unverified", () => {
  for (const spec of [
    { ...official, source_url: null },
    { ...official, evidence_text: "" },
    { ...official, evidence_text: "  " },
    { ...official, verified_at: null },
    { ...official, verified_at: "not a timestamp" },
    { ...official, source_url: "javascript:alert(1)" },
  ]) {
    assert.equal(specificationEvidenceLevel(spec), "not_verified");
  }
  assert.match(specificationEvidenceLabel("not_verified", "tr"), /doğrulanmadı/);
});

test("official link alone is not treated as verified evidence", () => {
  assert.equal(specificationEvidenceLevel({
    ...official,
    source_type: "official_product_page",
    verified_at: null,
  }), "not_verified");
});

test("classification is read-only and does not change publication metadata", () => {
  const record = Object.freeze({ ...official, status: "draft" });
  assert.equal(specificationEvidenceLevel(record), "manufacturer_documented");
  assert.equal(record.status, "draft");
});
