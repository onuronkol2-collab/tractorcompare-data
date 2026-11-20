import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,unlinkSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {safePublishedModelFloor,verifyPublishedSiteInventory,PUBLIC_LOCALES} from "../scripts/verify-published-site-inventory.mjs";

const snapshot={
 source:"anon_public_view",published_models:2,public_rows:6,fingerprint:"a".repeat(64)
};
function put(root,path,content){
 const full=join(root,path);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,content);
}
function fixture(){
 const root=mkdtempSync(join(tmpdir(),"tractorvs-release-"));
 put(root,"src/data/public-catalog-sync.json",JSON.stringify(snapshot));
 const urls=[];
 for(const locale of PUBLIC_LOCALES){
  const prefix=locale==="en"?"":locale+"/";
  put(root,"dist/"+prefix+"index.html",'<html><head><meta name="robots" content="index,follow"></head></html>');
  for(const slug of ["tractor-a","tractor-b"]){
   const url="https://tractorvs.com/"+prefix+"tractors/"+slug+"/";
   urls.push("<loc>"+url+"</loc>");
   put(root,"dist/"+prefix+"tractors/"+slug+"/index.html",
    '<html><head><link rel="canonical" href="'+url+'"></head><body>'+slug+"</body></html>");
  }
 }
 put(root,"dist/sitemap-0.xml","<urlset>"+urls.join("")+"</urlset>");
 put(root,"dist/image-sitemap.xml","<urlset></urlset>");
 return root;
}
test("baseline guards against mass model disappearance without requiring exact historical count",()=>{
 assert.equal(safePublishedModelFloor({...snapshot,published_models:172,public_rows:5273}),164);
 assert.equal(safePublishedModelFloor({...snapshot,published_models:172,public_rows:5273},180),180);
 assert.throws(()=>safePublishedModelFloor({...snapshot,fingerprint:"bad"}),/TractorVS RELEASE BLOCKED/);
 assert.throws(()=>safePublishedModelFloor(snapshot,0),/TractorVS RELEASE BLOCKED/);
});
test("all 10 locales, canonical sample URLs and sitemap agree before publishing",()=>{
 const root=fixture();
 try{
  const result=verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1});
  assert.equal(result.models,2);
  assert.equal(Object.keys(result.localeModels).length,10);
  assert.equal(result.protectedFloor,2);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test("a vanished localized page or sitemap model URL aborts deployment",()=>{
 const root=fixture();
 try{
  unlinkSync(join(root,"dist/tr/tractors/tractor-a/index.html"));
  assert.throws(()=>verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1}),
    /TractorVS RELEASE BLOCKED/);
  put(root,"dist/tr/tractors/tractor-a/index.html",
    '<link rel="canonical" href="https://tractorvs.com/tr/tractors/tractor-a/">');
  const xml="<urlset>"+PUBLIC_LOCALES.flatMap(locale=>{
   const prefix=locale==="en"?"":locale+"/";
   return ["tractor-a","tractor-b"].filter(slug=>!(locale==="zh"&&slug==="tractor-b"))
    .map(slug=>"<loc>https://tractorvs.com/"+prefix+"tractors/"+slug+"/</loc>");
  }).join("")+"</urlset>";
  put(root,"dist/sitemap-0.xml",xml);
  assert.throws(()=>verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1}),
    /TractorVS RELEASE BLOCKED/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
