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

import {nominalEvidenceFingerprint} from "../../scripts/tractor-automated-nominal-evidence.mjs";
const auto=()=>{
  const x=base();x.model.variant="Exact 4WD cab";x.reviewMode="automated_nominal";x.modelGates.requiredReview="not_applicable";
  x.claims=Array.from({length:8},(_,i)=>({...structuredClone(x.claims[0]),key:"nominal_"+i}));
  const rows=x.claims.map(c=>({key:c.key,claimType:c.type,value:"100",unit:"kg",measurementStandard:"Specified nominal condition",sourceUrl:"https://example.com/original-spec",sourcePublisher:"Synthetic OEM",sourceType:"manufacturer_specification",sourceLocator:"table, model A",sourceExcerpt:"Synthetic test fixture only",sourceCheckedOn:"2026-11-25",scopeNote:"Exact model, market and variant",modelIdentity:{...x.model}}));
  const fingerprint=nominalEvidenceFingerprint(x.model,rows,[]);
  x.automatedEvidence={decisionType:"automated_evidence_review",checkedOn:"2026-11-25",rows,omittedKeys:[],omissionVerified:"pass",reviewedFingerprint:fingerprint,currentFingerprint:fingerprint};
  return x;
};
const rehash=x=>{const p=x.automatedEvidence;p.reviewedFingerprint=p.currentFingerprint=nominalEvidenceFingerprint(x.model,p.rows,p.omittedKeys);};
test("explicit automated evidence route replaces routine human review for complete nominal data",()=>{
 const x=auto(),r=routeCatalogueEvidence(x);
 assert.equal(r.technicalRoute,"route_to_automated_nominal_release");assert.equal(r.automaticReleaseEligible,true);
 assert.equal(r.decisionType,"automated_evidence_review");assert.equal(r.allowedToPublish,false);assert.equal(r.photoRoute,"research_photo");
});
test("an absent, failed or pending review cannot be silently reclassified",()=>{
 for(const value of ["pending","fail","pass"]){const x=auto();x.modelGates.requiredReview=value;assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);}
 const x=auto();delete x.automatedEvidence;assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);
});
test("automated route still requires all common gates and minimum coverage",()=>{
 for(const key of Object.keys(auto().modelGates).filter(k=>k!=="requiredReview")){const x=auto();x.modelGates[key]="pending";assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false,key);}
 const x=auto();x.claims.pop();x.automatedEvidence.rows.pop();rehash(x);assert.ok(routeCatalogueEvidence(x).modelReasons.includes("minimum_eight_verified_concepts"));
});
test("source record shape, exact identity, actual source type and fingerprint fail closed",()=>{
 for(const mutate of [x=>x.automatedEvidence.rows[0].sourceUrl="http://example.com",x=>x.automatedEvidence.rows[0].sourceType="dealer_listing",x=>x.automatedEvidence.rows[0].sourceExcerpt="",x=>x.automatedEvidence.rows[0].modelIdentity.variant="wrong",x=>x.automatedEvidence.rows[0].sourceCheckedOn="2026-02-31",x=>x.automatedEvidence.rows[0].sourceLocator="",x=>x.automatedEvidence.rows[0].unit=undefined,x=>x.automatedEvidence.rows[0].measurementStandard="",x=>x.automatedEvidence.currentFingerprint="a".repeat(64),x=>x.automatedEvidence.rows[0].value="101"]){const x=auto();mutate(x);assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);}
 const x=auto();x.model.variant="possible alias pending";assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);
});
test("independent technical specification requires real independent source evidence; non-nominal claim cannot auto-release",()=>{
 const x=auto();x.claims[0].type="independent_specification";x.claims[0].gates.independentEvidence="pass";x.automatedEvidence.rows[0].claimType="independent_specification";x.automatedEvidence.rows[0].sourceType="government_technical_report";rehash(x);assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,true);
 x.claims[0].gates.independentEvidence="pending";assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);
 for(const type of ["independent_measurement","performance_superiority","reliability"]){const y=auto();y.claims[0].type=type;y.claims[0].gates.independentEvidence="pass";y.claims[0].gates.observationYear2026="pass";assert.ok(routeCatalogueEvidence(y).modelReasons.includes("non_nominal_claim_retained"));}
});
test("held fields must be accounted for and proven omitted, not exposed",()=>{
 const x=auto();x.claims.push({...structuredClone(x.claims[0]),key:"uncertain",gates:{...x.claims[0].gates,conflictResolved:"fail"}});
 assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);
 x.automatedEvidence.omittedKeys=["uncertain"];rehash(x);assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,true);
 x.automatedEvidence.omissionVerified="pending";assert.equal(routeCatalogueEvidence(x).automaticReleaseEligible,false);
});
test("batch routes eligible automated nominal records separately, without writes",()=>{
 const script=fileURLToPath(new URL("../../scripts/tractor-catalogue-batch-review.mjs",import.meta.url));
 const x=auto(),bad=auto();bad.automatedEvidence.currentFingerprint="0".repeat(64);
 const run=spawnSync(process.execPath,[script],{input:JSON.stringify([x,bad,base()]),encoding:"utf8"});
 assert.equal(run.status,0);const q=JSON.parse(run.stdout);assert.deepEqual(q.automaticRelease,[0]);assert.deepEqual(q.releaseReview,[2]);assert.deepEqual(q.heldModels.map(r=>r.index),[1]);
});
