import assert from "node:assert/strict";
import test from "node:test";
import { modelSeoMetadata, modelStructuredData } from "../src/lib/model-seo.ts";

const tractor = {
  tractor_id:"a02c4df2-c719-5a26-abb2-6195cb8e23e5",
  slug:"mccormick-x5-120-a02c4df2",
  brand_name:"McCormick", model_name:"X5.120", variant:"X5 FPT F36 Stage V",
  market:"Europe", model_year:null, horsepower:114,
  brand_country:"Italy", brand_website_url:null,
  engine:null, transmission:null, drivetrain:null, weight_kg:null,
  specifications:[{
    spec_id:"a", spec_name:"Wheelbase",spec_value:"2355",unit:"mm",
    canonical_key:"wheelbase_mm",comparison_class:"dimensions_weights",
    measurement_standard:"Official brochure",rated_rpm:null,
    evidence_text:"Manufacturer model table",verified_at:"2026-11-18T12:00:00Z",
    source_publisher:"McCormick",source_url:"https://www.mccormick-tractors.com/catalog.pdf",
    source_type:"manufacturer_specification",source_accessed_at:null,spec_source_priority:100,
  }],
};

test("SEO titles distinguish model, market and equipment variant", () => {
  const a = modelSeoMetadata(tractor, "tr");
  const b = modelSeoMetadata({ ...tractor, variant:"Different transmission" }, "tr");
  assert.match(a.title,/X5\.120/);
  assert.match(a.title,/Stage V/);
  assert.match(a.title,/Europe/);
  assert.notEqual(a.title,b.title);
  assert.match(a.description,/114 HP/);
});

test("Vehicle JSON-LD is localized and uses only sourced data", () => {
  const data = modelStructuredData(tractor, "tr", "https://tractorvs.example");
  const graph = data["@graph"];
  const page = graph[0];
  const vehicle = graph[2];
  assert.equal(page.url,"https://tractorvs.example/tr/tractors/mccormick-x5-120-a02c4df2/");
  assert.equal(vehicle["@type"],"Vehicle");
  assert.equal(vehicle.manufacturer.name,"McCormick");
  assert.equal(vehicle.additionalProperty[0].unitText,"mm");
  assert.ok(!("offers" in vehicle));
  assert.ok(!("aggregateRating" in vehicle));
  assert.ok(!("image" in vehicle));
});

test("Unsourced measurements never enter JSON-LD properties", () => {
  const clone = { ...tractor, specifications: tractor.specifications.map(s => ({
    ...s,evidence_text:null
  })) };
  const vehicle = modelStructuredData(clone,"en","https://tractorvs.example")["@graph"][2];
  assert.equal(vehicle.additionalProperty,undefined);
});

test("long manufacturer citation is kept out of the search title", () => {
  const longVariant = "Serie 5 FPT Stage V; EU official brochure / equipment unspecified";
  const model = { ...tractor, brand_name:"Landini", model_name:"5-085",
    variant:longVariant, market:"Europe", horsepower:75 };
  const seo = modelSeoMetadata(model,"en");
  assert.match(seo.title,/Landini 5-085/);
  assert.match(seo.title,/Serie 5 FPT Stage V/);
  assert.doesNotMatch(seo.title,/brochure|unspecified|global/);
  assert.match(seo.description,/equipment unspecified/);
  assert.ok(seo.title.length < 105);
});

test("non-global markets distinguish otherwise identical equipment", () => {
  const usa=modelSeoMetadata({ ...tractor, market:"US" },"en");
  const eu=modelSeoMetadata({ ...tractor, market:"Europe" },"en");
  assert.notEqual(usa.title,eu.title);
  assert.match(usa.title,/US/);
});
