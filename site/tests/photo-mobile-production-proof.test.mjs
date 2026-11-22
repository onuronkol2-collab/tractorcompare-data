import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {inspectLivePhotoMarkup,verifyLiveMobilePhotos,LIVE_ORIGIN,LIVE_PHOTO_PAGES} from "../scripts/verify-mobile-production-assets.mjs";

function fixture({path,fileId,photographer},extra=""){
 return '<html><head><link rel="canonical" href="'+LIVE_ORIGIN+path+'">'+
   '<meta name="robots" content="index,follow"></head><body><picture>'+
   '<source type="image/webp" srcset="/images/tractors/'+fileId+'-720.webp 720w">'+
   '<img alt="Tractor photo" srcset="/images/tractors/'+fileId+'-720.jpg 720w">'+
   '</picture><button data-photo-url="/images/tractors/'+fileId+'-1920.jpg">Open</button>'+
   '<a href="https://creativecommons.org/licenses/by-sa/4.0/">'+photographer+
   '</a>'+extra+'</body></html>';
}
test("real-live SEO and attribution markers must all survive the selected photo",()=>{
 assert.equal(LIVE_PHOTO_PAGES.length,2);
 for(const record of LIVE_PHOTO_PAGES){
  assert.equal(inspectLivePhotoMarkup(fixture(record),record).ok,true);
  for(const altered of [
    fixture(record).replace('rel="canonical"','rel="alternate"'),
    fixture(record).replace(record.fileId+"-720.webp","unknown-720.webp"),
    fixture(record).replace(record.fileId+"-720.jpg","unknown-720.jpg"),
    fixture(record).replace(record.fileId+"-1920.jpg","unknown-1920.jpg"),
    fixture(record).replace(record.photographer,"Unknown creator"),
    fixture(record).replace("creativecommons.org/licenses/by-sa/4.0/",
      "example.org/unknown-license"),
    fixture(record).replace("image/webp","image/jpeg"),
    fixture(record,'<meta name="robots" content="noindex">'),
  ]){
    assert.equal(inspectLivePhotoMarkup(altered,record).ok,false,
      "Missing evidence must fail the real-site check");
  }
 }
});
test("read-only production proof compares bytes, MIME and page rights, no upload/write",async()=>{
 const candidates=JSON.parse(readFileSync(new URL("../docs/photo-mobile-720-artifact-evidence.json",import.meta.url))).records;
 const calls=[];
 const fake=async(url,options)=>{
  calls.push({url,method:options.method||"GET"});
  const path=new URL(url).pathname;
  const page=LIVE_PHOTO_PAGES.find(r=>r.path===path);
  if(page)return new Response(fixture(page),{status:200,headers:{"Content-Type":"text/html"}});
  const image=readFileSync(new URL("../public"+path,import.meta.url));
  return new Response(image,{status:200,headers:{"Content-Type":path.endsWith(".webp")?"image/webp":"image/jpeg"}});
 };
 const proof=await verifyLiveMobilePhotos({fetchFn:fake,attempts:1,sleep:async()=>{}});
 assert.equal(proof.imageAssets,6);
 assert.equal(proof.modelPages,2);
 assert.equal(proof.errors,0);
 assert.equal(calls.length,8);
 assert.ok(calls.every(x=>x.url.startsWith(LIVE_ORIGIN)&&x.method==="GET"));
 const fakeHtml=async(url)=>new Response("<html>no proof</html>",{status:200,headers:{"Content-Type":"text/html"}});
 await assert.rejects(verifyLiveMobilePhotos({fetchFn:fakeHtml,attempts:1,sleep:async()=>{}}),
   /MIME mismatch/);
 assert.equal(candidates.length,3);
});
