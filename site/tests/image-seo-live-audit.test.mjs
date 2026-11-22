import {test} from "node:test";
import assert from "node:assert/strict";
import {classifyPublicImageSitemap,PUBLIC_FORUM_MEDIA_ENDPOINT} from "../scripts/image-seo-asset-boundaries.mjs";
import {fetchPublicImageAsset,publicImageMimeOk} from "../scripts/image-seo-http.mjs";
import {copyrightZhSitemapPages,copyrightLocaleSitemapSamples,strictCopyrightAuditMode} from "../scripts/image-copyright-live-cases.mjs";
const root="https://tractorvs.com";
const model=root+"/tr/tractors/exact-model-123/";
const forum=root+"/tr/forum/reviewed-topic/";
const privateTopic=root+"/tr/forum/pending-topic/";
const photo=root+"/images/tractors/exact-model-123-1920.jpg";
const forumMedia=PUBLIC_FORUM_MEDIA_ENDPOINT+"?id=550e8400-e29b-41d4-a716-446655440000";
const imageXml=(entries)=>'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+
 entries.map(([page,imgs])=>'<url><loc>'+page+'</loc>'+imgs.map(u=>'<image:image><image:loc>'+u.replace(/&/g,"&amp;")+'</image:loc></image:image>').join("")+'</url>').join("")+'</urlset>';
const lists=()=>({htmlPages:new Set([model]),forumPages:new Set([forum])});

test("first-party model JPEG and approved forum gateway media both appear in the same SEO image sitemap",()=>{
 const result=classifyPublicImageSitemap(imageXml([[model,[photo]],[forum,[forumMedia]]]),lists());
 assert.equal(result.models.size,1);
 assert.equal(result.models.has("exact-model-123"),true);
 assert.equal(result.forumAssets.size,1);
 assert.equal(result.forumAssets.has(forumMedia),true);
 assert.equal(result.pages.size,2);
 assert.equal(result.imageReferences,2);
});
test("private forum photo, foreign project photo and noncanonical page are blocked",()=>{
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[privateTopic,[forumMedia]]]),lists()),/unpublished\/unapproved/);
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[forum,[forumMedia.replace("aaufxtcvnzgavtlintiv","unknownexampleproject")]]]),lists()),/unapproved forum image/);
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[forum,[forumMedia.replace("550e8400-e29b-41d4-a716-446655440000","invalid")]]]),lists()),/unapproved forum image/);
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[model,["https://other-domain.example/photo.jpg"]]]),lists()),/unapproved forum image/);
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[model+"?sort=1",[photo]]]),lists()),/Noncanonical image sitemap page/);
});
test("model photos cannot masquerade as forum photo, and duplicate page or image entries are rejected",()=>{
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[forum,[photo]]]),lists()),/Tractor photo listed outside/);
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[model,[photo]],[model,[photo]]]),lists()),/Duplicate image sitemap page/);
 assert.throws(()=>classifyPublicImageSitemap(imageXml([[model,[photo,photo]]]),lists()),/Duplicate image URL/);
});
test("bounded transient 502/503 retries succeed, but persistent 502 and 429 do not disappear",async()=>{
 const image=new Uint8Array(1200);image.set([255,216,255]);
 const fetchFn=async()=>{const status=[502,503,200][call++];return new Response(status===200?image:"transient",{status,headers:{"content-type":status===200?"image/jpeg":"text/plain"}})};
 let call=0;const waits=[],retries=[];
 const result=await fetchPublicImageAsset(photo,{fetchFn,sleep:async ms=>{waits.push(ms)},onRetry:z=>retries.push(z)});
 assert.equal(result.r.status,200);assert.equal(result.attemptsUsed,3);
 assert.deepEqual(waits,[500,1000]);
 assert.equal(retries.length,2);
 assert.equal(publicImageMimeOk(result.r.headers.get("content-type"),result.bytes),true);
 let failedCalls=0;
 const fail=await fetchPublicImageAsset(photo,{fetchFn:async()=>{failedCalls++;return new Response("bad",{status:502})},sleep:async()=>{},attempts:5});
 assert.equal(fail.r.status,502);assert.equal(failedCalls,5);
 let rateCalls=0;
 const rate=await fetchPublicImageAsset(photo,{fetchFn:async()=>{rateCalls++;return new Response("too many",{status:429})},sleep:async()=>{}});
 assert.equal(rate.r.status,429);assert.equal(rateCalls,1);
});
test("JPEG PNG and WEBP magic bytes must match trusted media MIME",()=>{
 const jpg=new Uint8Array(1100);jpg.set([255,216,255]);assert.ok(publicImageMimeOk("image/jpeg",jpg));
 const png=new Uint8Array(1100);png.set([137,80,78,71,13,10,26,10]);assert.ok(publicImageMimeOk("image/png",png));
 const webp=new Uint8Array(1100);webp.set([82,73,70,70],0);webp.set([87,69,66,80],8);assert.ok(publicImageMimeOk("image/webp",webp));
 assert.equal(publicImageMimeOk("text/html",jpg),false);
 assert.equal(publicImageMimeOk("image/jpeg",png),false);
 assert.equal(publicImageMimeOk("image/png",new Uint8Array(20)),false);
});

test("editorial references must match the approved photograph for that exact guide",async()=>{
 const {editorialImagePages}=await import("../src/lib/editorial-photos.ts");
 assert.equal(editorialImagePages.size,8);
 for(const [path,photos] of editorialImagePages){
  const page="https://tractorvs.com"+path;
  const inventory={htmlPages:new Set([page]),forumPages:new Set()};
  const urls=photos.map(photo=>new URL(photo.fullUrl,page).href);
  assert.equal(classifyPublicImageSitemap(imageXml([[page,urls]]),inventory).imageReferences,photos.length);
  assert.throws(()=>classifyPublicImageSitemap(imageXml([[page,["https://tractorvs.com/images/tractors/wrong-1920.jpg"]]]),inventory),/outside/);
 }
});

test("Google copyright audit lists all Chinese pages sharing a rights-cleared photo",()=>{
 const rights=[{fileId:"photo-a",copyrightOwner:"VerifiedPerson",sourcePage:"https://commons.wikimedia.org/wiki/File:A.jpg"},
  {fileId:"photo-cc0",copyrightOwner:undefined,sourcePage:"https://commons.wikimedia.org/wiki/File:B.jpg"}];
 const xml=imageXml([
  [root+"/zh/tractors/model-a/",[root+"/images/tractors/photo-a-1920.jpg"]],
  [root+"/zh/tractors/model-a-variant/",[root+"/images/tractors/photo-a-1920.jpg"]],
  [root+"/en/tractors/model-a/",[root+"/images/tractors/photo-a-1920.jpg"]],
  [root+"/zh/tractors/model-b/",[root+"/images/tractors/photo-cc0-1920.jpg"]]
 ]);
 const pages=copyrightZhSitemapPages(xml,rights);
 assert.equal(pages.length,2);
 assert.deepEqual(pages.map(v=>v.path),["/zh/tractors/model-a/","/zh/tractors/model-a-variant/"]);
 assert.ok(pages.every(p=>p.owner==="VerifiedPerson"&&p.fileId==="photo-a"));
});


test("copyright meta audit is strict only on manual, scheduled, or deliberately re-run deployed main",()=>{
 const cases=[
  [{eventName:"schedule"},true],
  [{eventName:"workflow_dispatch"},true],
  [{eventName:"push",ref:"refs/heads/main",runAttempt:"1"},false],
  [{eventName:"push",ref:"refs/heads/main",runAttempt:"2"},true],
  [{eventName:"push",ref:"refs/heads/main",runAttempt:"3"},true],
  [{eventName:"push",ref:"refs/heads/feature",runAttempt:"3"},false],
  [{eventName:"pull_request",ref:"refs/pull/342/merge",runAttempt:"2"},false],
  [{eventName:"push",ref:"refs/heads/main",runAttempt:"garbage"},false],
  [{eventName:"push",ref:"refs/heads/main",runAttempt:undefined},false],
 ];
 for(const [input,expected] of cases)
  assert.equal(strictCopyrightAuditMode(input),expected,JSON.stringify(input));
});


test("representative rights metadata checks cover all other nine live locales, not just Chinese",()=>{
 const rights=[{fileId:"known-rights",copyrightOwner:"VerifiedAuthor",
   sourcePage:"https://commons.wikimedia.org/wiki/File:Known.jpg"},
  {fileId:"cc0-unclaimed",sourcePage:"https://commons.wikimedia.org/wiki/File:CC0.jpg"}];
 const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
 const urls=locales.map(locale=>
  [(locale==="en"?root:root+"/"+locale)+"/tractors/same-model/",
   [root+"/images/tractors/known-rights-1920.jpg"]]);
 urls.push([root+"/ja/tractors/unclaimed/",[root+"/images/tractors/cc0-unclaimed-1920.jpg"]]);
 const matches=copyrightLocaleSitemapSamples(imageXml(urls),rights,locales);
 assert.equal(matches.length,9);
 assert.deepEqual(matches.map(x=>x.locale),["en","tr","hi","pt-br","fr","de","ru","ja","es"]);
 assert.ok(matches.every(x=>x.owner==="VerifiedAuthor"&&x.fileId==="known-rights"));
 assert.ok(matches.every(x=>x.path.startsWith(x.locale==="en"?"/tractors/":"/"+x.locale+"/tractors/")));
});
test("missing locale, only CC0, and noncanonical photo URLs fail multilingual rights coverage",()=>{
 const rights=[{fileId:"photo-ok",copyrightOwner:"RightsOwner",sourcePage:"https://commons.wikimedia.org/wiki/File:Photo.jpg"},
   {fileId:"public-domain",sourcePage:"https://commons.wikimedia.org/wiki/File:PD.jpg"}];
 const sitemap=imageXml([
  [root+"/tr/tractors/only-cc0/",[root+"/images/tractors/public-domain-1920.jpg"]],
  [root+"/en/tractors/good/",[root+"/images/tractors/photo-ok-1920.jpg"]]
 ]);
 assert.throws(()=>copyrightLocaleSitemapSamples(sitemap,rights,["en","tr"]),/tr/);
 assert.deepEqual(copyrightLocaleSitemapSamples(sitemap,rights,["en"])[0].fileId,"photo-ok");
 assert.throws(()=>copyrightLocaleSitemapSamples(sitemap,rights,["en","bad"]),/Unknown locale/);
 assert.throws(()=>copyrightLocaleSitemapSamples("",rights,["en"]),/No rights-verified/);
});
