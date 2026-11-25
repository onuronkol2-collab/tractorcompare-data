import test from "node:test";
import assert from "node:assert/strict";
import {releaseFromHtml,waitForProductionRelease,mainDescendantVerifier} from "../scripts/live-release-readiness.mjs";
const A="a".repeat(40),B="b".repeat(40),C="c".repeat(40);
const html=sha=>'<meta name="tractorvs-release-sha" content="'+sha+'">';
const page=sha=>new Response(html(sha),{headers:{"content-type":"text/html"}});
test("duplicate or malformed provenance rejected",()=>{assert.equal(releaseFromHtml(html(A)),A);assert.equal(releaseFromHtml(html(A)+html(B)),null);assert.equal(releaseFromHtml(html("bad")),null);});
test("old release waits, exact SHA proceeds",async()=>{let n=0,p=0;const r=await waitForProductionRelease({target:B,fetchFn:async()=>page(++n===1?A:B),sleep:async()=>p++});assert.equal(r.status,"ready");assert.equal(r.observed,B);assert.equal(r.contentChecks,0);assert.equal(p,1);});
test("stale deployment is bounded and not content failure",async()=>{let n=0;const r=await waitForProductionRelease({target:B,attempts:3,fetchFn:async()=>{n++;return page(A)},sleep:async()=>{}});assert.equal(r.status,"deployment_pending");assert.equal(r.contentChecks,0);assert.equal(n,3);});
test("verified descendant accepted",async()=>{const r=await waitForProductionRelease({target:A,fetchFn:async()=>page(B),acceptDescendant:async(a,b)=>a===A&&b===B});assert.equal(r.status,"ready");});
test("invalid MIME rejected; throttling not retried",async()=>{await assert.rejects(waitForProductionRelease({target:A,fetchFn:async()=>new Response(html(A),{headers:{"content-type":"image/jpeg"}})}),/MIME/);let n=0;await assert.rejects(waitForProductionRelease({target:A,fetchFn:async()=>{n++;return new Response("",{status:429})}}),/rate limited/);assert.equal(n,1);await assert.rejects(waitForProductionRelease({target:A,fetchFn:async()=>new Response("",{status:503,headers:{"retry-after":"120"}})}),/Retry-After/);});
test("descendant must be in main history; proof cached",async()=>{let n=0;const ahead=sha=>({status:"ahead",behind_by:0,merge_base_commit:{sha}});const verify=mainDescendantVerifier({fetchFn:async(url)=>{n++;return Response.json(url.endsWith("/branches/main")?{commit:{sha:C}}:url.endsWith(A+"..."+B)?ahead(A):ahead(B))}});assert.equal(await verify(A,B),true);assert.equal(await verify(A,B),true);assert.equal(n,3);});
test("non-main descendant rejected",async()=>{const verify=mainDescendantVerifier({fetchFn:async(url)=>Response.json(url.endsWith("/branches/main")?{commit:{sha:C}}:url.endsWith(A+"..."+B)?{status:"ahead",behind_by:0,merge_base_commit:{sha:A}}:{status:"diverged",behind_by:1,merge_base_commit:{sha:A}})});assert.equal(await verify(A,B),false);});

test("all required pages must expose one verified release, even during overlapping deployments",async()=>{
 let n=0,p=0;
 const r=await waitForProductionRelease({target:A,paths:["/tr/compare/","/tr/tractors/"],attempts:3,fetchFn:async()=>page([B,A,B,B][n++]),acceptDescendant:async(a,b)=>a===A&&b===B,sleep:async()=>p++});
 assert.equal(r.status,"ready");assert.equal(r.observed,B);assert.equal(n,4);assert.equal(p,1);
});
test("mixed production pages never pass or execute content tests",async()=>{
 let n=0;const r=await waitForProductionRelease({target:A,paths:["/tr/compare/","/tr/tractors/"],attempts:2,fetchFn:async()=>page(++n%2?A:B),acceptDescendant:async()=>true,sleep:async()=>{}});
 assert.equal(r.status,"deployment_pending");assert.equal(r.contentChecks,0);assert.match(r.reason,/mixed deployed versions/);
});
test("preflight rejects off-origin or malformed path input",async()=>{
 for(const path of ["//evil.example/","/../","https://example.com/","/tr/?x=1"])await assert.rejects(waitForProductionRelease({target:A,paths:[path]}),/Invalid readiness routes/);
});
