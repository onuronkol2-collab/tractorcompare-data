import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {expectedLiveBatch15,findPublicModelPages,checkLiveModelPage,
  proveBatch15Live,LIVE_ORIGIN} from "../scripts/verify-photo-batch15-production.mjs";

const {files,records,held}=expectedLiveBatch15();
const pageMap=new Map(records.map(x=>[x.fileId,"/tr/tractors/"+x.fileId+"/"]));
const xml='<?xml version="1.0"?><urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
 records.map(record=>'<url><loc>'+LIVE_ORIGIN+pageMap.get(record.fileId)+
   '</loc><image:image><image:loc>'+LIVE_ORIGIN+
   '/images/tractors/'+record.fileId+'-1920.jpg</image:loc></image:image></url>').join('')+
 '</urlset>';
function mockPage(record){
 const path=pageMap.get(record.fileId);
 return '<!doctype html><html><head><link rel="canonical" href="'+LIVE_ORIGIN+
 path+'"><meta name="robots" content="index,follow"></head><body>'+
 '<picture><source type="image/webp" srcset="/images/tractors/'+record.fileId+
 '-720.webp 720w"><img srcset="/images/tractors/'+record.fileId+
 '-720.jpg 720w"></picture><button data-photo-url="/images/tractors/'+
 record.fileId+'-1920.jpg">Zoom</button><a href="'+record.licenseUrl+
 '">'+record.photographer+'</a></body></html>';
}
test("all 15 real public model page URLs map only the original 1920 license-approved photo",()=>{
 assert.equal(files.length,30);
 assert.equal(records.length,15);
 assert.equal(held.length,3);
 const map=findPublicModelPages(xml);
 assert.equal(map.size,15);
 for(const record of records){
   assert.equal(map.get(record.fileId),pageMap.get(record.fileId));
   assert.deepEqual(checkLiveModelPage(mockPage(record),record,pageMap.get(record.fileId)),
     {ok:true,errors:[]});
   const bad=mockPage(record).replace(record.photographer,"Unknown");
   assert.equal(checkLiveModelPage(bad,record,pageMap.get(record.fileId)).ok,false);
 }
 assert.throws(()=>findPublicModelPages(xml.replace(records[0].fileId+"-1920.jpg",
   "some-other-file-1920.jpg")),/missing/);
 assert.throws(()=>findPublicModelPages("<html>not a sitemap</html>"),/malformed/);
});

test("real production verifier rejects counterfeit 200 MIME/hash, missing rights and nonpublic 720",async()=>{
 let count=0;
 const respond=async(url,opts)=>{
   count++;
   assert.ok(url.startsWith(LIVE_ORIGIN));
   assert.equal(opts.redirect,"error");
   const parsed=new URL(url),path=parsed.pathname;
   if(path==="/image-sitemap.xml")
     return new Response(xml,{status:200,headers:{"Content-Type":"application/xml"}});
   const page=records.find(x=>pageMap.get(x.fileId)===path);
   if(page)return new Response(mockPage(page),{status:200,
     headers:{"Content-Type":"text/html; charset=utf-8"}});
   if(held.some(id=>path.includes(id+"-720.")))return new Response("No published photo",{status:404});
   const bytes=readFileSync(new URL("../public"+path,import.meta.url));
   return new Response(bytes,{status:200,headers:{"Content-Type":
     path.endsWith(".jpg")?"image/jpeg":"image/webp"}});
 };
 const result=await proveBatch15Live({fetchFn:respond,maxFirstAttempts:1,pause:async()=>{}});
 assert.deepEqual({images:result.images,modelPages:result.publicModelPages,held404:result.held404,
   failed:result.failed},{images:30,modelPages:15,held404:6,failed:0});
 assert.equal(count,52);
 await assert.rejects(proveBatch15Live({fetchFn:respond,
   origin:"https://evil.example",maxFirstAttempts:1,pause:async()=>{}}),
   /canonical HTTPS origin/);
 await assert.rejects(proveBatch15Live({fetchFn:async()=>new Response(
   "<html>200 but bogus</html>",{status:200,headers:{"Content-Type":"text/html"}}),
   maxFirstAttempts:1,pause:async()=>{}}),/MIME mismatch/);
});
