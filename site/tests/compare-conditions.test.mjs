import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {requiresConditionCaution,requiresTransmissionCaution} from "../src/lib/compare-conditions.ts";
import {LOCALES} from "../src/lib/locales.ts";
import {compareText} from "../src/lib/compare-ux.ts";

const row=(value,context,unit="kg",source="https://manufacturer.example/spec")=>({
  value:String(value),context,unit,source
});
const ISEKI=[
  row(3300,"T97 Cabin; lift capacity at link end"),
  row(2150,"T97 ROPS; lift capacity at link end")
];
const NEW_HOLLAND=[
  row(4700,"At ball ends; with 2nd assist ram"),
  row(3450,"610 mm behind ball ends")
];
const TYM_HEIGHT=[
  row(2350,"To top of cabin","mm"),
  row(2440,"To top of ROPS","mm")
];
const TYM_WHEELBASE=[
  row(1750,"HST transmission","mm"),
  row(1770,"Mechanical transmission","mm")
];

test("actual manufacturer-backed multi-configuration families show caution without losing source data",()=>{
  for(const [key,rows] of [
    ["rear_lift_capacity",ISEKI],
    ["rear_lift_capacity",NEW_HOLLAND],
    ["overall_height",TYM_HEIGHT],
    ["wheelbase",TYM_WHEELBASE]
  ]){
    const before=JSON.stringify(rows);
    assert.equal(requiresConditionCaution(key,rows,[]),true,key);
    assert.equal(JSON.stringify(rows),before,"condition check must never edit records");
    assert.ok(rows.every(r=>r.source==="https://manufacturer.example/spec"));
  }
});

test("different measurement contexts across selected tractors get a warning",()=>{
  assert.equal(requiresConditionCaution("rear_lift_capacity",
    [row(3300,"T97 Cabin; lift capacity at link end")],
    [row(3450,"610 mm behind ball ends")]),true);
  assert.equal(requiresConditionCaution("overall_height",
    [row(2515,"ROPS configuration","mm")],
    [row(2350,"To top of cabin","mm")]),true);
  assert.equal(requiresConditionCaution("wheelbase",
    [row(1670,null,"mm")],
    [row(1750,"HST transmission","mm")]),true);
  assert.equal(requiresConditionCaution("rear_lift_capacity",
    [row(2000,"At ball ends","kg")],
    [row(4409,"At ball ends","lb")]),true);
});

test("matched contexts and unrelated specification keys do not get unnecessary warnings",()=>{
  assert.equal(requiresConditionCaution("rear_lift_capacity",
    [row(3000," At ball ends  ")],[row(2900,"at  ball ends")]),false);
  assert.equal(requiresConditionCaution("wheelbase",
    [row(1670,null,"mm")],[row(1750,null,"mm")]),false);
  assert.equal(requiresConditionCaution("overall_height",
    [row(2350,"To top of cabin","mm")],[]),false);
  assert.equal(requiresConditionCaution("engine_max_power",
    [row(110,"Measured with boost")],[row(100,"Measured without boost")]),false);
  assert.equal(requiresConditionCaution("rear_lift_capacity",[],[]),false);
});

test("same two documented configurations have one localized caution in all ten languages",()=>{
  const messages=new Set();
  const sourceTerms={en:/source/i,tr:/kaynak/,zh:/来源/,hi:/स्रोत/,"pt-br":/fontes/,fr:/sources/,de:/Quellen/,ru:/источ/i,ja:/出典/,es:/fuentes/};
  for(const lang of LOCALES){
    const copy=compareText(lang,"conditionCaution");
    assert.equal(typeof copy,"string");
    assert.ok(copy.length>=20,lang+" caution must contain substantive wording");
    assert.match(copy,sourceTerms[lang],lang+" must mention checking original source conditions");
    messages.add(copy);
  }
  assert.equal(messages.size,10);
});

test("initial HTML and interactive comparison use the same caution function and preserve mobile table layout",()=>{
  const compare=readFileSync(new URL("../src/components/TractorComparison.astro",import.meta.url),"utf8");
  const css=readFileSync(new URL("../src/styles/compare-experience.css",import.meta.url),"utf8");
  assert.match(compare,/requiresConditionCaution\(row\.key,row\.left,row\.right\)/);
  assert.match(compare,/requiresConditionCaution\(key,find\(left,key\),find\(right,key\)\)/);
  assert.match(compare,/tc-condition-caution/);
  assert.match(compare,/conditionCaution: cx\(lang,"conditionCaution"\)/);
  assert.match(compare,/conditionCaution:string/);
  assert.match(compare,/role="rowheader"/);
  assert.match(compare,/const visible=commonOnly\?shared:keys/);
  assert.match(css,/\.tc-section \.tc-table \.tc-condition-caution/);
  assert.match(css,/overflow-wrap:anywhere/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("manufacturer-documented MF and TYM transmission choices warn without editing source data",()=>{
  const cases=[
    ["forward_gears", [row(16,"Dyna-4",null),row(24,"Dyna-6",null)]],
    ["reverse_gears", [row(16,"Dyna-4",null),row(24,"Dyna-6",null)]],
    ["transmission_gear_configuration", [row("2-Range","HST transmission",null),row("F6 x R2","SS mechanical transmission",null)]],
    ["transmission_gear_configuration", [row("3-Range","F36HN HST transmission",null),row("F12 x R12","F36RN mechanical transmission",null)]],
    ["transmission_gear_configuration", [row("3-range","HST transmission",null),row("F12 x R12","SS manual transmission",null)]],
    ["transmission_gear_configuration", [row("3-range","HST transmission",null),row("F8 x R8","SS manual transmission",null)]],
  ];
  for(const [key,records] of cases){
    const frozen=JSON.stringify(records);
    assert.equal(requiresTransmissionCaution(key,records,[]),true,key);
    assert.equal(requiresTransmissionCaution(key,[records[0]],[records[1]]),true,key);
    assert.equal(JSON.stringify(records),frozen,"published source rows must not change");
    assert.ok(records.every(item=>item.source==="https://manufacturer.example/spec"));
  }
});

test("transmission warnings avoid unrelated attributes and unsupported variant claims",()=>{
  assert.equal(requiresTransmissionCaution("forward_gears",[row(16,null)],[row(24,null)]),false);
  assert.equal(requiresTransmissionCaution("forward_gears",[row(16,"Dyna-4")],[row(16,"dyna-4")]),false);
  assert.equal(requiresTransmissionCaution("transmission_gear_configuration",[row("3-Range","HST")],[]),false);
  assert.equal(requiresTransmissionCaution("engine_max_power",[row(125,"Dyna-4")],[row(100,"Dyna-6")]),false);
  assert.equal(requiresTransmissionCaution("rear_lift_capacity",[row(2000,"HST")],[row(2500,"SS manual")]),false);
  assert.equal(requiresConditionCaution("forward_gears",[row(16,"Dyna-4")],[row(24,"Dyna-6")]),false);
});

test("manufacturer transmission note is specific and available for all ten languages",()=>{
  const messages=new Set();
  const sourceTerms={en:/manufacturer source/,tr:/üretici kaynağını/,zh:/制造商来源/,hi:/निर्माता स्रोत/,"pt-br":/fonte do fabricante/,fr:/source du constructeur/,de:/Herstellerquelle/,ru:/источник производителя/,ja:/メーカー資料/,es:/fuente del fabricante/};
  for(const lang of LOCALES){
    const message=compareText(lang,"transmissionCaution");
    assert.ok(message.length>25,lang);
    assert.match(message,sourceTerms[lang],lang);
    messages.add(message);
  }
  assert.equal(messages.size,10);
  const component=readFileSync(new URL("../src/components/TractorComparison.astro",import.meta.url),"utf8");
  assert.match(component,/requiresTransmissionCaution\(row\.key,row\.left,row\.right\)/);
  assert.match(component,/requiresTransmissionCaution\(key,find\(left,key\),find\(right,key\)\)/);
  assert.match(component,/transmissionCaution: cx\(lang,"transmissionCaution"\)/);
  assert.match(component,/l10n\.transmissionCaution/);
  assert.match(component,/const visible=commonOnly\?shared:keys/);
  assert.match(component,/role="note"/);
});

test("offline Playwright cannot accidentally include production-only browser tests",()=>{
  const local=readFileSync(new URL("../playwright.config.mjs",import.meta.url),"utf8");
  const production=readFileSync(new URL("../playwright.live.config.mjs",import.meta.url),"utf8");
  const liveSuite=readFileSync(new URL("../e2e/tractorvs-live-compare.spec.mjs",import.meta.url),"utf8");
  assert.match(local,/testIgnore:\s*\["\*\*\/tractorvs-live-compare\.spec\.mjs"\]/);
  assert.match(local,/127\.0\.0\.1:4173/);
  assert.match(production,/testMatch:\s*"tractorvs-live-compare\.spec\.mjs"/);
  assert.match(production,/baseURL:\s*"https:\/\/tractorvs\.com"/);
  assert.doesNotMatch(production,/webServer\s*:/);
  assert.match(liveSuite,/comparison-data\/tr\//);
});


test("live comparison browser QA covers all nine non-Turkish locales with real interactions and SEO guards",()=>{
  const source=readFileSync(new URL("../e2e/tractorvs-live-compare.spec.mjs",import.meta.url),"utf8");
  const codes=[...source.matchAll(/\{code:"([a-z-]+)", html:/g)].map(match=>match[1]);
  assert.deepEqual([...codes].sort(),LOCALES.filter(lang=>lang!=="tr").sort(),
    "Every non-Turkish locale must have exactly one source-backed live browser scenario");
  for(const contract of [
    'toHaveAttribute("lang",language.html)',
    'link[rel="canonical"]',
    'hreflang',
    'l10n.transmissionCaution',
    'l10n.conditionCaution',
    'await chooseTractor(page,"left","T3035")',
    'await chooseTractor(page,"right","T3047")',
    'await page.locator("#tc-shared").click()',
    'await page.locator("#tc-swap").click()',
    'await page.reload(',
    'beforeSwap',
    'await sources()'
  ]) assert.ok(source.includes(contract),"Live nine-locale browser QA missing: "+contract);
  const workflow=readFileSync(new URL("../../.github/workflows/tractorvs-compare-live-browser-qa.yml",import.meta.url),"utf8");
  assert.match(workflow,/site\/e2e\/tractorvs-live-compare\.spec\.mjs/);
  assert.match(workflow,/npx playwright test --config site\/playwright\.live\.config\.mjs/);
  const config=readFileSync(new URL("../playwright.live.config.mjs",import.meta.url),"utf8");
  for(const engine of ["chromium","firefox","webkit","mobile-chromium"])
    assert.ok(config.includes('name:"'+engine+'"'),"Missing supported browser: "+engine);
});
