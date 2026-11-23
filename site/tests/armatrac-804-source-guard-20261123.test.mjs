import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const content=readFileSync(new URL("../../supabase/maintenance/20261123_armatrac_804_22_verified_specs.sql",import.meta.url),"utf8");
test("ArmaTrac 804 supplemental specs are scoped to exactly two published identities",()=>{
  assert.match(content,/619e4fd9-1155-4927-b488-4f55c95ee739/);
  assert.match(content,/362ad12b-7e89-4adf-83df-841b96b0362e/);
  assert.match(content,/t\.status='published'/);
  assert.match(content,/ArmaTrac/);
  assert.match(content,/created<>22/);
  assert.match(content,/existing>0/);
  assert.match(content,/pg_advisory_xact_lock/);
  assert.doesNotMatch(content,/\b(?:UPDATE|DELETE|TRUNCATE|ALTER|DROP)\s+(?:TABLE\s+)?(?:public\.)?(?:tractors|tractor_specs|data_sources|auth|storage)\b/i);
});
test("manufacturer collision facts are not inserted as new measurements",()=>{
  for(const forbidden of ["'engine_max_torque'","'engine_power'","'hydraulic_pressure'","'engine_displacement','Engine displacement','3.3'"])
    assert.equal(content.includes(forbidden),false,"Do not publish disputed ArmaTrac claim: "+forbidden);
  assert.match(content,/804cabinfruitgarden_1760621707\.pdf/);
  assert.match(content,/80248044fg_1514187919\.pdf/);
  assert.match(content,/right-hand/);
});
test("exact 22 source-backed keys have only safe known categories",()=>{
  const rows=[...content.matchAll(/\('(?:cab|rops)', '([a-z_]+)', '([^']+)',/g)];
  assert.equal(rows.length,44,"22 values are repeated once for overlap check and once for INSERT");
  const allowed=new Set(["engine_cylinders","engine_model","engine_displacement","transmission_type","transmission_gears",
    "pto_type","rear_lift_capacity","hydraulic_main_flow","wheelbase","overall_width","ground_clearance",
    "operating_weight","operating_weight_cab"]);
  for(const [_,key] of rows)assert.ok(allowed.has(key),"Unknown unlocalized canonical key "+key);
  assert.equal(new Set(rows.slice(0,22).map(x=>x[1]+":"+x[2])).size,22);
});
