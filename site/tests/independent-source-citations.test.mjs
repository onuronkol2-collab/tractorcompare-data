import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {reviewedIndependentSourceUrl,officialManufacturerSourceUrl,specificationEvidenceLevel} from "../src/lib/catalog.ts";
import {INDEPENDENT_SOURCE_COPY} from "../src/lib/independent-source-i18n.ts";
import {modelSeoMetadata,modelStructuredData} from "../src/lib/model-seo.ts";

const ref={
 source_url:"https://www.tractordata.com/farm-tractors/008/2/3/8231-ls-j27-engine.html",
 source_type:"web_page",
 evidence_text:"TractorData, LS J27 Mitsubishi S3L2 3-cylinder engine technical details.",
 verified_at:"2026-11-19T18:00:00Z"
};
const dl={
 source_url:"https://pruefberichte.dlg.org/filestorage/CASE-IH_JX_90_U-Nr2078-2003-englisch.pdf",
 source_type:"independent_test",
 evidence_text:"DLG independent JX 90 test: measured results and protocol",
 verified_at:"2026-11-19T18:00:00Z"
};
test("independent source URL is explicitly attributed, not manufacturer-labelled",()=>{
 assert.equal(specificationEvidenceLevel(ref),"third_party_reported");
 assert.equal(reviewedIndependentSourceUrl(ref),ref.source_url);
 assert.equal(officialManufacturerSourceUrl(ref,"LS Tractor"),null);
 assert.equal(reviewedIndependentSourceUrl(dl),dl.source_url);
 for(const source_url of [
  "https://www.tractordata.com.bad.example/farm-tractors/008/a.html",
  "https://www.tractordata.com@bad.example/farm-tractors/008/a.html",
  "http://www.tractordata.com/farm-tractors/008/a.html",
  "javascript:alert(1)",
  "https://www.tractordata.com/",
  "https://pruefberichte.dlg.org.fraud.example/filestorage/data.pdf",
  "https://pruefberichte.dlg.org/filestorage/report.exe",
  "https://www.tractordata.com/farm-tractors/fake.htm",
 ])assert.equal(reviewedIndependentSourceUrl({...ref,source_url}),null,source_url);
 for(const invalid of [
  {...ref,evidence_text:""},
  {...ref,verified_at:null},
  {...ref,source_type:"manufacturer_specification"},
  {...ref,source_type:"dealer_listing"},
  {...ref,source_url:"https://www.tractordata.com@bad.example/farm-tractors/008/a.html"},
 ])assert.equal(reviewedIndependentSourceUrl(invalid),null);
});
test("verified manufacturer host permissions do not authorize lookalike unrelated origins",()=>{
 for(const [brand,url] of [
  ["Yanmar","https://www.yanmar.com/tr/agri/products/tractor/sa222r/"],
  ["Swaraj","https://www.swarajtractors.com/swaraj-717-tractor"],
  ["Kioti","https://www.kioti.com/products/tractors/cx/cx2510"],
  ["Kioti","https://www.kioti-uk.com/wp-content/uploads/2025/01/brochure.pdf"]
 ])assert.equal(officialManufacturerSourceUrl({...ref,source_url:url,source_type:"manufacturer_specification"},brand),url);
 assert.equal(officialManufacturerSourceUrl({...ref,source_type:"manufacturer_specification",source_url:"https://kioti-uk.com.evil.example/brochure.pdf"},"Kioti"),null);
});
test("newly released official brochures show citations without opening shared CNH host broadly",()=>{
 const official={...ref,source_type:"manufacturer_specification"};
 const good=[
   ["Landini","https://www.landini.it/wp-content/uploads/2017/11/flipbook-serie-2-ita-2017-cpy-2.pdf"],
   ["Valtra","https://www.valtra.nl/content/dam/Brands/Valtra/en/Products/Brochures/2025/Valtra_Modelrange_brochure_2025_UK_screen-0201.pdf"],
   ["SAME","https://www.same-tractors.com/media/308.8192.3.1-0_Dorado_Natural_EN_1.pdf"],
   ["Versatile","https://www.versatile-ag.com/NA/downloads/brochure/Versatile-Brochure-Nemesis.pdf"],
   ["STEYR","https://www.steyr-traktoren.com/en/agriculture/products/tractors/cervus-cvt"],
   ["Steyr","https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/5f70203baa834372905d759fe9fd706f?v=fc8d3927"],
   ["Steyr","https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/7eeca058f2bd4fe6892c36fcb39769a1?v=ebff5e26"],
 ];
 for(const [brand,url] of good) assert.equal(officialManufacturerSourceUrl({...official,source_url:url},brand),url);
 for(const url of [
   "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/unknown-file?v=evil",
   "https://cnhi-p-001-delivery.sitecorecontenthub.cloud.evil.example/api/public/content/5f70203baa834372905d759fe9fd706f?v=fc8d3927",
   "https://www.valtra.nl.attacker.example/pdfs/tricky.pdf",
   "https://www.same-tractors.com@attacker.example/official.pdf",
 ]) assert.equal(officialManufacturerSourceUrl({...official,source_url:url},"Steyr"),null);
 assert.equal(officialManufacturerSourceUrl({...official,source_url:good[5][1],evidence_text:null},"Steyr"),null);
 assert.equal(officialManufacturerSourceUrl({...official,source_url:good[5][1],verified_at:null},"Steyr"),null);
});

test("all ten locales distinguish independent evidence from manufacturer confirmation",()=>{
 const model={tractor_id:"ls-j27",brand_name:"LS Tractor",model_name:"J27",variant:"GEAR",market:"global",model_year:null,horsepower:27,
 brand_country:"South Korea",brand_website_url:"https://www.lstractor.com/",slug:"ls-tractor-j27-fixture",
 engine:null,transmission:null,drivetrain:null,weight_kg:null,
 specifications:[{...ref,spec_id:"j27-engine",spec_name:"Engine model",spec_value:"Mitsubishi S3L2",unit:null,canonical_key:"engine_model",
 comparison_class:"engine",measurement_standard:null,rated_rpm:null,source_publisher:"TractorData",source_accessed_at:"2026-11-19T18:00:00Z",spec_source_priority:60}]};
 for(const lang of LOCALES){
  const copy=INDEPENDENT_SOURCE_COPY[lang]; assert.ok(copy?.label.length>5&&copy?.seoOnlyIndependent.length>12);
  const meta=modelSeoMetadata(model,lang);
  assert.ok(meta.description.includes(copy.seoOnlyIndependent),lang+": independent evidence must not imply manufacturer confirmation");
  const ld=modelStructuredData(model,lang,"https://tractorvs.com");
  const text=JSON.stringify(ld);
  assert.ok(text.includes(ref.source_url),"independent citation linked in structured metadata "+lang);
 }
 const detail=readFileSync(new URL("../src/components/TractorDetail.astro",import.meta.url),"utf8");
 assert.match(detail,/reviewedIndependentSourceUrl\(spec\)/);
 assert.match(detail,/INDEPENDENT_SOURCE_COPY\[lang\]\.label/);
});

test("original Belarus manufacturer brochure mirrored by a distributor is attributed only as historical third-party-hosted evidence",()=>{
 const source_url="https://netetrade.com/media/mtw-holding---minsk-tractor-works/files/cb7a65db-f4fd-4c05-a33f-d0a827bbc2ba.pdf";
 const spec={...ref,source_url,source_type:"independent_catalog",evidence_text:"Original Minsk Tractor Works catalogue printed page 5: Belarus 132N GX390 model specifications"};
 assert.equal(specificationEvidenceLevel(spec),"third_party_reported");
 assert.equal(reviewedIndependentSourceUrl(spec),source_url);
 assert.equal(officialManufacturerSourceUrl(spec,"Belarus"),null);
 for(const url of [
  "http://netetrade.com/media/mtw-holding---minsk-tractor-works/files/cb7a65db-f4fd-4c05-a33f-d0a827bbc2ba.pdf",
  "https://netetrade.com.evil.example/media/mtw-holding---minsk-tractor-works/files/cb7a65db-f4fd-4c05-a33f-d0a827bbc2ba.pdf",
  "https://netetrade.com@evil.example/media/mtw-holding---minsk-tractor-works/files/cb7a65db-f4fd-4c05-a33f-d0a827bbc2ba.pdf",
  "https://netetrade.com/media/mtw-holding---minsk-tractor-works/files/other.pdf",
  source_url+"?untrusted=1",
 ]) assert.equal(reviewedIndependentSourceUrl({...spec,source_url:url}),null);
 assert.equal(reviewedIndependentSourceUrl({...spec,source_type:"manufacturer_specification"}),null);
 assert.equal(reviewedIndependentSourceUrl({...spec,verified_at:null}),null);
});

test("the distributor-hosted Belarus catalogue stays attributed to a third-party host",()=>{
 const url="https://kocyigit.com.tr/wp-content/uploads/2024/06/Katalog_Belarus_Traktor.pdf";
 const row={...ref,source_url:url,source_type:"product_catalog"};
 assert.equal(reviewedIndependentSourceUrl(row),url);
 assert.equal(officialManufacturerSourceUrl(row,"Belarus"),null);
 assert.equal(reviewedIndependentSourceUrl({...row,source_url:url+"?other"}),null);
 assert.equal(reviewedIndependentSourceUrl({...row,evidence_text:null}),null);
});

test("archived STEYR editions link to their reviewed copy with the correct host attribution",()=>{
 const kompakt={...ref,source_url:"https://assets.cnhindustrial.com/steyr/assets/Municipality/Products/Tractors/Kompakt%20Series/Brochures/15s0019cominb_steyr_kompakt_bro_low.pdf",source_type:"manufacturer_specification"};
 const absolut={...kompakt,source_url:"https://assets.cnhindustrial.com/steyr/assets/Agriculture/Products/Tractors/Absolut%20Series/NEUE%206280%20ABSOLUT%20CVT/Brochures/2023/23s0001-cominb_absolut_p32_low.pdf"};
 assert.equal(officialManufacturerSourceUrl(kompakt,"Steyr"),null);
 assert.equal(reviewedIndependentSourceUrl(kompakt),"https://agroguia.online/wp-content/uploads/2019/10/FOLLETO-KOMPAKT-S.pdf");
 assert.equal(officialManufacturerSourceUrl(absolut,"Steyr"),"https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/76a92c3114b14b28a2817ad0977309c9?v=ab84c59d");
 assert.equal(officialManufacturerSourceUrl(absolut,"Belarus"),null);
 assert.equal(reviewedIndependentSourceUrl({...kompakt,verified_at:null}),null);
});
