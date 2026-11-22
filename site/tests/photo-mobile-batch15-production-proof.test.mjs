import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  expectedLiveBatch15,findPublicModelPages,findPublicEditorialPages,
  checkLiveModelPage,proveBatch15Live,LIVE_ORIGIN,
  EDITORIAL_SHOWCASE_IDS,EDITORIAL_GLOSSARY_PAGES
} from "../scripts/verify-photo-batch15-production.mjs";

const {files,records,held}=expectedLiveBatch15();
const editorial=records.filter(x=>EDITORIAL_SHOWCASE_IDS.includes(x.fileId));
const models=records.filter(x=>!EDITORIAL_SHOWCASE_IDS.includes(x.fileId));
const modelPages=new Map(models.map(x=>[x.fileId,"/tr/tractors/"+x.fileId+"/"]));

function sitemap(modelEntries=models,extraModelVariants=[]){
  const item=(path,ids)=>'<url><loc>'+LIVE_ORIGIN+path+'</loc>'+
    ids.map(id=>'<image:image><image:loc>'+LIVE_ORIGIN+'/images/tractors/'+id+
      '-1920.jpg</image:loc></image:image>').join('')+'</url>';
  const pageEntries=modelEntries.map(record=>item(modelPages.get(record.fileId),[record.fileId]));
  for(const x of extraModelVariants)pageEntries.push(item(x.path,[x.fileId]));
  for(const path of EDITORIAL_GLOSSARY_PAGES)
    pageEntries.push(item(path,editorial.map(x=>x.fileId)));
  return '<?xml version="1.0"?><urlset xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
    pageEntries.join('')+'</urlset>';
}
function photoMarkup(item){
  const path="/images/tractors/"+item.fileId;
  return '<button data-tractor-photo data-photo-url="'+path+'-1920.jpg">'+
    '<picture><source type="image/webp" srcset="'+path+'-720.webp 720w">'+
    '<img srcset="'+path+'-720.jpg 720w" alt="Illustrative model photo"></picture></button>'+
    '<a href="'+item.sourcePage+'">'+item.photographer+'</a>'+
    '<a href="'+item.licenseUrl+'">'+item.licenseName+'</a>';
}
function fakeModelPage(item,path){
  return '<!doctype html><html><head><link rel="canonical" href="'+LIVE_ORIGIN+path+
  '"><meta name="robots" content="index,follow"></head><body>'+
  photoMarkup(item)+'</body></html>';
}
function fakeEditorialPage(path){
  return '<!doctype html><html><head><link rel="canonical" href="'+LIVE_ORIGIN+path+
  '"><meta name="robots" content="index,follow"></head><body>'+
  editorial.map(photoMarkup).join('')+'</body></html>';
}
function mockedFetch(xml=sitemap(),{brokenEditorial=false,exposeHeld=false}={}){
  const calls=[];
  const fetchFn=async(url,opts)=>{
    calls.push(url);
    assert.ok(url.startsWith(LIVE_ORIGIN),"No external network");
    assert.equal(opts.redirect,"error");
    const pathname=new URL(url).pathname;
    if(pathname==="/image-sitemap.xml")
      return new Response(xml,{status:200,headers:{"Content-Type":"application/xml"}});
    if(EDITORIAL_GLOSSARY_PAGES.includes(pathname)){
      let html=fakeEditorialPage(pathname);
      if(brokenEditorial)html=html.replace(editorial[0].photographer,"UNKNOWN");
      return new Response(html,{status:200,headers:{"Content-Type":"text/html"}});
    }
    const variant=pathname.endsWith("-variant-b/");
    const model=variant
      ?models.find(x=>pathname==="/tr/tractors/"+x.fileId+"-variant-b/")
      :models.find(x=>pathname===modelPages.get(x.fileId));
    if(model)return new Response(fakeModelPage(model,pathname),{
      status:200,headers:{"Content-Type":"text/html"}});
    if(held.some(id=>pathname.includes(id+"-720.")))
      return new Response("Unpublished", {status:exposeHeld?200:404});
    const bytes=readFileSync(new URL("../public"+pathname,import.meta.url));
    return new Response(bytes,{status:200,headers:{"Content-Type":
      pathname.endsWith(".jpg")?"image/jpeg":"image/webp"}});
  };
  return {fetchFn,calls};
}

test("13 model and two genuinely public editorial photo identities have distinct page-proof rules",()=>{
  assert.equal(records.length,15);
  assert.equal(files.length,30);
  assert.equal(models.length,13);
  assert.equal(editorial.length,2);
  assert.deepEqual(editorial.map(x=>x.fileId).sort(),[...EDITORIAL_SHOWCASE_IDS].sort());
  const xml=sitemap();
  const modelMap=findPublicModelPages(xml);
  assert.equal(modelMap.size,13);
  const editorialMap=findPublicEditorialPages(xml);
  assert.equal(editorialMap.size,2);
  for(const item of models){
    assert.deepEqual(modelMap.get(item.fileId),[modelPages.get(item.fileId)]);
    assert.equal(checkLiveModelPage(fakeModelPage(item,modelPages.get(item.fileId)),
      item,modelPages.get(item.fileId)).ok,true);
  }
  for(const item of editorial)
    assert.deepEqual(editorialMap.get(item.fileId),[...EDITORIAL_GLOSSARY_PAGES].sort());
  assert.throws(()=>findPublicModelPages(xml.replace(models[0].fileId+"-1920.jpg",
    "missing-1920.jpg")),/missing/);
  assert.throws(()=>findPublicEditorialPages(xml.replaceAll(editorial[0].fileId+"-1920.jpg",
    "missing-1920.jpg")),/Missing published EN\/TR glossary/);
  assert.throws(()=>findPublicEditorialPages("<html>no sitemap</html>"),/malformed/);
});
test("production proof accepts 30 real bytes, 13 model pages, four editorial checks and six held 404s",async()=>{
  const {fetchFn,calls}=mockedFetch();
  const result=await proveBatch15Live({fetchFn,maxFirstAttempts:1,pause:async()=>{}});
  assert.equal(result.images,30);
  assert.equal(result.uniquePhotoSources,15);
  assert.equal(result.modelPhotoSources,13);
  assert.equal(result.editorialPhotoSources,2);
  assert.equal(result.publicModelPages,13);
  assert.equal(result.editorialPageChecks,4);
  assert.equal(result.held404,6);
  assert.equal(result.failed,0);
  assert.equal(calls.length,54);
});
test("one licensed source legitimately shared by two published model variant pages is verified twice",async()=>{
 const first=models[0];
 const path="/tr/tractors/"+first.fileId+"-variant-b/";
 const xml=sitemap(models,[{fileId:first.fileId,path}]);
 const map=findPublicModelPages(xml);
 assert.deepEqual(map.get(first.fileId),[modelPages.get(first.fileId),path].sort());
 const {fetchFn,calls}=mockedFetch(xml);
 const result=await proveBatch15Live({fetchFn,maxFirstAttempts:1,pause:async()=>{}});
 assert.equal(result.publicModelPages,14);
 assert.equal(result.editorialPageChecks,4);
 assert.equal(calls.length,55);
});
test("counterfeit MIME, off-origin checks, missing editorial credit and held photo leaks fail closed",async()=>{
 await assert.rejects(proveBatch15Live({fetchFn:async()=>new Response(
   "<html>not an image</html>",{status:200,headers:{"Content-Type":"text/html"}}),
   maxFirstAttempts:1,pause:async()=>{}}),/MIME mismatch/);
 await assert.rejects(proveBatch15Live({origin:"https://evil.example",maxFirstAttempts:1}),
   /canonical HTTPS origin/);
 await assert.rejects(proveBatch15Live({
   fetchFn:mockedFetch(sitemap(),{brokenEditorial:true}).fetchFn,
   maxFirstAttempts:1,pause:async()=>{}}),/Editorial glossary CC\/SEO\/WebP regression/);
 await assert.rejects(proveBatch15Live({
   fetchFn:mockedFetch(sitemap(),{exposeHeld:true}).fetchFn,
   maxFirstAttempts:1,pause:async()=>{}}),/Unpublished model photo served unexpectedly/);
});
test("editorial glossary actually uses approved mobile WebP with JPEG fallback and source links",()=>{
 const content=readFileSync(new URL("../src/components/TractorGlossary.astro",import.meta.url),"utf8");
 const source=readFileSync(new URL("../src/lib/editorial-photos.ts",import.meta.url),"utf8");
 assert.match(content,/approvedMobilePhotoFormats/);
 assert.match(content,/galleryPhotos\.map/);
 assert.match(content,/type="image\/webp"/);
 assert.match(content,/mobile\.jpegUrl\+" 720w/);
 assert.match(content,/photo\.displayUrl\+" 960w"/);
 assert.match(content,/photoText\(lang,"resizedDerivative"\)/);
 assert.match(content,/data-photo-url=\{photo\.fullUrl\}/);
 assert.match(content,/href=\{photo\.sourcePage\}/);
 assert.match(content,/href=\{photo\.licenseUrl\}/);
 assert.match(source,/approvedPhoto\("Case IH","Puma 150"\)/);
 assert.match(source,/approvedPhoto\("McCormick","X5\.120 P3-Drive"\)/);
});

test("Astro SSR picture attributes are valid semantic picture markup; fake text is not",()=>{
 const record=editorial[0];
 const path=EDITORIAL_GLOSSARY_PAGES[0];
 const canonical=fakeEditorialPage(path);
 const astro=canonical.replaceAll("<picture>","<picture data-astro-cid=\"scoped-123\" class=\"glossary-gallery-photo\">");
 assert.equal(checkLiveModelPage(astro,record,path).ok,true,
   "Astro appends scoped attributes; do not reject the actual semantic picture");
 const missing=canonical.replaceAll("<picture>","<div>").replaceAll("</picture>","</div>");
 const result=checkLiveModelPage(missing,record,path);
 assert.equal(result.ok,false);
 assert.ok(result.errors.includes("missing picture element"));
 const pseudo=missing.replace("<body>","<body><script>const x=\"<picture-not-valid>\";</script>");
 assert.equal(checkLiveModelPage(pseudo,record,path).ok,false,
   "A fake picture-like script token must not satisfy the markup proof");
});
