import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {routeCatalogueEvidence} from "../../scripts/tractor-split-evidence-review.mjs";
const gates=keys=>Object.fromEntries(keys.map(k=>[k,"pass"]));
const base=()=>({model:{brand:"Synthetic",model:"A",market:"Test"},modelGates:gates(["identity","deduplication","sourceProvenance","contentQuality","requiredReview","rls","localeSeo","releaseTests","coverageAfterOmission"]),claims:[{key:"rated_power",type:"manufacturer_spec",gates:{...gates(["originalEvidence","modelMarketMatch","unitsAndConditions","conflictResolved"]),independentEvidence:"pending"}}]});
test("missing photo and optional independent test do not stall documented OEM review",()=>{const r=routeCatalogueEvidence(base());assert.equal(r.technicalRoute,"route_to_existing_release_review");assert.equal(r.photoRoute,"research_photo");assert.equal(r.claims[0].evidenceLabel,"manufacturer_claim");assert.equal(r.allowedToPublish,false);});
test("blocked photo leaves technical route unchanged",()=>{const x=base();x.photo={gates:{...gates(["publishedTarget","exactIdentity","commercialReuse","derivativesPermitted","attribution","originalBytes","hashVerified","decodeAndMime","assetTests"]),originalBytes:"pending"}};const r=routeCatalogueEvidence(x);assert.equal(r.photoRoute,"hold_photo");assert.equal(r.technicalRoute,"route_to_existing_release_review");});
test("manufacturer evidence does not establish independent measurement or superiority",()=>{for(const type of ["independent_measurement","performance_superiority","reliability"]){const x=base();x.claims[0].type=type;x.claims[0].gates.observationYear2026="pass";const r=routeCatalogueEvidence(x);assert.equal(r.technicalRoute,"hold_model");assert.ok(r.heldClaims[0].reasons.includes("independentEvidence"));}});
test("reliability requires 2026 observations",()=>{const x=base();x.claims[0].type="reliability";x.claims[0].gates.independentEvidence="pass";x.claims[0].gates.observationYear2026="fail";assert.ok(routeCatalogueEvidence(x).heldClaims[0].reasons.includes("observationYear2026"));});
test("conflicting claim isolated only if existing coverage gate passes",()=>{const x=base();x.claims.push({...x.claims[0],key:"mass",gates:{...x.claims[0].gates,conflictResolved:"fail"}});assert.equal(routeCatalogueEvidence(x).heldClaims.length,1);assert.equal(routeCatalogueEvidence(x).technicalRoute,"route_to_existing_release_review");x.modelGates.coverageAfterOmission="pending";assert.equal(routeCatalogueEvidence(x).technicalRoute,"hold_model");});
test("no mandatory model gate is optional",()=>{for(const key of Object.keys(base().modelGates)){const x=base();x.modelGates[key]="pending";assert.equal(routeCatalogueEvidence(x).technicalRoute,"hold_model",key);}});
test("photo requires every gate even if technical data are ready",()=>{const g=gates(["publishedTarget","exactIdentity","commercialReuse","derivativesPermitted","attribution","originalBytes","hashVerified","decodeAndMime","assetTests"]);for(const key of Object.keys(g)){const x=base();x.photo={gates:{...g,[key]:"pending"}};assert.equal(routeCatalogueEvidence(x).photoRoute,"hold_photo",key);}const x=base();x.photo={gates:g};const r=routeCatalogueEvidence(x);assert.equal(r.photoRoute,"route_to_existing_photo_review");assert.equal(r.allowedToPublish,false);});
test("malformed missing or duplicate evidence fails closed",()=>{const x=base();delete x.modelGates.rls;assert.throws(()=>routeCatalogueEvidence(x));const y=base();y.claims.push(y.claims[0]);assert.throws(()=>routeCatalogueEvidence(y));assert.throws(()=>routeCatalogueEvidence({...base(),model:{}}));});

test("batch separates pending review, failed review, photos and malformed records", () => {
  const ready = base();
  const pending = base();
  pending.modelGates.requiredReview = "pending";
  const failed = base();
  failed.modelGates.requiredReview = "fail";
  const incomplete = structuredClone(pending);
  incomplete.modelGates.identity = "pending";
  const script = fileURLToPath(new URL("../../scripts/tractor-catalogue-batch-review.mjs", import.meta.url));
  const run = records => spawnSync(process.execPath, [script], {
    input: JSON.stringify(records), encoding: "utf8",
  });
  const mixed = run([ready, pending, failed, incomplete, null]);
  assert.equal(mixed.status, 1);
  const queues = JSON.parse(mixed.stdout);
  assert.deepEqual(queues.releaseReview, [0]);
  assert.deepEqual(queues.requiredReview, [1]);
  assert.deepEqual(queues.heldModels.map(x => x.index), [2, 3]);
  assert.deepEqual(queues.missingPhotos, [0, 1, 2, 3]);
  assert.deepEqual(queues.invalidRecords.map(x => x.index), [4]);
  assert.equal(run([ready, pending]).status, 0);
  assert.equal(run({}).status, 1);
});
