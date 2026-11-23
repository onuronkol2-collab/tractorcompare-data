/**
 * Read-only, low-volume first-response-header latency monitor for TractorVS.
 * Node fetch resolving at the response headers is a synthetic proxy for the
 * first-response timing; it is NOT real-user Navigation Timing / CrUX TTFB.
 * No Supabase keys, cookies, query strings, user analytics or paid API.
 */
import {writeFileSync, appendFileSync} from "node:fs";
import {performance} from "node:perf_hooks";
import {fileURLToPath} from "node:url";

export const ORIGIN = "https://tractorvs.com";
export const SAMPLES_PER_ROUTE = 3;
export const TARGETS = Object.freeze([
  {name:"en-home",path:"/",kind:"worker-root",type:"text/html"},
  {name:"tr-home",path:"/tr/",kind:"static-home",type:"text/html"},
  {name:"en-catalog",path:"/tractors/",kind:"static-catalog",type:"text/html"},
  ...["tr","zh","hi","pt-br","fr","de","ru","ja","es"].map(locale=>({
    name:locale+"-catalog",path:"/"+locale+"/tractors/",kind:"static-catalog",type:"text/html"
  })),
  {name:"tr-model",path:"/tr/tractors/belarus-80-1-ca3d18f9/",kind:"static-model",type:"text/html"},
  {name:"tr-compare",path:"/tr/compare/",kind:"static-tool",type:"text/html"},
  {name:"tr-advisor",path:"/tr/farm-advisor/",kind:"static-tool",type:"text/html"},
  {name:"tr-forum",path:"/tr/forum/",kind:"static-editorial",type:"text/html"},
  {name:"tr-articles",path:"/tr/articles/",kind:"static-editorial",type:"text/html"},
  {name:"sitemap-index",path:"/sitemap-index.xml",kind:"static-discovery",type:"xml"},
  {name:"robots",path:"/robots.txt",kind:"static-discovery",type:"text/plain"},
]);

export function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil((percentileValue/100)*sorted.length)-1)];
}

export function summarize(samples) {
  const valid=samples.filter(x=>x.status===200 && Number.isFinite(x.headers_ms) && x.content_type_ok);
  const timings=valid.map(x=>x.headers_ms);
  const buckets={fast:0,medium:0,slow:0,very_slow:0};
  for (const t of timings) {
    if(t<200)buckets.fast++;
    else if(t<300)buckets.medium++;
    else if(t<500)buckets.slow++;
    else buckets.very_slow++;
  }
  const groupBy=(key)=>Object.fromEntries([...new Set(samples.map(x=>x[key]))].sort().map(group=>{
    const rows=samples.filter(x=>x[key]===group);
    const ok=rows.filter(x=>x.status===200 && x.content_type_ok && Number.isFinite(x.headers_ms));
    return [group,{count:rows.length,ok:ok.length,p50_ms:percentile(ok.map(x=>x.headers_ms),50),p75_ms:percentile(ok.map(x=>x.headers_ms),75),p95_ms:percentile(ok.map(x=>x.headers_ms),95),failed:rows.length-ok.length}];
  }));
  const failedRoutes=[...new Set(samples.map(x=>x.route))].filter(route=>
    samples.filter(x=>x.route===route).every(x=>x.status!==200 || !x.content_type_ok));
  const fraction=timings.length ? buckets.very_slow/timings.length : null;
  const p75=percentile(timings,75);
  // Warn about sampled geographic performance. Never claim to know global field TTFB.
  const highLatency=timings.length>=20 && (p75>800 || fraction>=0.5);
  // Alert only if a majority of route medians remain slow across 3 checks,
  // not for one slow connection or geographically sensitive outliers.
  const byRoute=groupBy("route");
  const routeGroups=Object.values(byRoute);
  const sustainedSlowRoutes=routeGroups.filter(x=>x.ok>=2 && x.p50_ms>=500).length;
  const severe=routeGroups.length>=12 && sustainedSlowRoutes>=Math.ceil(routeGroups.length*0.6);
  return {sample_count:samples.length,successful_count:valid.length,failed_count:samples.length-valid.length,
    p50_ms:percentile(timings,50),p75_ms:p75,p95_ms:percentile(timings,95),
    buckets,very_slow_share:fraction,by_route:byRoute,by_kind:groupBy("kind"),sustained_slow_routes:sustainedSlowRoutes,
    failed_routes:failedRoutes,high_latency_warning:highLatency,severe_latency_warning:severe};
}

export async function probe(target,{fetchFn=fetch,now=()=>performance.now(),timeoutMs=12000}={}) {
  const url=new URL(target.path,ORIGIN);
  if(url.origin!==ORIGIN || url.search || url.hash || !/^\/[a-z0-9_/-]*(?:\.[a-z]+)?$/i.test(target.path))
    throw new Error("Unapproved monitoring path");
  const start=now();
  try {
    const response=await fetchFn(url.toString(),{
      method:"GET",redirect:"manual",signal:AbortSignal.timeout(timeoutMs),
      headers:{Accept:target.type==="text/html"?"text/html":"*/*"}
    });
    const headers_ms=Math.round(now()-start);
    const ct=response.headers.get("content-type")||"";
    const ray=response.headers.get("cf-ray")||"";
    const colo=ray.match(/-([A-Z]{3})$/)?.[1]||null;
    const cache=response.headers.get("cf-cache-status")||null;
    // We only need response headers; downloading large catalog HTML inflates cost.
    await response.body?.cancel?.().catch(()=>{});
    return {route:target.name,kind:target.kind,status:response.status,headers_ms,
      content_type_ok:ct.toLowerCase().includes(target.type.toLowerCase()),
      colo,cache_status:cache,age:response.headers.get("age")||null,
      location:response.status>=300&&response.status<400?response.headers.get("location"):null,
      error:null};
  }catch(error){
    return {route:target.name,kind:target.kind,status:0,headers_ms:null,
      content_type_ok:false,colo:null,cache_status:null,age:null,location:null,
      error:error?.name==="TimeoutError"?"timeout":"network_error"};
  }
}

export function markdownReport(report, timestamp) {
  const lines=["## TractorVS TTFB synthetic route monitor", "",
    "**Measurement:** GitHub-hosted Node fetch until response headers (includes connection, TLS and request time). Single runner geography; **not** Ahrefs crawling, CrUX p75 or real-user Core Web Vitals.",
    `**Recorded:** ${timestamp} · ${report.successful_count}/${report.sample_count} HTTP 200 and expected MIME`,"",
    "| Valid first-response samples | p50 | p75 | p95 | ≥500ms |",
    "| --- | ---: | ---: | ---: | ---: |",
    `| ${report.successful_count} | ${report.p50_ms??"N/A"} ms | ${report.p75_ms??"N/A"} ms | ${report.p95_ms??"N/A"} ms | ${report.buckets.very_slow} |`,"",
    "| Route category | Successful / total | p50 | p75 | Failed |",
    "| --- | ---: | ---: | ---: | ---: |"];
  for(const [kind,s] of Object.entries(report.by_kind))lines.push(`| ${kind} | ${s.ok}/${s.count} | ${s.p50_ms??"N/A"} ms | ${s.p75_ms??"N/A"} ms | ${s.failed} |`);
  lines.push("",report.high_latency_warning?"⚠️ High synthetic latency detected; compare across regions and Cloudflare logs before changing cache rules.":"No broad synthetic latency warning for this runner; other regions and crawler environments may differ.");
  if(report.failed_routes.length)lines.push("",`**Unavailable route groups:** ${report.failed_routes.join(", ")}`);
  if(report.severe_latency_warning)lines.push("","**ALERT:** More than 60% of monitored routes had sustained median header latency >=500 ms across 3 samples; investigate CDN and runner region.");
  lines.push("","Failure alarms cover persistent HTTP/MIME failures only. Slow site-wide synthetic samples are highlighted but need independent confirmation before declaring a real-user regression.");
  return lines.join("\n")+"\n";
}

export async function runMonitor({fetchFn=fetch,targets=TARGETS,attempts=SAMPLES_PER_ROUTE,now=()=>performance.now()}={}){
  const samples=[];
  for(const target of targets){
    for(let attempt=1;attempt<=attempts;attempt++){
      samples.push({...await probe(target,{fetchFn,now}),attempt});
    }
  }
  const result={timestamp:new Date().toISOString(),origin:ORIGIN,
    mode:"synthetic_node_response_headers_not_field_ttfb",runner_region:"github_actions_runner_unknown_region",
    samples,summary:summarize(samples)};
  return result;
}

if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]){
  const result=await runMonitor();
  const doc=markdownReport(result.summary,result.timestamp);
  console.log(doc);
  writeFileSync("site/ttfb-synthetic-report.json",JSON.stringify(result,null,2)+"\n");
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,doc);
  // A persistent failure on all 3 probes of the same route is a genuine smoke
  // test failure. Warn without failing on location-dependent latency alone.
  if(result.summary.failed_routes.length || result.summary.severe_latency_warning)process.exitCode=1;
}
