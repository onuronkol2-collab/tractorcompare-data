import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {previewOriginFromComments,previewOriginFromBranch,hasPreviewRelease,currentPreview,verifyPreviewIdentity,previewCandidates,verifyPreviewAssets} from "../scripts/verify-mobile-preview-assets.mjs";

const ORIGIN="https://test-preview-tractorvs-site.onuronkol2.workers.dev";
const HEAD="a".repeat(40);
const cloudflareComment=(origin=ORIGIN,commit=HEAD.slice(0,7))=>({user:{login:"cloudflare-workers-and-pages[bot]"},body:"### Preview URL: "+origin+" (commit "+commit+")\n###### This URL reflects your latest Preview deployment"});

test("only six SHA-pinned CC review photo URLs can be checked on a verified PR preview",()=>{
 const assets=previewCandidates();
 assert.equal(assets.length,6);
 assert.equal(assets.filter(x=>x.mime==="image/webp").length,3);
 assert.equal(assets.filter(x=>x.mime==="image/jpeg").length,3);
 assert.ok(assets.every(x=>x.urlPath.startsWith("/images/tractors/")&&
   x.urlPath.includes("-720.")&&x.sha256.length===64));
 assert.equal(previewOriginFromComments([cloudflareComment()],HEAD),ORIGIN);
 assert.throws(()=>previewCandidates({records:[]}),/Invalid reviewed/);
});
test("preview client checks actual bytes, size and MIME rather than trusting HTTP 200",async()=>{
 const calls=[];
 const fetchFn=async (url,opts)=>{
   calls.push({url,opts});
   const path=new URL(url).pathname;
   const data=readFileSync(new URL("../public"+path,import.meta.url));
   const mime=path.endsWith(".webp")?"image/webp":"image/jpeg";
   return new Response(data,{status:200,headers:{"Content-Type":mime}});
 };
 const verified=await verifyPreviewAssets({origin:ORIGIN,fetchFn});
 assert.equal(verified.length,6);
 assert.equal(calls.length,6);
 assert.ok(calls.every(x=>x.opts.redirect==="error"));
 await assert.rejects(verifyPreviewAssets({
   origin:"https://tractorvs.com",
   fetchFn
 }),/No cross-domain or production/);
 await assert.rejects(verifyPreviewAssets({origin:ORIGIN,fetchFn:async()=>new Response(
   "<html>not an image</html>",{status:200,headers:{"Content-Type":"text/html"}}
 )}),/MIME mismatch/);
 await assert.rejects(verifyPreviewAssets({origin:ORIGIN,fetchFn:async()=>new Response(
   Buffer.from("fake-data"),{status:200,headers:{"Content-Type":"image/webp"}}
 )}),/MIME mismatch|SHA\/size mismatch/);
});

test("resolve only the current commit from the Cloudflare bot and the allowed preview host",()=>{
 assert.equal(previewOriginFromComments([cloudflareComment()],HEAD),ORIGIN);
 assert.equal(previewOriginFromComments([cloudflareComment(ORIGIN,"bbbbbbb")],HEAD),null);
 assert.equal(previewOriginFromComments([cloudflareComment("https://tractorvs.com")],HEAD),null);
 assert.equal(previewOriginFromComments([cloudflareComment("https://test-preview-tractorvs-site.onuronkol2.workers.dev.evil.example")],HEAD),null);
 assert.equal(previewOriginFromComments([{...cloudflareComment(),user:{login:"untrusted"}}],HEAD),null);
 assert.throws(()=>previewOriginFromComments([cloudflareComment()],"aaaaaaa"),/full PR head SHA/);
 assert.equal(hasPreviewRelease('<head><meta name="tractorvs-release-sha" content="'+HEAD+'"></head>',HEAD),true);
 assert.equal(hasPreviewRelease('<meta name="tractorvs-release-sha" content="'+"b".repeat(40)+'">',HEAD),false);
 assert.equal(hasPreviewRelease('<meta name="tractorvs-release-sha" content="aaaaaaa">',HEAD),false);
});
test("preview asset verification rejects production and unrelated workers before any request",async()=>{
 let count=0;
 const fetchFn=async()=>{count++;throw Error("Unexpected request");};
 for(const origin of [undefined,"https://tractorvs.com","https://tractorvs-site.onuronkol2.workers.dev","https://unrelated.onuronkol2.workers.dev",ORIGIN+"/"]){
  await assert.rejects(verifyPreviewAssets({origin,fetchFn}),/No cross-domain or production/);
 }
 assert.equal(count,0);
});


test("missing bot comment has safe branch alias fallback, never bypasses exact release SHA",async()=>{
 const branch="fix/edge-and-live-audit-hardening-20261125";
 const origin=previewOriginFromBranch(branch);
 assert.equal(origin,"https://fix-edge-and-live-audit-hardening-20261125-tractorvs-site.onuronkol2.workers.dev");
 for(const name of ["main","https://evil.example","a".repeat(60),"../foo","",null])assert.equal(previewOriginFromBranch(name),null);
 const html=sha=>'<html><head><meta name="tractorvs-release-sha" content="'+sha+'"></head></html>';
 const calls=[],options={pr:"700",sha:HEAD,token:"test-read-token",branch,attempts:2,pause:async()=>{}};
 let homepageCount=0;
 const mock=async(url,opts)=>{
  calls.push(url);assert.equal(opts.redirect,"error");
  if(url.startsWith("https://api.github.com/"))return Response.json([]);
  assert.equal(url,origin+"/");assert.equal(opts.headers.Authorization,undefined);
  homepageCount++;
  return new Response(html(homepageCount===1?"b".repeat(40):HEAD),{headers:{"Content-Type":"text/html"}});
 };
 assert.equal(await currentPreview({...options,fetchFn:mock}),origin);
 assert.equal(homepageCount,2);
 await assert.rejects(currentPreview({...options,fetchFn:async(url)=>url.startsWith("https://api.github.com/")?Response.json([]):new Response(html("b".repeat(40)),{headers:{"Content-Type":"text/html"}})}),/PREVIEW_DEPLOYMENT_PENDING/);
 assert.equal(hasPreviewRelease(html(HEAD)+html(HEAD),HEAD),false);
 assert.equal((await verifyPreviewIdentity(origin,HEAD,async()=>new Response(html("b".repeat(40)),{headers:{"Content-Type":"text/html"}}))).ready,false);
 await assert.rejects(verifyPreviewIdentity(origin,HEAD,async()=>new Response("",{status:429})),/rate limited/);
});
