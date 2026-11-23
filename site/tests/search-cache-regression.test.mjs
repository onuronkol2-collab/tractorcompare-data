import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {findTractorSuggestions} from "../src/lib/search.ts";

const item=(brand,model,variant=null)=>({
 brand,model,variant,year:null,horsepower:null,specs:0,
 url:"/tractors/"+brand.toLowerCase().replace(/\\s/g,"-")+"/"
});

test("cached autocomplete retains original ranking, accents and multiword matching",()=>{
 const models=[item("Belarus","82.1","D-243"),item("Belarus","80.1","D-243"),
   item("Başak Traktör","2075 BK"),item("McCormick","X5.100","Stage V")];
 for(let round=0;round<12;round++){
  assert.deepEqual(findTractorSuggestions(models,"Belarus").map(x=>x.model),["80.1","82.1"]);
  assert.equal(findTractorSuggestions(models,"Basak 2075")[0]?.model,"2075 BK");
  assert.equal(findTractorSuggestions(models,"x5.100")[0]?.brand,"McCormick");
  assert.deepEqual(findTractorSuggestions(models,"not-found"),[]);
 }
 assert.equal(models[0].model,"82.1","original records cannot be normalized in-place");
});

test("cache invalidates edited brand, model and variant without stale suggestions",()=>{
 const record=item("Başak","2075","BK");
 const models=[record];
 assert.equal(findTractorSuggestions(models,"Basak 2075").length,1);
 record.model="5120";
 assert.equal(findTractorSuggestions(models,"Basak 2075").length,0);
 assert.equal(findTractorSuggestions(models,"Basak 5120").length,1);
 record.variant="Turbo";
 assert.equal(findTractorSuggestions(models,"BK").length,0);
 assert.equal(findTractorSuggestions(models,"turbo 5120").length,1);
 record.brand="Tümosan";
 assert.equal(findTractorSuggestions(models,"Basak 5120").length,0);
 assert.equal(findTractorSuggestions(models,"Tumosan 5120").length,1);
});

test("independent objects with identical text never leak data or sort incorrectly",()=>{
 const a=item("Kubota","M5-112","A"),b=item("Kubota","M5-112","B");
 const m=[a,b];
 assert.equal(findTractorSuggestions(m,"kubota m5",1).length,1);
 assert.deepEqual(findTractorSuggestions(m,"m5").map(x=>x.variant),["A","B"]);
 assert.deepEqual(findTractorSuggestions([a],"B"),[]);
 assert.deepEqual(findTractorSuggestions([b],"B"),[b]);
});

test("homepage index caches public normalized strings only and never stores visitors' searches",()=>{
 const src=readFileSync(new URL("../src/lib/search.ts",import.meta.url),"utf8");
 assert.match(src,/new WeakMap<TractorSuggestion, IndexedSuggestion>\(\)/);
 assert.match(src,/cached\.rawBrand === item\.brand/);
 assert.match(src,/cached\.rawModel === item\.model/);
 assert.match(src,/cached\.rawVariant === item\.variant/);
 assert.match(src,/const \{brand, model, fullName, target\} = indexedSuggestion\(item\)/);
 assert.doesNotMatch(src,/localStorage|sessionStorage|fetch\(|sendBeacon|document\.cookie/);
});
