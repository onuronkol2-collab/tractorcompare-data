import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,unlinkSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {safePublishedModelFloor,verifyPublishedSiteInventory,PUBLIC_LOCALES,PUBLIC_LOCALE_TAGS,inspectLocaleAnnotations,verifyModelDiscoveryMarkup} from "../scripts/verify-published-site-inventory.mjs";

const snapshot={
 source:"anon_public_view",published_models:2,public_rows:6,fingerprint:"a".repeat(64)
};
function put(root,path,content){
 const full=join(root,path);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,content);
}
function modelHtml(locale,slug){
 const prefix=locale==="en"?"":locale+"/";
 const url="https://tractorvs.com/"+prefix+"tractors/"+slug+"/";
 const alternatives=Object.entries(PUBLIC_LOCALE_TAGS).map(([alternate,tag])=>{
  const alternatePrefix=alternate==="en"?"":alternate+"/";
  return '<link rel="alternate" hreflang="'+tag+'" href="https://tractorvs.com/'+
   alternatePrefix+'tractors/'+slug+'/">';
 }).join("");
 return '<html><head><meta name="robots" content="index,follow,max-image-preview:large">'+
  '<link rel="canonical" href="'+url+'">'+alternatives+
  '<link rel="alternate" hreflang="x-default" href="https://tractorvs.com/tractors/'+
  slug+'/"></head><body>'+slug+'</body></html>';
}
function fixture(){
 const root=mkdtempSync(join(tmpdir(),"tractorvs-release-"));
 put(root,"src/data/public-catalog-sync.json",JSON.stringify(snapshot));
 const urls=[];
 for(const locale of PUBLIC_LOCALES){
  const prefix=locale==="en"?"":locale+"/";
  urls.push("<loc>https://tractorvs.com/"+prefix+"tractors/</loc>");
  put(root,"dist/"+prefix+"index.html",'<html><head><meta name="robots" content="index,follow"></head></html>');
  const catalogue=["tractor-a","tractor-b"].map(slug=>
   '<article><a class="tractor-card-main" href="/'+prefix+'tractors/'+slug+'/">'+slug+'</a></article>'
  ).join("");
  put(root,"dist/"+prefix+"tractors/index.html",'<html><body>'+catalogue+'</body></html>');
  for(const slug of ["tractor-a","tractor-b"]){
   const url="https://tractorvs.com/"+prefix+"tractors/"+slug+"/";
   urls.push("<loc>"+url+"</loc>");
   put(root,"dist/"+prefix+"tractors/"+slug+"/index.html",modelHtml(locale,slug));
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
  put(root,"dist/tr/tractors/tractor-a/index.html",modelHtml("tr","tractor-a"));
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

test("published inventory rejects a missing catalogue link or reciprocal hreflang",()=>{
 const root=fixture();
 try{
  const path="dist/tr/tractors/index.html";
  put(root,path,'<a class="tractor-card-main" href="/tr/tractors/tractor-a/">A</a>');
  assert.throws(()=>verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1}),
   /Missing server-rendered catalogue link/);
  put(root,path,["tractor-a","tractor-b"].map(slug=>
   '<a class="tractor-card-main" href="/tr/tractors/'+slug+'/">'+slug+'</a>'
  ).join(""));
  const broken=modelHtml("tr","tractor-a").replace(
   'hreflang="de" href="https://tractorvs.com/de/tractors/tractor-a/"',""
  );
  put(root,"dist/tr/tractors/tractor-a/index.html",broken);
  assert.throws(()=>verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1}),
   /Missing reciprocal hreflang de/);
 }finally{rmSync(root,{recursive:true,force:true});}
});


test("locale audit catches duplicate case-insensitive hreflang and conflicting canonical annotations",()=>{
 const links=[
  '<link rel="canonical" href="https://tractorvs.com/tractors/a/">',
  '<link rel="alternate" hreflang="pt-BR" href="https://tractorvs.com/pt-br/tractors/a/">',
  '<link rel="alternate" hreflang="PT-br" href="https://tractorvs.com/pt-br/tractors/b/">',
  '<link rel="alternate" hreflang="de" href="https://tractorvs.com/de/tractors/a/" media="screen">',
  '<link rel="alternate" hreflang="xx" href="https://tractorvs.com/xx/tractors/a/">',
  '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
 ];
 const result=inspectLocaleAnnotations(links);
 assert.equal(result.canonical.length,1);
 assert.deepEqual(result.errors,["Duplicate hreflang pt-br","Mixed hreflang representation de","Unexpected hreflang xx"]);
 assert.equal(inspectLocaleAnnotations([links[0],links[1],links[5]]).errors.length,0);
});

test("published model head rejects conflicting or hidden annotations instead of matching HTML substrings",()=>{
 const html=modelHtml("tr","tractor-a");
 const options={slug:"tractor-a",locale:"tr",catalogLinks:new Set(["/tr/tractors/tractor-a/"])};
 const add=link=>html.replace("</head>",link+"</head>");
 assert.equal(verifyModelDiscoveryMarkup({...options,html}),true);
 assert.throws(()=>verifyModelDiscoveryMarkup({...options,html:add('<link rel="alternate" hreflang="DE" href="https://tractorvs.com/de/tractors/tractor-b/">')}),/Duplicate hreflang de/);
 assert.throws(()=>verifyModelDiscoveryMarkup({...options,html:add('<link rel="canonical" href="https://tractorvs.com/tractors/tractor-b/">')}),/duplicate or wrong model canonical/);
 const comment=html.replace(/<link rel="alternate" hreflang="de"[^>]+>/,tag=>"<!--"+tag+"-->");
 assert.throws(()=>verifyModelDiscoveryMarkup({...options,html:comment}),/Missing reciprocal hreflang de/);
 assert.equal(verifyModelDiscoveryMarkup({...options,html:html.replace('hreflang="pt-BR"','hreflang="PT-br"')}),true);
});


test("duplicate published model URL across sitemap shards is not hidden by deduplication",()=>{
 const root=fixture();
 try{
  put(root,"dist/sitemap-1.xml","<urlset><loc>https://tractorvs.com/tr/tractors/tractor-a/</loc></urlset>");
  assert.throws(()=>verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1}),/Duplicate published model URL in sitemap/);
  unlinkSync(join(root,"dist/sitemap-1.xml"));
  assert.equal(verifyPublishedSiteInventory({projectRoot:root,configuredMinimum:1}).models,2);
 }finally{rmSync(root,{recursive:true,force:true});}
});
