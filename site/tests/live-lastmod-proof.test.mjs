import test from "node:test";
import assert from "node:assert/strict";
import {compareLiveDates,inspectLiveDates} from "../scripts/live-lastmod-proof.mjs";
const origin="https://tractorvs.com",sha="a".repeat(40),date="2026-11-25T12:00:00.000Z";
const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const paths=locales.flatMap(l=>{const p=l==="en"?"":"/"+l;return [p+"/tractors/",p+"/tractors/test-abcd1234/"];});
const files=["sitemap-0.xml","forum-sitemap.xml","image-sitemap.xml"].map(p=>origin+"/"+p);
const indexXml="<sitemapindex>"+files.map(x=>"<sitemap><loc>"+x+"</loc></sitemap>").join("")+"</sitemapindex>";
const dateMap={version:1,dates:{"/tractors/":date}};
const makeChildren=()=>new Map([[files[0],"<urlset>"+paths.map(p=>"<url><loc>"+origin+p+"</loc>"+(p==="/tractors/"?"<lastmod>"+date+"</lastmod>":"")+"</url>").join("")+"</urlset>"],[files[1],"<urlset></urlset>"],[files[2],"<urlset></urlset>"]]);
test("live XML date proof verifies every HTML route but never forum or image dates",()=>{
 const children=makeChildren(),proof=compareLiveDates({indexXml,children,dateMap});
 assert.equal(proof.verifiedPages,20);assert.equal(proof.datedPages,1);assert.deepEqual(proof.mismatches,[]);
 children.set(files[0],children.get(files[0]).replace(date,"2026-11-24T12:00:00.000Z"));
 assert.deepEqual(compareLiveDates({indexXml,children,dateMap}).mismatches,["/tractors/"]);
});
test("read-only release proof does not grade stale or changing deployment",async()=>{
 const children=makeChildren();
 let homes=0;const mock=({stale=false,changing=false}={})=>async(url,opts)=>{
  assert.equal(opts.redirect,"error");
  const p=new URL(url).pathname;
  if(p==="/"){homes++;const observed=stale||changing&&homes===2?"b".repeat(40):sha;return new Response('<meta name="tractorvs-release-sha" content="'+observed+'">',{headers:{"Content-Type":"text/html"}});}
  return new Response(p==="/sitemap-index.xml"?indexXml:children.get(url),{headers:{"Content-Type":"application/xml"}});
 };
 const good=await inspectLiveDates({target:sha,dateMap,fetchFn:mock()});assert.equal(good.status,"verified");assert.equal(good.verifiedPages,20);
 homes=0;const stale=await inspectLiveDates({target:sha,dateMap,fetchFn:mock({stale:true})});assert.equal(stale.status,"deployment_pending");assert.equal(stale.verifiedPages,0);assert.equal(homes,1);
 homes=0;const change=await inspectLiveDates({target:sha,dateMap,fetchFn:mock({changing:true})});assert.equal(change.status,"deployment_changed");assert.equal(change.verifiedPages,0);
});
