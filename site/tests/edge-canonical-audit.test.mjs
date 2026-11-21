import test from "node:test";
import assert from "node:assert/strict";
import { inspectCanonicalEdge } from "../scripts/edge-canonical-audit.mjs";

const canonicalHtml=(url)=>`<!doctype html><html lang="tr"><head>
  <meta name="robots" content="index,follow,max-image-preview:large"/>
  <link rel="canonical" href="${url}"/></head><body><main><h1>TractorVS</h1></main></body></html>`;

function healthyFetch({httpStatus=301,httpLocation,forceNoindex=false}={}) {
  const calls=[];
  const fetchFn=async (url, options) => {
    calls.push({url,options});
    if(url.startsWith("https://www.")) throw new TypeError("getaddrinfo ENOTFOUND");
    if(url.startsWith("http://")) return new Response("", {
      status:httpStatus,
      headers:httpStatus===200?{"content-type":"text/html"}:
        {"location":httpLocation||url.replace(/^http:/,"https:")},
    });
    return new Response(forceNoindex?
      canonicalHtml(url).replace("index,follow","noindex,nofollow"):
      canonicalHtml(url),{status:200,headers:{"content-type":"text/html; charset=utf-8"}});
  };
  return {fetchFn,calls};
}

test("only direct permanent redirects and self-canonical HTTPS count as healthy",async()=>{
  const {fetchFn,calls}=healthyFetch();
  const report=await inspectCanonicalEdge({fetchFn});
  assert.equal(report.passed,true);
  assert.equal(report.issues.length,0);
  assert.equal(report.notices.filter(x=>x.code==="www-unavailable").length,2);
  assert.equal(report.results.filter(x=>x.ok).length,5);
  assert.ok(calls.every(x=>x.options.redirect==="manual"),"must not follow redirects");
  assert.ok(calls.every(x=>x.options.method==="GET"));
});

test("served HTTP 200 is a real canonical consolidation risk even with HTTPS page tags",async()=>{
  const {fetchFn}=healthyFetch({httpStatus:200});
  const report=await inspectCanonicalEdge({fetchFn,paths:["/"]});
  assert.equal(report.passed,false);
  assert.equal(report.issues.length,1);
  assert.equal(report.issues[0].code,"http-to-https");
  assert.match(report.issues[0].message,/got HTTP 200/);
});

test("temporary redirects and redirects to the wrong origin are rejected",async()=>{
  const temp=await inspectCanonicalEdge({fetchFn:healthyFetch({httpStatus:302}).fetchFn,paths:["/"]});
  assert.equal(temp.passed,false);
  assert.equal(temp.issues[0].code,"http-to-https");
  const wrong=await inspectCanonicalEdge({fetchFn:healthyFetch({httpLocation:"https://tractorvs.com/wrong/"}).fetchFn,paths:["/"]});
  assert.equal(wrong.passed,false);
  assert.match(wrong.issues[0].message,/Location.*wrong/);
});

test("HTTPS noindex is a real SEO failure; a missing www alias is reported separately",async()=>{
  const result=await inspectCanonicalEdge({fetchFn:healthyFetch({forceNoindex:true}).fetchFn,paths:["/"]});
  assert.equal(result.passed,false);
  assert.equal(result.issues.length,2);
  assert.ok(result.issues.some(x=>x.code==="https-canonical"&&x.message.includes("noindex=true")));
  assert.ok(result.notices.every(x=>x.code==="www-unavailable"));
});

test("notices become visible without making www DNS absence falsely look like failed HTTPS",async()=>{
  const report=await inspectCanonicalEdge({fetchFn:healthyFetch().fetchFn,paths:[]});
  assert.equal(report.issues.length,0);
  assert.equal(report.notices.length,2);
  assert.equal(report.passed,true);
});
