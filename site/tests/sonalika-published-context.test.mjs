import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {officialManufacturerSourceUrl} from "../src/lib/catalog.ts";
import {modelSeoMetadata} from "../src/lib/model-seo.ts";
import {hasInternationalSonalikaContext,isSonalikaExportSourceNote,SONALIKA_EXPORT_COPY,EXPORT_PRODUCT_SOURCE_PREFIX} from "../src/lib/sonalika-context-i18n.ts";

const official = {
 source_type:"official_product_page",
 source_url:"https://international.sonalika.com/product/sonalika-20/",
 evidence_text:"Sonalika International, 20: HP Category = 20 hp",
 verified_at:"2026-11-18T16:12:00Z",
};
const tractor={
 tractor_id:"sonalika-audit-fixture",brand_name:"Sonalika",model_name:"20",
 variant:null,market:"global",model_year:null,horsepower:20,
 specifications:[{...official,canonical_key:"engine_hp_category",spec_name:"HP Category",spec_value:"20",unit:"hp"}]
};

test("exact manufacturer domain is accepted only with verified, model-specific evidence",()=>{
 assert.equal(officialManufacturerSourceUrl(official,"Sonalika"),official.source_url);
 const bad=[
  "https://international.sonalika.com.evil.example/product/sonalika-20/",
  "https://international.sonalika.com@evil.example/product/sonalika-20/",
  "http://international.sonalika.com/product/sonalika-20/",
  "https://sonalika.com/product/sonalika-20/",
  "https://example.com/product/sonalika-20/"
 ];
 for(const source_url of bad)
  assert.equal(officialManufacturerSourceUrl({...official,source_url},"Sonalika"),null,source_url);
 assert.equal(officialManufacturerSourceUrl({...official,verified_at:null},"Sonalika"),null);
 assert.equal(officialManufacturerSourceUrl({...official,evidence_text:null},"Sonalika"),null);
 assert.equal(officialManufacturerSourceUrl({...official,source_type:"dealer_listing"},"Sonalika"),null);
 assert.equal(officialManufacturerSourceUrl(official,"Another Brand"),null);
});

test("manufacturer HP category is not mislabeled as tested rated engine or PTO power",()=>{
 assert.equal(hasInternationalSonalikaContext(tractor),true);
 assert.equal(hasInternationalSonalikaContext({...tractor,brand_name:"Another Brand"}),false);
 for(const lang of LOCALES){
  const copy=SONALIKA_EXPORT_COPY[lang];
  assert.ok(copy?.heading.length>12&&copy?.note.length>60&&copy?.hpLabel.length>5);
  const seo=modelSeoMetadata(tractor,lang);
  assert.ok(seo.description.includes(copy.hpDescription(20)),lang+" must display qualified HP category");
  assert.ok(seo.description.includes("Sonalika 20"));
  assert.ok(seo.description.length>80);
  assert.ok(copy.hpDescription(20).includes("20"),lang);
 }
});

test("translated single source uncertainty notice preserves raw evidence only in database",()=>{
 assert.equal(isSonalikaExportSourceNote(EXPORT_PRODUCT_SOURCE_PREFIX+" Country, 2WD/4WD..."),true);
 assert.equal(isSonalikaExportSourceNote("Official ISO drawbar test"),false);
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(detail,/isSonalikaExport\s*&&\s*<aside/);
 assert.match(detail,/sonalikaCopy\.heading/);
 assert.match(detail,/sonalikaCopy\.note/);
 assert.match(detail,/isSonalikaExportSourceNote\(spec\.measurement_standard\)/);
 assert.match(detail,/sonalikaCopy\.hpLabel/);
});
