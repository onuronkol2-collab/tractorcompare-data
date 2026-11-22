import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const manifest=JSON.parse(file("../docs/photo-curated-tym-exact-three-20261122.json"));
const script=file("../scripts/stage-reviewed-tym-exact-three-20261122.py");
const workflow=file("../../.github/workflows/tractorvs-reviewed-tym-exact-three.yml");

test("Three first-hand CC BY-SA Commons photographs are mapped only to exact existing published variant UUIDs",()=>{
  const expected=new Map([
    ["TYM|T2026","1aa3a3d6-822b-4346-9d13-b6c0d99bdb1e"],
    ["TYM|T4058","840269b7-e7c3-4e57-80db-56a55e9fbf46"],
    ["TYM|T5075","d12085d4-5bdf-4017-85f5-7071a6d72e6f"]
  ]);
  assert.equal(manifest.publicationCount,0);
  assert.equal(manifest.stagedPhotoCount,3);
  assert.equal(manifest.photos.length,3);
  assert.equal(new Set(manifest.photos.map(x=>x.tractorId)).size,3);
  assert.equal(new Set(manifest.photos.map(x=>x.fileId)).size,3);
  for(const p of manifest.photos){
    assert.equal(p.tractorId,expected.get(p.brand+"|"+p.model));
    assert.equal(p.photographer,"MarcelX42");
    assert.equal(p.license,"CC BY-SA 4.0");
    assert.equal(p.licenseUrl,"https://creativecommons.org/licenses/by-sa/4.0/");
    assert.equal(p.configurationExact,false);
    assert.equal(p.publishStatus,"research_only");
    assert.equal(p.visualReviewRequired,true);
    assert.match(p.ownershipEvidence,/Own work/);
    assert.match(p.sourcePage,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:TYM_/);
    assert.match(p.manufacturerIdentityUrl,/^https:\/\/www\.tym\.world\/en\/products\/tractors\//);
    assert.match(p.commonsStoragePath,/^[0-9a-f]\/([0-9a-f]{2})\/.+\.jpg$/);
    assert.ok(p.originalWidth>=1920&&p.originalHeight>=1000);
    assert.ok(script.includes(p.fileId));
    assert.ok(script.includes(p.commonsStoragePath));
    assert.ok(script.includes(p.sourcePage.replaceAll("(","%28").replaceAll(")","%29")));
  }
});

test("Photo research must not silently spread between HST/cab gearbox variants",()=>{
  const [manual,cab,t78]=manifest.photos;
  assert.match(manual.variant,/2500L.*manual/);
  assert.match(cab.variant,/6225C.*12F x 12R/);
  assert.match(t78.variant,/T78/);
  assert.ok(manifest.imageReusePolicy.includes("2500HL"));
  assert.ok(manifest.imageReusePolicy.includes("6225CH"));
  assert.ok(manifest.imageReusePolicy.includes("T68"));
  assert.notEqual(manual.tractorId,"37c62cc5-b235-41a6-a2f0-4a1260cf4884");
  assert.notEqual(cab.tractorId,"82fbcc0b-d0b2-4fa2-940b-f8404c384840");
});

test("Staging job cannot publish source or re-try around Commons throttling",()=>{
  assert.equal((script.match(/https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\//g)||[]).length,3);
  assert.ok(script.includes('stage.main()'));
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/cancel-in-progress: false/);
  assert.match(workflow,/approvedToPublish/);
  assert.match(workflow,/reviewRequired/);
  assert.match(workflow,/sha256/);
  assert.match(workflow,/git ls-remote --exit-code --heads/);
  assert.match(workflow,/REVIEW ONLY/);
  assert.doesNotMatch(workflow,/gh pr merge|supabase db push|wrangler deploy/);
});
