import test from "node:test";
import assert from "node:assert/strict";
import {findTractorSuggestions,normalizeTractorQuery} from "../src/lib/search.ts";

const model = (overrides={}) => ({brand:"Example",model:"M100",variant:"Cab; Stage V",market:"EU",engine:"Engine Alpha",year:2025,horsepower:100,specs:12,url:"/tractors/example/",...overrides});
test("autocomplete searches the same documented fields as the catalogue",()=>{
  const eu=model(), us=model({market:"US",engine:"Engine Beta",url:"/tractors/example-us/"});
  assert.deepEqual(findTractorSuggestions([eu,us],"M100 EU Alpha"),[eu]);
  assert.deepEqual(findTractorSuggestions([eu,us],"M100 US Beta"),[us]);
  assert.deepEqual(findTractorSuggestions([eu,us],"Stage V"),[eu,us]);
  assert.deepEqual(findTractorSuggestions([eu,us],"unrecorded engine"),[]);
});
test("market and engine updates invalidate the normalized suggestion index",()=>{
  const item=model();
  assert.deepEqual(findTractorSuggestions([item],"Alpha"),[item]);
  item.engine="Gamma"; item.market="Japan";
  assert.deepEqual(findTractorSuggestions([item],"Alpha"),[]);
  assert.deepEqual(findTractorSuggestions([item],"EU"),[]);
  assert.deepEqual(findTractorSuggestions([item],"Japan Gamma"),[item]);
});
test("exact names retain ranking priority over incidental engine matches",()=>{
  const exact=model({model:"Alpha"}), incidental=model({model:"Z100"});
  assert.equal(findTractorSuggestions([incidental,exact],"Alpha")[0],exact);
  assert.equal(findTractorSuggestions(Array.from({length:9},(_,i)=>model({model:"M"+i})),"Example",7).length,7);
});
test("absent optional fields do not create searchable placeholders",()=>{
  const item=model({market:null,engine:undefined});
  assert.deepEqual(findTractorSuggestions([item],"undefined"),[]);
  assert.deepEqual(findTractorSuggestions([item],"null"),[]);
});

test("bounded interactive ranking preserves stable full-sort results, even for ties",()=>{
  const items=Array.from({length:1000},(_,i)=>model({
    brand:i%3===0?"Alpha":"Example",model:"M"+(i%41),
    variant:i%2?"Cab":"Open",engine:"Engine Alpha",
    url:"/tractors/fixture-"+i+"/"
  }));
  for(const q of ["Alpha","Example","M10","Cab","Engine Alpha","M1"]){
    const all=findTractorSuggestions(items,q,items.length);
    for(const k of [1,6,7,16,32]){
      assert.deepEqual(findTractorSuggestions(items,q,k),all.slice(0,k),q+":"+k);
    }
  }
  const ties=Array.from({length:40},(_,i)=>model({url:"/tractors/tie-"+i+"/"}));
  assert.deepEqual(findTractorSuggestions(ties,"M100",7),ties.slice(0,7));
  assert.deepEqual(findTractorSuggestions(ties,"M100",0.5),[]);
});
test("Latin accent folding does not collapse Japanese voicing or Cyrillic breve",()=>{
  assert.equal(normalizeTractorQuery("Başak"),normalizeTractorQuery("Basak"));
  assert.notEqual(normalizeTractorQuery("バ"),normalizeTractorQuery("ハ"));
  assert.notEqual(normalizeTractorQuery("й"),normalizeTractorQuery("и"));
});
