import test from "node:test";
import assert from "node:assert/strict";
import {inspectRedirectChain,inspectAllRedirects,CASES}
  from "../scripts/edge-live-redirect-proof.mjs";

const mockFetch=(options={})=>async(url,params)=>{
  assert.equal(params.redirect,"manual");
  const current=new URL(url);
  if(url===options.bad302)return new Response(null,{status:302,
    headers:{location:"https://tractorvs.com"+current.pathname+current.search}});
  const expected="https://tractorvs.com"+current.pathname+current.search;
  if(current.hostname==="www.tractorvs.com"||current.protocol==="http:"){
    return new Response(null,{status:301,headers:{
      location:options.loseQuery?
        "https://tractorvs.com"+current.pathname:expected
    }});
  }
  return new Response("<html>ok</html>",{status:200});
};

test("never mistake eventual 200 for direct 301",async()=>{
  const report=await inspectAllRedirects(mockFetch());
  assert.equal(report.passed,true);
  assert.equal(report.checked,CASES.length);
  assert.ok(report.results.every(x=>x.hops[0].status===301));
});

test("detect an accidental query strip on www redirected URLs",async()=>{
  const source="https://www.tractorvs.com/tr/?utm_source=qa";
  const expected="https://tractorvs.com/tr/?utm_source=qa";
  const result=await inspectRedirectChain(source,expected,mockFetch({loseQuery:true}));
  assert.equal(result.ok,false);
  assert.equal(result.error,"wrong-final-url-or-status");
});

test("reject 302, even if eventual page would be correct",async()=>{
  const source="https://www.tractorvs.com/";
  const result=await inspectRedirectChain(source,"https://tractorvs.com/",mockFetch({bad302:source}));
  assert.equal(result.ok,false);
  assert.equal(result.error,"non-permanent-redirect");
});

test("reject external-host Location even with status 301",async()=>{
  const source="https://www.tractorvs.com/";
  const result=await inspectRedirectChain(source,"https://tractorvs.com/",async()=>new Response(null,{
    status:301,headers:{location:"https://another-example.invalid/"}
  }));
  assert.equal(result.ok,false);
  assert.equal(result.error,"external-origin");
});

test("detect a redirect loop",async()=>{
  const source="https://www.tractorvs.com/";
  const result=await inspectRedirectChain(source,"https://tractorvs.com/",async()=>new Response(null,{
    status:301,headers:{location:source}
  }));
  assert.equal(result.error,"redirect-loop");
});
