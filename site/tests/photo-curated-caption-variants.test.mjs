import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const registry=JSON.parse(readFileSync(new URL("../docs/photo-curated-caption-and-alias-candidates-20261122.json",import.meta.url),"utf8"));
const approvedSource=readFileSync(new URL("../src/lib/tractor-photos.ts",import.meta.url),"utf8")+
  readFileSync(new URL("../src/lib/historical-licensed-photos.ts",import.meta.url),"utf8");

test("new caption and alias photo discoveries are research-only, never silently published",()=>{
  assert.equal(registry.schemaVersion,1);
  assert.equal(registry.publicationCount,0);
  assert.equal(registry.publicAssetCount,0);
  assert.equal(registry.sourceMediaDownloaded,false);
  assert.equal(registry.allowAutomaticApproval,false);
  assert.ok(registry.researchScope.sitemapPublishedModels>=300);
  assert.equal(registry.researchScope.notExhaustive,true);
  assert.ok(registry.candidates.length>=7);
  for(const candidate of registry.candidates){
    assert.equal(candidate.review.publicationAllowed,false,candidate.fileId);
    assert.equal(candidate.review.binaryVerified,false,candidate.fileId);
    assert.equal(candidate.review.variantScoped,true,candidate.fileId);
    assert.ok(candidate.target.tractor_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/));
    const source=new URL(candidate.source.fileUrl);
    assert.equal(source.protocol,"https:");
    assert.equal(source.hostname,"commons.wikimedia.org");
    assert.ok(source.pathname.startsWith("/wiki/File:"));
    assert.ok(candidate.source.creator&&candidate.source.license&&candidate.source.ownWorkDeclared===true);
    assert.ok(candidate.target.brand&&candidate.target.model&&candidate.target.variantGuard);
    assert.ok(candidate.evidence.method);
    // Nothing from this exploratory file may leak into the approved photos
    // until source JPEG provenance, exact model and CI are independently accepted.
    assert.ok(!approvedSource.includes(candidate.fileId),"A research-only ID was accidentally published: "+candidate.fileId);
  }
  assert.equal(new Set(registry.candidates.map(x=>x.fileId)).size,registry.candidates.length);
  assert.equal(new Set(registry.candidates.map(x=>x.source.fileUrl)).size,registry.candidates.length);
});

test("TYM T3048 F50CHN research is pinned to the exact published tractor UUID",()=>{
  const f50=registry.candidates.find(x=>x.fileId==="tym-t3048-f50chn-marcelx42-2025");
  assert.ok(f50);
  assert.equal(f50.target.brand,"TYM");
  assert.equal(f50.target.model,"T3048");
  assert.equal(f50.target.tractor_id,"458be7b8-f6b8-4319-b264-dc6c7cc36ae7");
  assert.match(f50.target.variantGuard,/F50CHN/);
  assert.equal(f50.review.status,"variant_specific_code_change_required_binary_pending");
  assert.equal(f50.review.publicationAllowed,false);
  // New resolver is strict on tractor UUID, but without independently
  // reviewed JPEG/source proof this candidate remains unpublished.
  assert.ok(!approvedSource.includes(f50.fileId));
  assert.match(approvedSource,/photo\.tractorId===tractor\.tractor_id/);
});

test("near-model or contested rights leads remain explicitly quarantined",()=>{
  const held=new Set([
    "sonalika-di30-baagban-tagooty-2024",
    "tym-t6130-t130-mbone-2023",
    "zetor-major-hs80-marcelx42-2017",
    "tym-t4049-t495sh-marcelx42-2025"
  ]);
  const quarantined=registry.candidates.filter(x=>held.has(x.fileId));
  assert.equal(quarantined.length,4);
  for(const lead of quarantined){
    assert.equal(lead.evidence.exactModel,false);
    assert.equal(lead.review.publicationAllowed,false);
    assert.ok(typeof lead.review.reason==="string"&&lead.review.reason.length>24);
  }
  assert.match(quarantined.find(x=>x.fileId.startsWith("sonalika")).review.reason,/commercial/i);
  assert.match(quarantined.find(x=>x.fileId.startsWith("tym")).review.reason,/T130/);
  assert.match(quarantined.find(x=>x.fileId.startsWith("zetor")).review.reason,/HS 80/);
});

test("strong caption/alias candidates still require real origin JPEG integrity approval",()=>{
  const leads=registry.candidates.filter(x=>x.evidence.exactModel);
  assert.equal(leads.length,4);
  for(const lead of leads){
    assert.equal(lead.review.binaryVerified,false);
    assert.equal(lead.review.publicationAllowed,false);
    assert.match(lead.review.status,/binary_pending/);
  }
  assert.equal(leads.filter(x=>x.target.brand==="TYM").length,3);
});
