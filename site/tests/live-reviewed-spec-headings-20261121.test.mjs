import test from "node:test";
import assert from "node:assert/strict";
import { LIVE_REVIEWED_SPEC_HEADINGS_20261121 as REVIEWED } from "../src/lib/live-reviewed-spec-headings-20261121.ts";
import { publishedSpecificationLabel, validatePublishedSpecTranslations } from "../src/lib/published-spec-translations.ts";
import { specLabel } from "../src/lib/catalog.ts";

const sourceSpec=(name)=>({
  canonical_key:"unmapped_public_source_heading",
  spec_name:name,spec_value:"125",unit:"kW",
  measurement_standard:"ECE R120",source_url:"https://example.org/source.pdf",
  evidence_text:"Actual cited source record",verified_at:"2026-11-21T16:00:00Z"
});

test("82 live-observed exact technical headings have reviewed localized variants",()=>{
  assert.equal(Object.keys(REVIEWED).length,82);
  assert.doesNotThrow(validatePublishedSpecTranslations);
  let translated=0;
  for(const [name,langMap] of Object.entries(REVIEWED)){
    assert.ok(name.trim());
    for(const [lang,localized] of Object.entries(langMap)){
      translated++;
      assert.ok(["pt-br","fr","es"].includes(lang),name+" unknown locale");
      assert.ok(localized.trim(),name+" blank");
      assert.notEqual(localized.toLocaleLowerCase(lang),name.toLocaleLowerCase(lang));
      assert.equal(publishedSpecificationLabel(name,lang),localized,name+" "+lang);
      const record=sourceSpec(name),before=structuredClone(record);
      assert.equal(specLabel(record,lang),localized,name+" "+lang+" not used on public page");
      assert.deepEqual(record,before,"Localized display must not mutate OEM source measurements");
    }
  }
  assert.equal(translated,198);
});

test("no speculative translation on unfamiliar source-specific technical headings",()=>{
  assert.equal(publishedSpecificationLabel("Unknown OEM-variant hydraulic qualifier XXX","fr"),null);
  assert.equal(publishedSpecificationLabel("Transmission Gears – Basic Mechanical Shuttle","en"),null);
  assert.equal(publishedSpecificationLabel("Ground Clearance Ge Mm","fr"),null);
});

test("source technical conditions and drivetrain are not conflated",()=>{
  const tr=(key,lang)=>publishedSpecificationLabel(key,lang);
  for(const locale of ["pt-br","fr","es"]){
    assert.notEqual(tr("2WD Yerden AçıKlıK",locale),tr("4WD Yerden AçıKlıK",locale));
    assert.notEqual(tr("En DüşüK SüRüş HıZı",locale),tr("En YüKsek SüRüş HıZı",locale));
    assert.notEqual(tr("Maximum Speed (Brochure, Tyre-Dependent) - Mechanical",locale),
      tr("Maximum Speed (Brochure, Tyre-Dependent) - Powershuttle",locale));
    assert.match(tr("R1 Agricultural Front Tyre",locale),/R1/);
    assert.match(tr("ÖN PTO 1000E IçIn Motor Devri",locale),/1000E/);
    assert.match(tr("Number Of Speeds - 5 Gears Transmission - Powershuttle",locale),/5/);
  }
});
