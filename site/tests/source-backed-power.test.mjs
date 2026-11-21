import test from "node:test";
import assert from "node:assert/strict";
import { sourceBackedHorsepower, publishedHorsepower } from "../src/lib/catalog.ts";

const supported = {
  canonical_key:"engine_power", spec_name:"Engine power", spec_value:"25.3",
  unit:"hp", source_url:"https://www.tym.world/en/products/tractors/series-1/t255",
  evidence_text:"TYM technical model table shows 25.3 horsepower for the T1025.",
  verified_at:"2026-11-16T10:00:00Z"
};
test("recovers trustworthy missing summary engine horsepower only",()=>{
  assert.equal(sourceBackedHorsepower([supported]),25.3);
  assert.equal(sourceBackedHorsepower([{...supported,canonical_key:"engine_gross_power"}]),25.3);
  assert.equal(sourceBackedHorsepower([supported,{...supported,spec_value:"25.30"}]),25.3);
  assert.equal(sourceBackedHorsepower([{...supported,canonical_key:"",spec_name:"Rated engine power"}]),25.3);
});
test("rejects conflicting ratings and unverifiable sources",()=>{
  assert.equal(sourceBackedHorsepower([supported,{...supported,spec_value:"27"}]),null);
  assert.equal(sourceBackedHorsepower([{...supported,evidence_text:null}]),null);
  assert.equal(sourceBackedHorsepower([{...supported,verified_at:null}]),null);
  assert.equal(sourceBackedHorsepower([{...supported,source_url:"javascript:alert(1)"}]),null);
});
test("never presents PTO, kW, maximum boost power or unitless values as rated hp",()=>{
  for(const x of [
    {...supported,canonical_key:"rear_pto_power"},
    {...supported,canonical_key:"engine_max_power_hp"},
    {...supported,unit:"kW"},
    {...supported,unit:null},
    {...supported,spec_value:"25-30"},
    {...supported,spec_value:"25.3 hp"},
  ]) assert.equal(sourceBackedHorsepower([x]),null);
});


test("published summaries never trust an unverified legacy horsepower header",()=>{
  assert.equal(publishedHorsepower({horsepower:235,specifications:[]}),null);
  assert.equal(publishedHorsepower({horsepower:235,specifications:[{...supported,spec_value:"230"}]}),230);
  assert.equal(publishedHorsepower({horsepower:175,specifications:[{...supported,spec_value:"170"}]}),170);
  assert.equal(publishedHorsepower({horsepower:75,specifications:[{...supported,evidence_text:null}]}),null);
  assert.equal(publishedHorsepower({horsepower:null,specifications:[supported]}),25.3);
  assert.equal(publishedHorsepower({horsepower:235,specifications:[
    {...supported,spec_value:"230"}, {...supported,spec_value:"235"}
  ]}),null);
});
