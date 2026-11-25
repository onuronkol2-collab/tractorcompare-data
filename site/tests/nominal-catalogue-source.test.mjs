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
