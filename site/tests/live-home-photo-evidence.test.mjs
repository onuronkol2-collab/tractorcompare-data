
import test from "node:test";
import assert from "node:assert/strict";
import {checkHomePhotos,auditLiveHomePhotos} from "../scripts/live-home-photo-evidence.mjs";
const sha="a".repeat(40);
const stem="/images/tractors/reviewed-model";
const sizes="auto, (max-width:620px) min(calc(100vw - 88px), 508px), (max-width:720px) 219px, (max-width:800px) calc(50vw - 85px), min(calc(33.333vw - 80px), 323px)";
const card='<article class="home-featured-card"><button data-photo-url="'+stem+'-1920.jpg" data-photo-source="https://commons.wikimedia.org/wiki/File:Review.jpg" data-photo-credit="Author" data-photo-license="https://creativecommons.org/licenses/by-sa/4.0/"><picture><img src="'+stem+'-480.jpg" srcset="'+stem+'-480.jpg 480w, '+stem+'-960.jpg 960w" sizes="'+sizes+'" width="960" height="720" loading="lazy" alt="Reviewed photo"></picture></button></article>';
const html=(path,release=sha,content=card)=>'<html><head><meta name="tractorvs-release-sha" content="'+release+'"><link rel="canonical" href="https://tractorvs.com'+path+'"></head><body><div data-research-gallery="licensed">'+content+'</div></body></html>';
test("live homepage evidence requires actual photo attributes, license and exact canonical",()=>{
 assert.equal(checkHomePhotos(html("/ja/"),"/ja/").photos.length,1);
 for(const broken of [
  card.replace('sizes="'+sizes+'"',''),
  card.replace(stem+"-960.jpg 960w",""),
  card.replace('loading="lazy"','loading="eager"'),
  card.replace('data-photo-credit="Author"',''),
  card.replace(stem+"-1920.jpg",stem+"-960.jpg")
 ])assert.throws(()=>checkHomePhotos(html("/ja/",sha,broken),"/ja/"),/Missing/);
 assert.throws(()=>checkHomePhotos(html("/zh/"),"/ja/"),/canonical/);
 assert.throws(()=>checkHomePhotos(html("/ja/","short"),"/ja/"),/release SHA/);
});
test("sample must contain real licensed photos from a single live release",async()=>{
 const fetchFn=async(url,opts)=>{
  assert.equal(opts.redirect,"error");
  const path=new URL(url).pathname;
  return new Response(html(path),{headers:{"content-type":"text/html"}});
 };
 assert.equal((await auditLiveHomePhotos({fetchFn})).length,2);
 await assert.rejects(auditLiveHomePhotos({fetchFn:async url=>new Response(html(new URL(url).pathname,url.endsWith("/ja/")?"b".repeat(40):sha),{headers:{"content-type":"text/html"}})}),/Mixed production versions/);
 await assert.rejects(auditLiveHomePhotos({fetchFn:async url=>new Response(html(new URL(url).pathname,sha,""),{headers:{"content-type":"text/html"}})}),/No actual featured photo/);
 await assert.rejects(auditLiveHomePhotos({fetchFn:async()=>new Response("",{status:404})}),/Unexpected live homepage response/);
});
