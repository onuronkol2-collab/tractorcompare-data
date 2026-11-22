import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const worker=readFileSync(new URL("../worker/index.js",import.meta.url),"utf8");

test("all allowlisted first-party JPEG resolutions prefer local Cloudflare static bytes",()=>{
  const photoPath=worker.indexOf('if(url.pathname.startsWith("/images/tractors/"))');
  const allow=worker.indexOf("const upstream=resolveApprovedPhotoSource(url.pathname)",photoPath);
  const local=worker.indexOf("const localPhoto = await env.ASSETS.fetch(request)",allow);
  const origin=worker.indexOf("const loadPhoto=async(source,timeoutMs)=>",allow);
  assert.ok(photoPath>=0&&allow>photoPath&&local>allow&&origin>local);
  assert.match(worker,/if\(!upstream\)return new Response\("Photo not found",\{status:404\}\)/);
  const priority=worker.slice(local,origin);
  assert.match(priority,/localPhoto\.ok/);
  assert.match(priority,/image\/jpeg/);
  assert.match(priority,/X-TractorVS-Image-Source":"local"/);
  assert.match(priority,/X-Content-Type-Options":"nosniff"/);
  assert.match(priority,/method==="HEAD"\?null:localPhoto\.body/);
  assert.doesNotMatch(priority,/pathname\.endsWith\("-480\.jpg"\)/,
    "Local trusted media should work for all validated 480,960 and 1920 JPEGs");
});

test("same-image Commons origin fallback stays intact for missing static assets",()=>{
  const idx=worker.indexOf("const localPhoto = await env.ASSETS.fetch(request)");
  assert.ok(idx>0);
  const fallback=worker.slice(idx);
  assert.match(fallback,/let source=await loadPhoto\(upstream/);
  assert.match(fallback,/if\(!source&&isFullSize\)/);
  assert.match(fallback,/const fallback=resolveApprovedPhotoSource\(fallbackPath\)/);
  assert.match(fallback,/if\(!source\)\s*return new Response\("Photo source unavailable"/);
  assert.match(fallback,/X-TractorVS-Image-Fallback/);
});
