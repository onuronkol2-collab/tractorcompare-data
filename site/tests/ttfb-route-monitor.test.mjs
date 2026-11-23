import test from "node:test";
import assert from "node:assert/strict";
import {ORIGIN,TARGETS,probe,percentile,summarize,markdownReport,runMonitor} from "../scripts/ttfb-route-monitor.mjs";

test("fixed public targets cover ten locale catalogues and contrasting page types",()=>{
  assert.equal(ORIGIN,"https://tractorvs.com");
  for(const locale of ["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"])
    assert.ok(TARGETS.some(t=>t.name===locale+"-catalog"),locale);
  for(const kind of ["worker-root","static-home","static-catalog","static-tool","static-editorial","static-discovery","static-model"])
    assert.ok(TARGETS.some(t=>t.kind===kind),kind);
  for(const target of TARGETS){
    const url=new URL(target.path,ORIGIN);
    assert.equal(url.origin,ORIGIN);
    assert.equal(url.search,"");
    assert.equal(url.hash,"");
  }
});

test("nearest-rank percentiles and 200/300/500ms buckets are deterministic",()=>{
  assert.equal(percentile([],75),null);
  assert.equal(percentile([100,250,350,700],75),350);
  const data=[199,200,299,300,499,500].map((headers_ms,i)=>({route:"r"+i,kind:"static",status:200,content_type_ok:true,headers_ms}));
  const x=summarize(data);
  assert.deepEqual(x.buckets,{fast:1,medium:2,slow:2,very_slow:1});
  assert.equal(x.p75_ms,499);
  assert.equal(x.failed_count,0);
  assert.equal(x.high_latency_warning,false);
});

test("probe measures only until headers, does not follow redirects, and never logs cookies",async()=>{
  let t=1000,opts;
  const fetchFn=async (_url,options)=>{
    opts=options;t+=64;
    return new Response(null,{status:302,headers:{location:"https://tractorvs.com/tr/","cf-ray":"abcdef01-FRA","cache-control":"private","set-cookie":"secret=hidden"}});
  };
  const result=await probe({name:"root",path:"/",kind:"worker-root",type:"text/html"},{fetchFn,now:()=>t});
  assert.equal(result.status,302);
  assert.equal(result.headers_ms,64);
  assert.equal(result.location,"https://tractorvs.com/tr/");
  assert.equal(result.colo,"FRA");
  assert.equal(opts.redirect,"manual");
  assert.equal(opts.method,"GET");
  assert.ok(!JSON.stringify(result).includes("secret"));
});

test("same-route persistent HTTP failures are flagged without passing the baseline",()=>{
  const samples=[100,110,120].map(headers_ms=>({route:"bad",kind:"static",status:503,content_type_ok:false,headers_ms}));
  const x=summarize(samples);
  assert.equal(x.p75_ms,null);
  assert.deepEqual(x.failed_routes,["bad"]);
  assert.equal(x.successful_count,0);
  assert.match(markdownReport(x,"2026-11-23T00:00:00Z"),/N\/A/);
});

test("geographic latency warning is not confused with field Core Web Vitals",()=>{
  const data=Array.from({length:30},(_,i)=>({route:"r"+(i%10),kind:"static",status:200,content_type_ok:true,headers_ms:1000+i}));
  const x=summarize(data);
  assert.equal(x.high_latency_warning,true);
  assert.equal(x.severe_latency_warning,false);
  const report=markdownReport(x,"2026-11-23T00:00:00Z");
  assert.match(report,/not.*real-user Core Web Vitals/);
});

test("runMonitor uses a bounded target list and retries, no third-party URLs",async()=>{
  let n=0;
  const fetchFn=async(u,opts)=>{n++;assert.equal(u,"https://tractorvs.com/tr/");assert.equal(opts.redirect,"manual");return new Response("ok",{status:200,headers:{"content-type":"text/html"}})};
  const result=await runMonitor({fetchFn,targets:[{name:"tr-home",path:"/tr/",kind:"static-home",type:"text/html"}],attempts:2});
  assert.equal(n,2);
  assert.equal(result.summary.successful_count,2);
  assert.equal(result.summary.failed_count,0);
});
