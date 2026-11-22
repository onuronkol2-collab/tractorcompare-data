import test from "node:test";
import assert from "node:assert/strict";
import {auditPilotHtml,BASE,SLUGS,PREFIXES} from "../scripts/verify-brand-discovery-pilot.mjs";

function fixture({slug="valtra",prefix="",n=12,badCanonical=false,
  extraLang=false,missingSource=false}={}){
  const path="/"+prefix+"brands/"+slug+"/";
  const prefixDetail="/"+prefix+"tractors/";
  return '<!doctype html><html><head>'
    +'<meta name="robots" content="index,follow,max-image-preview:large">'
    +'<link rel="canonical" href="'+BASE+(badCanonical?"/wrong/":path)+'">'
    +'<link rel="alternate" hreflang="en" href="'+BASE+"/brands/"+slug+'/">'
    +'<link rel="alternate" hreflang="tr" href="'+BASE+"/tr/brands/"+slug+'/">'
    +(extraLang?'<link rel="alternate" hreflang="de" href="'+BASE+"/de/brands/"+slug+'/">':"")
    +'</head><body>'
    +Array.from({length:n},(_,i)=>'<article class="brand-model"><h3><a href="'
      +prefixDetail+slug+"-"+i+'/">Model</a></h3>'
      +(!missingSource?'<div class="brand-model-links"><a href="https://example.org/" target="_blank" rel="noopener noreferrer">Evidence</a></div>':"")
      +'</article>').join("")
    +'</body></html>';
}

test("four expected bilingual pages, no unreviewed mass-language pages",()=>{
 assert.deepEqual(SLUGS,["mccormick","valtra"]);
 assert.deepEqual(PREFIXES,["","tr/"]);
});
test("real, crawlable, canonical published models and source links pass",()=>{
 for(const prefix of PREFIXES){
  const r=auditPilotHtml(fixture({prefix}),{slug:"valtra",prefix});
  assert.equal(r.passed,true);
  assert.equal(r.models,12);
  assert.equal(r.externalSources,12);
 }
});
test("missing models, wrong origin and untranslated hreflang fail closed",()=>{
 for(const options of [{n:9},{badCanonical:true},{extraLang:true},{missingSource:true}]){
  const r=auditPilotHtml(fixture(options),{slug:"valtra",prefix:""});
  assert.equal(r.passed,false,JSON.stringify(options));
 }
});
test("duplicate or wrong-language model links are never accepted",()=>{
 const good=fixture();
 const duplicated=good.replace('href="/tractors/valtra-1/"','href="/tractors/valtra-0/"');
 assert.equal(auditPilotHtml(duplicated,{slug:"valtra",prefix:""}).passed,false);
 const wrongLocale=good.replace('href="/tractors/valtra-0/"','href="/tr/tractors/valtra-0/"');
 assert.equal(auditPilotHtml(wrongLocale,{slug:"valtra",prefix:""}).passed,false);
});
