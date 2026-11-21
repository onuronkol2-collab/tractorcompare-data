import test from "node:test";
import assert from "node:assert/strict";
import {REVIEWED_PUBLIC_SPEC_HEADINGS} from "../src/lib/reviewed-public-spec-headings.ts";
import {PUBLISHED_SPEC_TERMS,publishedSpecificationLabel,validatePublishedSpecTranslations} from "../src/lib/published-spec-translations.ts";
import {specLabel} from "../src/lib/catalog.ts";
import {LOCALES} from "../src/lib/locales.ts";

const data={canonical_key:"unmapped_reviewed_source",spec_name:"Gearbox",spec_value:"16F/16R",unit:"ratio",source_url:"https://example.org/engine-spec.pdf"};

test("reviewed translation batch is explicit, deterministic and never changes raw specs",()=>{
  assert.ok(Object.keys(REVIEWED_PUBLIC_SPEC_HEADINGS).length>=80);
  assert.doesNotThrow(validatePublishedSpecTranslations);
  const before=structuredClone(data);
  assert.equal(specLabel(data,"tr"),"Şanzıman");
  assert.equal(specLabel(data,"fr"),"Boîte de vitesses");
  assert.equal(specLabel(data,"es"),"Caja de cambios");
  assert.equal(specLabel(data,"ru"),"Коробка передач");
  assert.deepEqual(data,before);
});
test("every reviewed source heading has unique canonical key and explicit locale-only labels",()=>{
  assert.equal(LOCALES.length,10);
  const items=Object.entries(REVIEWED_PUBLIC_SPEC_HEADINGS);
  assert.equal(new Set(items.map(([k])=>k.trim().replace(/_/g," ").replace(/\s+/g," ").toLowerCase())).size,items.length);
  let count=0;
  for(const [name,labels] of items){
    assert.ok(PUBLISHED_SPEC_TERMS[name],name);
    for(const [locale,translated] of Object.entries(labels)){
      count++;
      assert.ok(LOCALES.includes(locale) && locale!=="en",name+" "+locale);
      assert.ok(translated.trim() && translated.toLowerCase()!==name.toLowerCase(),name+" "+locale);
      assert.equal(publishedSpecificationLabel(name.toLowerCase(),locale),translated,name+" "+locale);
    }
  }
  assert.ok(count>=160);
});
test("English source with exact historical Turkish labels has readable display text in English, not silently altered values",()=>{
  const samples=[
    ["Debriyaj Tipi","Clutch type"],
    ["Ana Debriyaj","Main clutch"],
    ["Ana Vites Tipi","Main gear type"],
    ["ÇEkiş Sistemi","Drive system"],
    ["YakıT Deposu","Fuel tank"],
  ];
  for(const [original,expected] of samples){
    const spec={...data,spec_name:original};
    assert.equal(specLabel(spec,"en"),expected,original);
    assert.ok(specLabel(spec,"tr"),original||"");
    assert.equal(spec.spec_name,original);
    assert.equal(spec.spec_value,"16F/16R");
  }
  assert.equal(specLabel({...data,spec_name:"Unconfirmed OEM field"},"en"),"Unconfirmed OEM Field");
});
test("measurement conditions remain visible and are not collapsed into rated-power claims",()=>{
  for(const locale of ["tr","hi","ru","ja"]){
    const epm=specLabel({...data,spec_name:"Maximum Engine Power With EPM"},locale);
    assert.match(epm,/EPM/i);
    const noBoost=specLabel({...data,spec_name:"Maximum engine power without boost"},locale);
    assert.ok(noBoost);
    assert.notEqual(epm,noBoost);
    const iso=specLabel({...data,spec_name:"Maximum engine power ISO TR 14396"},locale);
    assert.match(iso,/14396/);
  }
});
test("2WD/4WD speed qualifiers, tractor lift range and source types stay distinct",()=>{
  const tr=n=>specLabel({...data,spec_name:n},"tr");
  assert.match(tr("Max Speed 4wd Kmh"),/4WD/);
  assert.match(tr("Max Speed 2wd Kmh"),/2WD/);
  assert.notEqual(tr("Max Speed 4wd Kmh"),tr("Min Speed 4wd Kmh"));
  assert.notEqual(tr("Lifting Force Across Full Range"),tr("Maximum Hitch Lifting Force"));
  assert.notEqual(tr("Transmission Gears – Creeper Option"),tr("Transmission Gears – Standard"));
});

test("even a generic canonical power key cannot remove EPM across ten locales",()=>{
  for (const locale of LOCALES) {
    const name=specLabel({...data,canonical_key:"engine_max_power_kw",spec_name:"Maximum Engine Power With EPM"},locale);
    assert.match(name,/EPM/i,locale+" lost source-specific boost condition");
    if(locale!=="en")assert.notEqual(name,"Maximum Engine Power With EPM",locale+" has missing EPM translation");
  }
});
