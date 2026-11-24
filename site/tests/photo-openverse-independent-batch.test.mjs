import test from "node:test";
import assert from "node:assert/strict";
import {MAX_REQUESTS,key,selectPublishedMissing,classifyOpenverseResult,researchIndependentSources} from "../scripts/photo-openverse-independent-batch.mjs";

const pub=(brand,model,id)=>({brand,model,status:"published",tractor_id:id,pageUrl:"https://tractorvs.com/tractors/"+id+"/"});
const valid=(title="McCormick X5.085 tractor",source="flickr",license="by-sa",licenseUrl="https://creativecommons.org/licenses/by-sa/4.0/")=>({
 source,title,license,license_url:licenseUrl,foreign_landing_url:"https://www.flickr.com/photos/creator/tractor123",creator:"Original Creator"
});
const fixtures=[
 pub("McCormick","X5.085","m1"),
 pub("Sonalika","DI 30 Baagban","s1"),
 pub("McCormick","X5.085","m2"),
 pub("Zetor","PROXIMA","z1"),
];

test("published-only and exact approved identities dedupe; incomplete or draft inventory fails closed",()=>{
 const sel=selectPublishedMissing(fixtures,[{brand:"Zetor",model:"PROXIMA"}],{index:0,limit:12});
 assert.equal(sel.missing,2);
 assert.equal(sel.missingPublishedRecords,3,"Duplicate model name must retain two distinct published IDs");
 assert.deepEqual(sel.selected,[{brand:"McCormick",model:"X5.085",missingTractorIds:["m1","m2"]},{brand:"Sonalika",model:"DI 30 Baagban",missingTractorIds:["s1"]}]);
 assert.equal(key({brand:"McCormick",model:"X5.085"}),key({brand:"McCormick",model:"X5 085"}));
 assert.throws(()=>selectPublishedMissing([...fixtures,{...fixtures[0],status:"draft"}],[]),/non-public/);
 assert.throws(()=>selectPublishedMissing([{...fixtures[0],pageUrl:null}],[]),/incomplete|non-public/i);
 assert.throws(()=>selectPublishedMissing(fixtures,[],{limit:MAX_REQUESTS+1}),/Unsafe/);
 assert.deepEqual(selectPublishedMissing(fixtures,[{brand:"McCormick",model:"X5.085"},{brand:"Sonalika",model:"DI 30 Baagban"},{brand:"Zetor",model:"PROXIMA"}]),{missing:0,missingPublishedRecords:0,selected:[],offset:0});
});
test("independent provider candidate is an unapproved research lead, never an automatic photo",()=>{
 const result=classifyOpenverseResult(valid(),"McCormick","X5.085");
 assert.ok(result);
 assert.equal(result.source,"flickr");
 assert.equal(result.allowed_to_publish,false);
 assert.equal(result.exact_visual_model_identity_verified,false);
 assert.equal(result.original_author_rights_verified,false);
 assert.equal(result.review_status,"external_provider_review_needed");
 assert.equal(classifyOpenverseResult(valid("Something totally different"),"McCormick","X5.085"),null);
 assert.equal(classifyOpenverseResult({...valid(),source:"wikimedia"},"McCormick","X5.085"),null);
 assert.equal(classifyOpenverseResult(valid("McCormick X5.085 tractor","europeana","by","https://creativecommons.org/licenses/by/4.0/"),"McCormick","X5.085").source,"europeana");
});
test("reject NC ND and label/URL mismatch, offsite license and unsafe source links",()=>{
 const tests=[
  valid("McCormick X5.085","flickr","by-nc","https://creativecommons.org/licenses/by-nc/4.0/"),
  valid("McCormick X5.085","flickr","by-nd","https://creativecommons.org/licenses/by-nd/4.0/"),
  valid("McCormick X5.085","flickr","by","https://creativecommons.org/licenses/by-sa/4.0/"),
  valid("McCormick X5.085","flickr","by","https://attacker.example/by/4.0/"),
  {...valid(),foreign_landing_url:"http://images.example.com/sample"},
  {...valid(),foreign_landing_url:"https://user:pw@flickr.com/abc"},
  {...valid(),license_url:"https://creativecommons.org/licenses/by-nc/4.0/"},
  {...valid(),license_url:"https://creativecommons.org/licenses/by/5.0/"},
 ];
 for(const x of tests)assert.equal(classifyOpenverseResult(x,"McCormick","X5.085"),null,JSON.stringify(x));
});
test("12 max provider search rotates missing identities, keeps bounded leads and refuses external auto-publication",async()=>{
 const seen=[];
 const delay=[];
 const fake=async (url,opts)=>{
  const u=new URL(url);
  seen.push(u);
  assert.equal(u.origin,"https://api.openverse.org");
  assert.equal(u.searchParams.get("source"),"flickr,europeana");
  assert.equal(u.searchParams.get("license"),"by,by-sa,cc0");
  assert.equal(opts.headers.Accept,"application/json");
  const q=u.searchParams.get("q");
  const r=q.includes("McCormick")?valid():{...valid("Sonalika DI 30 Baagban tractor","europeana","cc0","https://creativecommons.org/publicdomain/zero/1.0/"),foreign_landing_url:"https://www.europeana.eu/en/item/01234"};
  return {status:200,headers:{get:()=> "application/json; charset=utf-8"},json:async()=>({results:[r,r,r,r,r,r,r,r]})};
 };
 const report=await researchIndependentSources(fixtures,{approved:[{brand:"Zetor",model:"PROXIMA"}],fetchFn:fake,index:0,limit:MAX_REQUESTS,delayFn:async ms=>delay.push(ms)});
 assert.equal(report.status,"complete");
 assert.equal(report.missing_unique_pairs,2);
 assert.equal(report.missing_published_variant_records,3);
 assert.equal(report.queries_sent,2);
 assert.equal(seen.length,2);
 assert.equal(report.candidates.length,2,"Repeated landing URLs count only once per model");
 assert.ok(seen.every(u=>u.searchParams.get("page_size")==="20"));
 assert.ok(report.candidates.every(x=>x.allowed_to_publish===false));
 assert.equal(delay.length,2);
});
test("429 stops immediately and does not claim complete research",async()=>{
 let n=0;
 const report=await researchIndependentSources(fixtures,{approved:[],index:0,limit:MAX_REQUESTS,
  fetchFn:async()=>{n++;return {status:429,headers:{get:()=>null}}},delayFn:async()=>{}});
 assert.equal(n,1);
 assert.equal(report.status,"rate_limited");
 assert.equal(report.rate_limited,true);
 assert.equal(report.queries_sent,1);
 assert.equal(report.candidates.length,0);
});
test("HTTP/JSON source failure stays partial rather than treating missing results as empty",async()=>{
 const report=await researchIndependentSources([fixtures[0]],{approved:[],fetchFn:async()=>({status:200,headers:{get:()=> "text/html"},json:async()=>({results:[]})}),delayFn:async()=>{}});
 assert.equal(report.status,"partial");
 assert.equal(report.models[0].status,"error");
});


test("one approved variant cannot hide another published variant with the same model name",()=>{
 const published=[
   {...pub("TYM","T3048","f50"),variant:"F50 / Series 3"},
   {...pub("TYM","T3048","f50cn"),variant:"F50CN / cab"},
   {...pub("TYM","T3048","f50chn"),variant:"F50CHN / 3-range HST"},
 ];
 const selected=selectPublishedMissing(published,[
   {brand:"TYM",model:"T3048",tractorId:"f50chn"}
 ],{limit:MAX_REQUESTS});
 assert.equal(selected.missing,1,"One brand/model API query is still sufficient");
 assert.equal(selected.missingPublishedRecords,2);
 assert.deepEqual(selected.selected,[{brand:"TYM",model:"T3048",missingTractorIds:["f50","f50cn"]}]);
 const familyPhoto=selectPublishedMissing(published,[{brand:"TYM",model:"T3048"}]);
 assert.deepEqual(familyPhoto,{missing:0,missingPublishedRecords:0,selected:[],offset:0},
   "Legacy model-family photos remain representative for already-rendered model pages");
 const fullyCovered=selectPublishedMissing(published,published.map(r=>({
   brand:r.brand,model:r.model,tractorId:r.tractor_id,
 })));
 assert.equal(fullyCovered.missing,0);
 assert.equal(fullyCovered.missingPublishedRecords,0);
 assert.throws(()=>selectPublishedMissing([...published,{
   ...published[0],model:"T754",tractor_id:"f50",
 }],[]),/reused by different model/);
});

test("read-only Openverse research never offers an already-photo-covered variant for publication",async()=>{
 const published=[
   {...pub("TYM","T3048","f50"),variant:"F50"},
   {...pub("TYM","T3048","f50chn"),variant:"F50CHN"},
 ];
 let apiCalls=0;
 const report=await researchIndependentSources(published,{
   approved:[{brand:"TYM",model:"T3048",tractorId:"f50chn"}],
   index:0,limit:MAX_REQUESTS,
   fetchFn:async()=>{apiCalls++;return {
     status:200,headers:{get:()=> "application/json"},
     json:async()=>({results:[{
       ...valid("TYM T3048 tractor"),
       source:"flickr",
     }]})
   };},delayFn:async()=>{},
 });
 assert.equal(apiCalls,1);
 assert.equal(report.queries_sent,1);
 assert.equal(report.missing_unique_pairs,1);
 assert.equal(report.missing_published_variant_records,1);
 assert.deepEqual(report.models[0].missingTractorIds,["f50"]);
 assert.ok(report.candidates.every(x=>x.allowed_to_publish===false));
 assert.ok(report.candidates.every(x=>x.exact_visual_model_identity_verified===false));
});


test("full title token boundaries and tag evidence expand discovery without auto-approval",()=>{
 const separated=classifyOpenverseResult(valid("McCormick tractor at a show, X5.085"),"McCormick","X5.085");
 assert.equal(separated.metadata_match,"title");
 assert.equal(classifyOpenverseResult(valid("McCormick X5.0850"),"McCormick","X5.085"),null);
 const tagged=classifyOpenverseResult({...valid("Agricultural exhibition"),tags:[{name:"Sonalika"},{name:"DI 30 Baagban"}]},"Sonalika","DI 30 Baagban");
 assert.equal(tagged.metadata_match,"tags");assert.equal(tagged.allowed_to_publish,false);
 assert.ok(classifyOpenverseResult(valid("TYM T475 tractor"),"TYM","T3047"));
});
test("approved exact identity and explicit illustrative aliases use the same match as public pages",()=>{
 const published=[pub("TYM","T3048","a"),pub("TYM","T3048","b")];
 const approved=[{brand:"TYM",model:"T3048",tractorId:"a"},{brand:"TYM",model:"F50",tractorId:"other",illustrativeOn:[{tractorId:"b",model:"T3048"}]}];
 assert.equal(selectPublishedMissing(published,approved).missingPublishedRecords,0);
 assert.equal(selectPublishedMissing(published,[{brand:"Wrong",model:"T3048",tractorId:"a"}]).missingPublishedRecords,2);
});
test("valid lead beyond initial seven is discovered in the same request",async()=>{
 const report=await researchIndependentSources([fixtures[0]],{approved:[],fetchFn:async()=>({status:200,headers:{get:()=>"application/json"},json:async()=>({results:[...Array(10).fill(valid("Other tractor")),valid("McCormick X5.085")]})}),delayFn:async()=>{}});
 assert.equal(report.queries_sent,1);assert.equal(report.candidates.length,1);
});
