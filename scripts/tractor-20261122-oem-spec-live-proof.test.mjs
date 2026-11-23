import test from "node:test";
import assert from "node:assert/strict";
import {proveLiveManufacturerSpecs,models,locales} from "./tractor-20261122-oem-spec-live-proof.mjs";
import {oem20261122SpecLabel} from "../site/src/lib/oem-20261122-spec-labels.ts";
function mock({hideOne=false,badCanonical=false,noindex=false}={}){
 return async url=>{
  const model=models.find(m=>url.endsWith("/"+m.slug+"/"));
  const lang=url.includes("/pt-br/")?"pt-br":locales.find(l=>l!=="en"&&url.includes("/"+l+"/"))||"en";
  const identity=model?.slug||"missing";
  const all=model?.values||[];
  const safeValues=(hideOne&&lang==="en"&&identity===models[0].slug)?all.slice(1):all;
  const label=lang==="en"?"Manufacturer-quoted PTO power":oem20261122SpecLabel("Manufacturer-quoted PTO power",lang);
  const html='<html lang="'+(lang==="pt-br"?"pt-BR":lang==="zh"?"zh-Hans":lang)+'"><head><link rel="canonical" href="'+(badCanonical&&lang==="fr"?"https://tractorvs.com/fake/":url)+'">'+
   (noindex?'<meta name="robots" content="noindex">':'<meta name="robots" content="index,follow">')+'</head><body><main><h1>OEM Model</h1>'+
   safeValues.join(" ")+" "+(label||"")+"</main></body></html>";
  return {status:200,headers:{get:key=>key==="content-type"?"text/html; charset=utf-8":null},text:async()=>html};
 };
}
test("14 production page requests verify all five OEM models and 10 locale choices",async()=>{
 const r=await proveLiveManufacturerSpecs({fetchFn:mock()});
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.pages,14);
 assert.equal(r.models,5);
 assert.equal(r.checked_locales,10);
});
test("missing one source-backed value must fail, not silently pass",async()=>{
 const r=await proveLiveManufacturerSpecs({fetchFn:mock({hideOne:true})});
 assert.equal(r.ok,false);
 assert.match(r.errors.join("\n"),/missing value Multi-disc oil-immersed/);
});
test("a wrong canonical or noindex causes validation failure",async()=>{
 const r=await proveLiveManufacturerSpecs({fetchFn:mock({badCanonical:true,noindex:true})});
 assert.equal(r.ok,false);
 assert.match(r.errors.join("\n"),/wrong canonical/);
 assert.match(r.errors.join("\n"),/noindex/);
});
