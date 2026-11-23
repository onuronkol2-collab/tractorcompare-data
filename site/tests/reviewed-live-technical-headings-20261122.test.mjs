import test from "node:test";
import assert from "node:assert/strict";
import {specLabel} from "../src/lib/catalog.ts";
import {validatePublishedSpecTranslations} from "../src/lib/published-spec-translations.ts";
import {REVIEWED_LIVE_TECHNICAL_HEADINGS_20261122} from "../src/lib/reviewed-live-technical-headings-20261122.ts";

const targets={"pt-br":117,"fr":122,"es":84};
test("reviewed live French, Brazilian Portuguese, Spanish headings have exact locale-safe display labels",()=>{
 assert.ok(Object.keys(REVIEWED_LIVE_TECHNICAL_HEADINGS_20261122).length>=70);
 assert.doesNotThrow(validatePublishedSpecTranslations);
 for(const [source,localized] of Object.entries(REVIEWED_LIVE_TECHNICAL_HEADINGS_20261122)){
   assert.ok(source.trim());
   for(const [locale,label] of Object.entries(localized)){
     const spec={canonical_key:"unmapped_public_heading",spec_name:source,spec_value:"75 hp @ 2200 rpm",
       unit:"hp",measurement_standard:"ECE R120",source_url:"https://example.com/verified-document",
       equipment_variant:"4WD / HST",model_year:2026};
     const before=structuredClone(spec);
     assert.equal(specLabel(spec,locale),label,locale+" "+source);
     assert.deepEqual(spec,before,locale+" "+source+" mutated manufacturer facts");
     assert.notEqual(label.toLowerCase(),source.toLowerCase());
   }
 }
});
test("priority translations preserve distinct PTO, ballast and transmission qualifiers",()=>{
 const get=(name,lang)=>specLabel({canonical_key:"unmapped_public_heading",spec_name:name,spec_value:"source original",unit:""} ,lang);
 for(const locale of ["pt-br","fr","es"]){
   assert.notEqual(get("Ground-Speed PTO",locale),get("PTO Power At 1000 Rpm (Minimum)",locale));
   assert.notEqual(get("Air Cab Weight Maximum",locale),get("Air Cab Weight Minimum",locale));
   assert.notEqual(get("F36CHN HST Transmission Ranges",locale),get("F36CN Mechanical Gear Configuration",locale));
 }
});
