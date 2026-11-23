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


test("2026-11-22 built-preview Turkish residuals: ten exact labels keep all source values and qualifiers",()=>{
  const reviewed=new Map([
    ["Clutch And Gearbox Architecture","Debriyaj ve şanzımanın yapısı"],
    ["ComfortClutch Hand-Clutch Function","ComfortClutch el kumandalı debriyaj işlevi"],
    ["PowerShuttle","PowerShuttle ileri/geri yön değiştirme sistemi"],
    ["Stop & Go Clutchless Stop-Start","Stop & Go debriyajsız dur-kalk işlevi"],
    ["Maximum Road Speed (ECO)","Azami yol hızı (ECO)"],
    ["Mechanical Shuttle","Mekanik ileri/geri yön değiştirici"],
    ["Transmission Speed Configuration","Şanzıman hız kademesi düzeni"],
    ["Overall Width (Minimum–Maximum)","Toplam genişlik (asgari–azami)"],
    ["Tractor Weight With Cab, Without Additional Ballast","Ek balastsız kabinli traktör ağırlığı"],
    ["Transmission Multiplier","Şanzıman kademe çarpanı"],
  ]);
  assert.equal(reviewed.size,10);
  for(const [english,turkish] of reviewed){
    assert.equal(REVIEWED_PUBLIC_SPEC_HEADINGS[english]?.tr,turkish,english);
    assert.equal(publishedSpecificationLabel(english,"tr"),turkish,english);
    const spec={...data,spec_name:english,measurement_standard:"as cited by OEM",
      equipment_variant:"source configuration",model_year:2026};
    const before=structuredClone(spec);
    assert.equal(specLabel(spec,"tr"),turkish,english);
    assert.deepEqual(spec,before,english+" source details must not be translated or mutated");
  }
  assert.match(publishedSpecificationLabel("Maximum Road Speed (ECO)","tr"),/ECO/);
  assert.match(publishedSpecificationLabel("PowerShuttle","tr"),/PowerShuttle/);
  assert.match(publishedSpecificationLabel("Stop & Go Clutchless Stop-Start","tr"),/Stop & Go/);
  assert.match(publishedSpecificationLabel("ComfortClutch Hand-Clutch Function","tr"),/ComfortClutch/);
  assert.notEqual(publishedSpecificationLabel("Mechanical Shuttle","tr"),
    publishedSpecificationLabel("PowerShuttle","tr"));
});

test("2026-11-23 published-preview zero-regression labels retain exact model terminology",()=>{
  const entries=[
    ["Mechanical Gearbox","tr","Mekanik şanzıman"],
    ["Travel Speed Range","tr","Sürüş hızı aralığı"],
    ["Weight With Air Cab","tr","Air Cab kabinli ağırlık"],
    ["Weight With Protector Cab","tr","Protector Cab kabinli ağırlık"],
    ["Weight With Air Cab","ru","Масса с кабиной Air Cab"],
    ["Weight With Protector Cab","ru","Масса с кабиной Protector Cab"],
    ["Rear Wheel Diameter Options Inch","zh","后轮直径选项（英寸）"],
    ["Engine Cooling","ja","エンジン冷却"],
  ];
  for(const [english,locale,translated] of entries){
    assert.equal(REVIEWED_PUBLIC_SPEC_HEADINGS[english][locale],translated);
    assert.equal(publishedSpecificationLabel(english,locale),translated);
    const spec={...data,spec_name:english,evidence_text:"OEM source text",
      spec_value:"1990",unit:"kg"};
    const before=structuredClone(spec);
    assert.equal(specLabel(spec,locale),translated);
    assert.deepEqual(spec,before,"only the visible heading should change");
  }
  assert.notEqual(publishedSpecificationLabel("Weight With Air Cab","ru"),
    publishedSpecificationLabel("Weight With Protector Cab","ru"));
});
