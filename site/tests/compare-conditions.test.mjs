import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {requiresConditionCaution} from "../src/lib/compare-conditions.ts";
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
  for(const lang of LOCALES){
    const copy=compareText(lang,"conditionCaution");
    assert.equal(typeof copy,"string");
    assert.ok(copy.length>55,lang+" caution must explain source-context limitation");
    messages.add(copy);
  }
  assert.equal(messages.size,10);
  assert.match(compareText("tr","conditionCaution"),/kaynak/);
  assert.match(compareText("en","conditionCaution"),/source/);
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
