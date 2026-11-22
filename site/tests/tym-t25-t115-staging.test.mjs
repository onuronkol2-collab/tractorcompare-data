import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const src=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
const manifest=JSON.parse(src("../docs/photo-curated-tym-t25-t115-four-20261122.json"));
const stage=src("../scripts/stage-reviewed-tym-t25-t115-four-20261122.py");

test("TYM exact global aliases and four independent photographer-owned CC sources",()=>{
  assert.equal(manifest.newPhotoCandidates,4);
  assert.equal(manifest.modelCount,2);
  assert.equal(manifest.publishedPhotos,0);
  assert.equal(manifest.photos.length,4);
  const uuid={
    T2025P:"622ddce0-f3a8-48ad-8ec6-45ca936dba6f",
    T6115:"80fd42a2-3059-40bb-a0e1-511ae6100213",
  };
  const alias={T2025P:"T25",T6115:"T115"};
  const photosByModel={};
  for(const photo of manifest.photos){
    photosByModel[photo.model]=(photosByModel[photo.model]||0)+1;
    assert.equal(photo.brand,"TYM");
    assert.equal(photo.uuid,uuid[photo.model]);
    assert.equal(photo.picturedModel,alias[photo.model]);
    assert.equal(photo.photographer,"MarcelX42");
    assert.equal(photo.licenseName,"CC BY-SA 4.0");
    assert.equal(photo.licenseUrl,"https://creativecommons.org/licenses/by-sa/4.0/");
    assert.equal(photo.livePublish,false);
    assert.equal(photo.regionalOptionConfirmed,false);
    assert.match(photo.sourceOwnership,/Own work/);
    assert.ok(photo.sourcePage.includes(photo.file));
    assert.match(photo.storage,/^[0-9a-f]\/([0-9a-f]{2})\/.+\.jpg$/);
    assert.ok(photo.width>1920);
    assert.ok(photo.height>1920);
    assert.ok(stage.includes(photo.id));
    assert.ok(stage.includes(photo.storage));
    assert.ok(stage.includes(photo.sourcePage.replaceAll("(","%28").replaceAll(")","%29")));
  }
  assert.deepEqual(photosByModel,{T2025P:2,T6115:2});
  assert.equal(new Set(manifest.photos.map(p=>p.id)).size,4);
  assert.match(manifest.manufacturerPages[0],/\/t25-intl$/);
  assert.match(manifest.manufacturerPages[1],/\/t115-intl$/);
});

test("Four-source staging remains review-only without fast retry or production writes",()=>{
  assert.equal((stage.match(/https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/thumb\//g)||[]).length,4);
  assert.match(stage,/core\.main\(\)/);
  assert.doesNotMatch(stage,/supabase|gh pr merge|wrangler deploy|approvedToPublish\s*=\s*True/);
});
