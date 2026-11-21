import test from "node:test";
import assert from "node:assert/strict";
import {
  officialManufacturerSourceUrl,
  reviewedIndependentSourceUrl,
  specificationEvidenceLevel
} from "../src/lib/catalog.ts";
import {modelSourceIndex} from "../src/lib/model-source-index.ts";

const verified="2026-11-21T15:20:00Z";
const agrale525="https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-525-1/319/";
const agrale575="https://pdf.agrale.com.br/2019/ficha-tecnica/en/tractor-agrale-575-super-1/255/";
const agrale4125="https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-4125-1/330/";
const mtzManual="https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf";
const src=(source_url,source_type="official_technical_pdf")=>({
  source_url,source_type,evidence_text:"Model- and variant-specific source excerpt",
  verified_at:verified,source_publisher:"Reviewed document"
});

test("Agrale 525 and 575 Super show only their two reviewed, exact manufacturer PDF links",()=>{
  for(const url of [agrale525,agrale575]){
    const entry=src(url);
    assert.equal(specificationEvidenceLevel(entry),"manufacturer_documented");
    assert.equal(officialManufacturerSourceUrl(entry,"Agrale"),url);
    assert.equal(reviewedIndependentSourceUrl(entry),null);
    assert.equal(officialManufacturerSourceUrl(entry,"Unrelated brand"),null);
    assert.equal(officialManufacturerSourceUrl({...entry,evidence_text:null},"Agrale"),null);
    assert.equal(officialManufacturerSourceUrl({...entry,verified_at:null},"Agrale"),null);
    assert.equal(officialManufacturerSourceUrl({...entry,source_url:url+"?tracking=1"},"Agrale"),null);
    assert.equal(officialManufacturerSourceUrl({...entry,source_url:url.replace("pdf.agrale.com.br","pdf.agrale.com.br.evil.example")},"Agrale"),null);
  }
  // Agrale itself publishes an exact 4125 sheet (YD390T 25 cv,
  // NBR ISO 1585; 7 forward/3 reverse). Do not conflate it with 4125 Cargo.
  assert.equal(officialManufacturerSourceUrl(src(agrale4125),"Agrale"),agrale4125);
  assert.equal(officialManufacturerSourceUrl(src(agrale4125),"Other brand"),null);
  assert.equal(officialManufacturerSourceUrl(src(agrale4125.replace("/330/","/999/")),"Agrale"),null);
  assert.equal(officialManufacturerSourceUrl({...src(agrale4125),verified_at:null},"Agrale"),null);
  assert.equal(officialManufacturerSourceUrl({...src(agrale4125),evidence_text:""},"Agrale"),null);
});

test("Belarus 920 and 920.2 cite distributor-hosted original MTZ manual as third-party, never manufacturer",()=>{
  const row=src(mtzManual,"independent_catalog");
  assert.equal(specificationEvidenceLevel(row),"third_party_reported");
  assert.equal(reviewedIndependentSourceUrl(row),mtzManual);
  assert.equal(officialManufacturerSourceUrl(row,"Belarus"),null);
  assert.equal(reviewedIndependentSourceUrl({...row,evidence_text:""}),null);
  assert.equal(reviewedIndependentSourceUrl({...row,verified_at:null}),null);
  assert.equal(reviewedIndependentSourceUrl({...row,source_url:mtzManual+"?rev=1"}),null);
  assert.equal(reviewedIndependentSourceUrl({...row,source_type:"manufacturer_specification"}),null);
  const index=modelSourceIndex({brand_name:"Belarus",specifications:[
    {spec_id:"sample",...row,source_publisher:"MTZ Equipment (distributor)"}
  ]});
  assert.equal(index.totalDocuments,1);
  assert.equal(index.manufacturerDocuments,0);
  assert.equal(index.independentDocuments,1);
  assert.equal(index.linkedSpecifications,1);
  assert.equal(index.documents[0].kind,"independent");
});
