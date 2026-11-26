import {matchesExactOrigin} from "../../supabase/functions/_shared/evidence-text.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {releasedThirdWaveRights,verifyThirdWaveLive}
 from "../scripts/verify-third-wave-production.mjs";

const origin="https://tractorvs.com";
const sources=releasedThirdWaveRights();
const pages=new Map(sources.map((photo,i)=>
 ["/tr/tractors/third-wave-test-"+i+"/",photo]));
const sitemap='<?xml version="1.0"?><urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
 [...pages].map(([path,p])=>'<url><loc>'+origin+path+
 '</loc><image:image><image:loc>'+origin+p.fullUrl+
 '</image:loc></image:image></url>').join("")+'</urlset>';

function html(path,p){
 const url="/images/tractors/"+p.fileId;
 return '<html><head><link rel="canonical" href="'+origin+path+
 '"><meta name="robots" content="index,follow"></head><body>'+
 '<button data-photo-url="'+url+'-1920.jpg"><picture data-astro-cid="tracked-photo">'+
 '<source type="image/webp" srcset="'+url+'-720.webp 720w">'+
 '<img srcset="'+url+'-720.jpg 720w, '+url+'-960.jpg 960w">'+
 '</picture></button><a href="'+p.sourcePage+'">'+p.photographer+
 '</a><a href="'+p.licenseUrl+'">Creative Commons license</a></body></html>';
}
function makeFetch({wrongMime=false,corruptSha=false,badCredit=false,heldLeak=false}={}){
 let requests=0;
 const fetchFn=async(url,options)=>{
  requests++;
  assert.ok(matchesExactOrigin(url,origin));
  assert.equal(options.redirect,"error");
  const path=new URL(url).pathname;
  if(path==="/image-sitemap.xml")return new Response(sitemap,{status:200,
   headers:{"Content-Type":"application/xml"}});
  if(pages.has(path)){
   const p=pages.get(path);
   const body=html(path,p);
   return new Response(badCredit?body.replace(p.photographer,"unverified"):body,
    {status:200,headers:{"Content-Type":"text/html"}});
  }
  if(path.includes("-720.")&&sources.every(x=>!path.includes(x.fileId))){
   return new Response(heldLeak?"LEAK":"Not Found",{status:heldLeak?200:404});
  }
  const bytes=readFileSync(new URL("../public"+path,import.meta.url));
  const mime=path.endsWith(".webp")?"image/webp":"image/jpeg";
  return new Response(corruptSha?Buffer.from("wrong bytes"):bytes,
   {status:200,headers:{"Content-Type":wrongMime?"text/html":mime}});
 };
 return {fetchFn,getRequests:()=>requests};
}
test("twelve third-wave rights sources are distinct already-licensed originals",()=>{
 assert.equal(sources.length,12);
 assert.equal(new Set(sources.map(p=>p.fileId)).size,12);
 for(const x of sources){
  assert.ok(x.photographer?.trim());
  assert.match(x.licenseName,/^CC BY-SA (3\.0|4\.0)$/);
  const source=new URL(x.sourcePage);
  assert.ok(matchesExactOrigin(source,"https://commons.wikimedia.org"));
  assert.ok(source.pathname.startsWith("/wiki/File:"));
  assert.equal(x.configurationExact,false);
 }
});
test("production proof requires 24 genuine byte-perfect assets, twelve canonical CC model pages and six nonpublic 404s",async()=>{
 const fake=makeFetch();
 const r=await verifyThirdWaveLive({fetchFn:fake.fetchFn,attempts:1,sleep:async()=>{}});
 assert.equal(r.uniquePhotos,12);
 assert.equal(r.verifiedAssets,24);
 assert.equal(r.publicModelPages,12);
 assert.equal(r.held404,6);
 assert.equal(r.failed,0);
 assert.equal(fake.getRequests(),43);
});
test("unverified domain, wrong MIME, mismatched bytes, absent photographer and held photo leaks fail",async()=>{
 await assert.rejects(verifyThirdWaveLive({origin:"https://evil.example",
  attempts:1}),/exact https/);
 for(const [change,expected] of [
  [{wrongMime:true},/MIME mismatch/],
  [{corruptSha:true},/size\/SHA mismatch/],
  [{badCredit:true},/SEO\/rights regression/],
  [{heldLeak:true},/Unpublished photo unexpectedly visible/]
 ]){
  await assert.rejects(verifyThirdWaveLive({
   fetchFn:makeFetch(change).fetchFn,attempts:1,sleep:async()=>{}
  }),expected);
 }
});
