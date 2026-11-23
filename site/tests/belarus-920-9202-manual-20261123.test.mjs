import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {publishedSpecificationLabel} from "../src/lib/published-spec-translations.ts";
import {specLabel} from "../src/lib/catalog.ts";

const sql=readFileSync(new URL("../../supabase/maintenance/20261123_belarus_920_9202_manual_20_specs.sql",import.meta.url),"utf8");
const start=sql.indexOf("-- MTZ_BELARUS_920_VALUES_BEGIN");
const end=sql.indexOf("-- MTZ_BELARUS_920_VALUES_END");
const block=sql.slice(start,end);
const entries=[...block.matchAll(/\('(920(?:\.2)?)', '([a-z_]+)', '([^']+)'/g)];
const names=[
"Standard front tyre size",
"Standard rear tyre size",
"Front drive axle reduction design",
"Hydraulic hitch architecture",
"PTO drive configuration (independent and synchronous)",
"PTO shaft spline specification",
"Hydraulic external outlet arrangement",
"Rear three-point linkage category",
"Service brake design (dry standard; oil-bath optional)",
"Manufacturer-stated engine power (test standard unspecified)"
];
test("Belarus review has exactly 20 independently scoped rows, no existing model changes",()=>{
  assert.ok(start>=0&&end>start);
  assert.equal(entries.length,20);
  const byModel=entries.map(x=>x[1]+":"+x[2]);
  assert.equal(new Set(byModel).size,20);
  assert.equal(byModel.filter(x=>x.startsWith("920:")).length,10);
  assert.equal(byModel.filter(x=>x.startsWith("920.2:")).length,10);
  assert.match(sql,/21e79b33-189b-44c1-a1e2-703ad8836d92/);
  assert.match(sql,/1e1d7219-8921-44fe-83a6-c88514c1224a/);
  assert.match(sql,/t.status='published'/);
  assert.match(sql,/inserted_count<>20/);
  assert.match(sql,/overlaps<>0/);
  assert.match(sql,/source_url='/);
  assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|TRUNCATE|ALTER|DROP)\s+(?:TABLE\s+)?(?:public\.)?(?:tractors|tractor_specs|data_sources)\b/i);
});
test("tyres, axle gearing, hydraulics and optional equipment are not conflated",()=>{
  assert.match(block,/Portal; sliding bevel-reduction housings/);
  assert.match(block,/non-sliding bar with planetary wheel reduction/);
  assert.match(block,/13\.6-20/);assert.match(block,/360\/70R24/);
  assert.match(block,/16\.9R38/);assert.match(block,/18\.4R34/);
  assert.match(block,/power cylinder/);assert.match(block,/two self-contained cylinders/);
  assert.match(block,/oil-bath optional/);
  assert.doesNotMatch(block,/'hydraulic_pressure'|'rear_lift_capacity'|'model_year'/);
  assert.doesNotMatch(block,/3200|3000|2081|2302/);
  assert.match(sql,/test protocol/);
});
test("ten languages provide native source-exact headings, model values are never translated",()=>{
  assert.equal(LOCALES.length,10);
  for(const name of names){
    for(const locale of LOCALES.filter(x=>x!=="en")){
      const translated=publishedSpecificationLabel(name,locale);
      assert.ok(translated&&translated.length>3,locale+" missing "+name);
      assert.notEqual(translated.toLowerCase(),name.toLowerCase(),locale+" remains English");
      const rendering=specLabel({canonical_key:"unused_manual_exact_heading",spec_name:name,spec_value:"360/70R24"},locale);
      assert.equal(rendering,translated,locale+" lost exact source label for "+name);
    }
  }
  const ru=publishedSpecificationLabel("PTO drive configuration (independent and synchronous)","ru");
  assert.match(ru,/ВОМ/);
  const tr=publishedSpecificationLabel("Service brake design (dry standard; oil-bath optional)","tr");
  assert.match(tr,/isteğe bağlı/);
});
