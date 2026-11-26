import test from "node:test";
import assert from "node:assert/strict";
import {officialManufacturerSourceUrl,specificationEvidenceLevel} from "../src/lib/catalog.ts";
import {modelSeoMetadata,modelStructuredData} from "../src/lib/model-seo.ts";
import {LOCALES,localizedPath,LOCALE_TAGS} from "../src/lib/locales.ts";

const url="https://ytocorp.com/5-5-2-90-110hp-tractor-nlx-nly-series.html";
// All record identities and values below are synthetic fixtures, never draft data.
const documented={source_url:url,source_type:"official_product_catalog",evidence_text:"Synthetic test fixture only",verified_at:"2026-11-25T00:00:00Z"};

test("exact reviewed YTO document supports manufacturer attribution",()=>{
  assert.equal(specificationEvidenceLevel(documented),"manufacturer_documented");
  assert.equal(officialManufacturerSourceUrl(documented,"YTO"),url);
});
test("YTO approval does not extend to arbitrary documents, brands or unchecked claims",()=>{
  for(const changed of [
    {...documented,source_url:"https://ytocorp.com/unreviewed.html"},
    {...documented,source_url:url+"?other=1"},
    {...documented,source_url:"https://ytocorp.com.attacker.invalid/"},
    {...documented,source_url:url.replace("https:","http:")},
    {...documented,source_type:"web_page"},
    {...documented,verified_at:null},
    {...documented,verified_at:"invalid"},
    {...documented,evidence_text:" "}
  ])assert.equal(officialManufacturerSourceUrl(changed,"YTO"),null);
  assert.equal(officialManufacturerSourceUrl(documented,"Başak Traktör"),null);
});
test("ten-language model SEO preserves identity and exact citations, not an omitted power claim",()=>{
  const model={tractor_id:"f0000001-0000-4000-8000-000000000001",
    brand_name:"YTO",model_name:"Synthetic QA specimen (not a real model)",slug:"yto-synthetic-qa-f0000001",
    market:"International",variant:"Synthetic test configuration",model_year:null,horsepower:null,
    engine:null,transmission:null,drivetrain:null,weight_kg:null,brand_country:null,brand_website_url:null,
    specifications:[{...documented,spec_id:"f0000002-0000-4000-8000-000000000002",
      spec_name:"Wheelbase",spec_value:"2000",unit:"mm",canonical_key:"wheelbase",
      comparison_class:"dimensions",measurement_standard:"Synthetic value",rated_rpm:null,
      source_publisher:"Synthetic fixture",source_accessed_at:"2026-11-25",spec_source_priority:100}]};
  for(const lang of LOCALES){
    const meta=modelSeoMetadata(model,lang);
    assert.ok(meta.title.includes(model.brand_name+" "+model.model_name),lang);
    assert.ok(meta.searchDescription.includes(model.model_name),lang);
    assert.ok(!/999\s*(?:hp|kW)/i.test(meta.searchDescription),lang);
    const schema=modelStructuredData(model,lang,"https://tractorvs.example");
    const page=schema["@graph"].find(x=>x["@type"]==="WebPage");
    assert.equal(page.url,"https://tractorvs.example"+localizedPath(lang,"/tractors/"+model.slug+"/"));
    assert.equal(page.inLanguage,LOCALE_TAGS[lang]);
    assert.deepEqual(page.citation,[url]);
    assert.ok(!schema["@graph"].some(x=>["Product","Offer","Review","ImageObject"].includes(x["@type"])),lang);
  }
});

test("published Kioti headings retain exact tire category, axle and width in failed-audit locales",async()=>{
  const {specLabel}=await import("../src/lib/catalog.ts");
  const fixtures=[
    ["Front agricultural tire","front_agricultural_tire",{"pt-br":"Pneu agrícola dianteiro",fr:"Pneu agricole avant",es:"Neumático agrícola delantero"}],
    ["Rear agricultural tire","rear_agricultural_tire",{"pt-br":"Pneu agrícola traseiro",fr:"Pneu agricole arrière",es:"Neumático agrícola trasero"}],
    ["Front industrial tire","front_industrial_tire",{"pt-br":"Pneu industrial dianteiro",fr:"Pneu industriel avant",es:"Neumático industrial delantero"}],
    ["Rear industrial tire","rear_industrial_tire",{"pt-br":"Pneu industrial traseiro",fr:"Pneu industriel arrière",es:"Neumático industrial trasero"}],
    ["Front R14 tire option","front_r14_tire_option",{"pt-br":"Opção de pneu dianteiro R14",fr:"Option de pneu avant R14",es:"Opción de neumático delantero R14"}],
    ["Rear R14 tire option","rear_r14_tire_option",{"pt-br":"Opção de pneu traseiro R14",fr:"Option de pneu arrière R14",es:"Opción de neumático trasero R14"}],
    ["Front tread","front_tread_mm",{"pt-br":"Bitola dianteira",fr:"Voie avant",es:"Ancho de vía delantero"}],
    ["Rear tread","rear_tread_mm",{"pt-br":"Bitola traseira",fr:"Voie arrière",es:"Ancho de vía trasero"}],
    ["Front turf tire","front_turf_tire",{"pt-br":"Pneu dianteiro para gramados",fr:"Pneu avant pour gazon",es:"Neumático delantero para césped"}],
    ["Rear turf tire","rear_turf_tire",{"pt-br":"Pneu traseiro para gramados",fr:"Pneu arrière pour gazon",es:"Neumático trasero para césped"}],
    ["Overall height","overall_height_mm",{"pt-br":"Altura total",es:"Altura total"}],
    ["Hitch control","hitch_control_type",{de:"Hubwerksregelung"}],
  ];
  let checked=0;
  for(const [name,key,expected] of fixtures){
    const spec={spec_name:name,canonical_key:key,spec_value:"123",unit:null};
    for(const [locale,label] of Object.entries(expected)){
      assert.equal(specLabel(spec,locale),label,name+" "+locale);
      checked++;
    }
    assert.equal(spec.spec_value,"123");
  }
  assert.equal(checked,33);
});
