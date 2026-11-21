import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RESIDUAL_PUBLIC_SPEC_TERMS} from "../src/lib/residual-public-spec-translations.ts";
import {publishedSpecificationLabel,validatePublishedSpecTranslations} from "../src/lib/published-spec-translations.ts";
import {specLabel} from "../src/lib/catalog.ts";
import {LOCALES} from "../src/lib/locales.ts";

const baseline=JSON.parse(readFileSync(new URL("./fixtures/turkish-public-heading-residual-20261121.json",import.meta.url),"utf8"));
const exampleSpec=name=>({canonical_key:"unmapped_technical_source_heading",spec_name:name,spec_value:"25",unit:"hp",measurement_standard:"NBR ISO 1585",verified_at:"2026-11-21T15:15:00Z",source_url:"https://example.org/sheet.pdf",evidence_text:"Verified source excerpt"});

test("all 80 Turkish fallback headings from the 379-model audit now resolve to reviewed Turkish",()=>{
  assert.equal(LOCALES.length,10);
  assert.equal(baseline.distinctHeadings,80);
  assert.equal(baseline.occurrences,101);
  assert.equal(baseline.terms.reduce((total,x)=>total+x.count,0),101);
  assert.doesNotThrow(validatePublishedSpecTranslations);
  const before=new Set();
  for(const {english,exampleSlugs} of baseline.terms){
    assert.ok(!before.has(english),english+" duplicated");
    before.add(english);
    assert.ok(exampleSlugs.length>=1,english+" has no public slug");
    const translated=publishedSpecificationLabel(english,"tr");
    assert.ok(translated?.trim(),english+" missing Turkish display term");
    assert.notEqual(translated.toLocaleLowerCase("tr"),english.toLocaleLowerCase("tr"),english+" unchanged");
    const spec=exampleSpec(english),orig=structuredClone(spec);
    assert.equal(specLabel(spec,"tr"),translated,english+" overridden by an unsafe generic fallback");
    assert.deepEqual(spec,orig,english+" mutated the source record");
  }
  assert.equal(before.size,80);
});

test("technical qualifiers are kept distinct in the inspected Turkish headings",()=>{
  const tr=n=>publishedSpecificationLabel(n,"tr");
  assert.notEqual(tr("Manufacturer Rated Power"),tr("Manufacturer Stated Power"));
  assert.notEqual(tr("Operating Weight Without Ballast"),tr("Operating Weight (Brochure Configuration)"));
  assert.notEqual(tr("Speed Range Forward"),tr("Speed Range Reverse"));
  assert.notEqual(tr("Front Diff Lock Type"),tr("Rear Diff Lock Type"));
  assert.match(tr("Maximum Speed (Brochure, Tyre-Dependent) - Mechanical"),/lastiğe bağlı/i);
  assert.match(tr("Maximum Speed (Brochure, Tyre-Dependent) - Powershuttle"),/PowerShuttle/);
  assert.match(tr("Manufacturer Engine Power (Metric Hp)"),/metrik bg/);
  assert.match(tr("F36CHN HST Transmission Ranges"),/F36CHN HST/);
});

test("reviewed additions remain explicit locale pairs, without generic/AI source-value translation",()=>{
  let added=0;
  for(const [english,entries] of Object.entries(RESIDUAL_PUBLIC_SPEC_TERMS)){
    for(const [locale,translated] of Object.entries(entries)){
      added++;
      assert.ok(LOCALES.includes(locale)&&locale!=="en",english+" unsupported locale");
      assert.ok(translated.trim(),english+" "+locale+" missing");
      assert.notEqual(translated.trim().toLocaleLowerCase(locale),english.trim().toLocaleLowerCase(locale),english+" "+locale+" unchanged");
    }
  }
  assert.ok(added>=450,"audit should include selected frequent PT/FR/ES/ZH/HI/DE/RU/JA gaps");
  assert.equal(publishedSpecificationLabel("Unknown manufacturer text that nobody verified","tr"),null);
  assert.equal(publishedSpecificationLabel("Manufacturer Rated Power","en"),null);
});

test("nine translated locales preserve power standard and 2WD/4WD conditions",()=>{
  for(const locale of LOCALES.filter(x=>x!=="en")){
    const p=name=>specLabel(exampleSpec(name),locale);
    const maxKW=p("Azami Motor GüCü (ECE R120, KW)");
    const maxCV=p("Azami Motor GüCü (ECE R120, CV)");
    const nominalKW=p("Nominal Motor GüCü (ECE R120, KW)");
    assert.match(maxKW,/ECE R120/i);
    assert.match(maxCV,/ECE R120/i);
    assert.match(nominalKW,/ECE R120/i);
    assert.notEqual(maxKW,maxCV,locale+" cannot conflate kW and cv");
    assert.notEqual(maxKW,nominalKW,locale+" cannot conflate maximum and nominal");
  }
  for(const locale of ["tr","pt-br","fr","es"]){
    const a=specLabel(exampleSpec("Max Speed 4wd Kmh"),locale);
    const b=specLabel(exampleSpec("Min Speed 4wd Kmh"),locale);
    assert.notEqual(a,b,locale+" minimum vs maximum");
    assert.match(a,/4WD|4RM/i,locale+" lost 4WD condition");
  }
});

test("previously reviewed EPM and ISO standard translations are not overridden",()=>{
  for(const locale of LOCALES.filter(x=>x!=="en")){
    const epm=publishedSpecificationLabel("Maximum Engine Power With EPM",locale);
    assert.ok(epm?.includes("EPM"),locale+" EPM lost");
    const iso=publishedSpecificationLabel("Maximum engine power ISO TR 14396",locale);
    assert.ok(iso?.includes("14396"),locale+" ISO lost");
  }
});
