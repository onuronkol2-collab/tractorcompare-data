// Read actual Lighthouse *lab* JSON; never mislabel lab TBT as field INP.
// Optional no-key PageSpeed field lookup may return no data on new/low-traffic sites.
// No database secrets, paid crawler or user analytics are involved.
import {readFileSync,writeFileSync,appendFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

// Template-based weekly Lighthouse sample. The full production sitemap is
// separately checked by production-seo-audit.mjs; lab scoring every model page
// would be costly and cannot be reduced to one universal "SEO score".
export const ROUTES=[
  "home","catalog","model","compare","advisor","articles","glossary",
  "selection","review","forum","en-home","zh-home","de-model","ja-guide"
];
export const FIELD_URLS={
  home:"https://tractorvs.com/tr/",
  catalog:"https://tractorvs.com/tr/tractors/",
};
export const FIELD_THRESHOLDS={lcp_ms:2500,cls:0.1,inp_ms:200};
const METRICS=["first-contentful-paint","largest-contentful-paint","total-blocking-time","cumulative-layout-shift","speed-index","server-response-time"];
const CATEGORIES=["performance","accessibility","best-practices","seo"];
const numeric=x=>typeof x==="number"&&Number.isFinite(x)?x:null;

/** Public first-party images only. These are Lighthouse *estimated* potential
 * byte savings, NOT measured real-user transfer, a rights audit, or proof that
 * AVIF/WebP derivatives are already approved or deployed.
 * Two Lighthouse audits may flag the same file; never add their estimates. */
export function collectImageOptimizationCandidates(lhr){
  const rows=new Map();
  for(const auditId of ["modern-image-formats","uses-responsive-images"]){
    const items=lhr?.audits?.[auditId]?.details?.items;
    if(!Array.isArray(items))continue;
    for(const item of items){
      if(typeof item?.url!=="string")continue;
      let url;
      try{url=new URL(item.url);}catch{continue;}
      if(url.origin!=="https://tractorvs.com"||!url.pathname.startsWith("/images/")||
         !/\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname))continue;
      const waste=numeric(item.wastedBytes);
      if(waste===null||waste<=0)continue;
      const key=url.origin+url.pathname;
      const existing=rows.get(key)||{url:key,estimatedMaxWasteBytes:0,flags:[]};
      existing.estimatedMaxWasteBytes=Math.max(existing.estimatedMaxWasteBytes,Math.round(waste));
      if(!existing.flags.includes(auditId))existing.flags.push(auditId);
      rows.set(key,existing);
    }
  }
  return [...rows.values()].sort((a,b)=>b.estimatedMaxWasteBytes-a.estimatedMaxWasteBytes||
    a.url.localeCompare(b.url)).slice(0,20);
}


export function analyzeLighthouse(a,route){
  if(!ROUTES.includes(route))throw Error("Unrecognized mobile report route: "+route);
  if(!a || typeof a!=="object" || !a.categories || !a.audits)throw Error("Lighthouse JSON is missing result categories/audits");
  const scores=Object.fromEntries(CATEGORIES.map(k=>[k,numeric(a.categories[k]?.score)==null?null:Math.round(a.categories[k].score*100)]));
  const vitals=Object.fromEntries(METRICS.map(k=>[k,numeric(a.audits[k]?.numericValue)]));
  const issues=Object.values(a.audits).filter(v=>v && typeof v==="object" && v.score!=null && v.score<0.9 && v.details?.type==="opportunity")
    .sort((a,b)=>(b.details?.overallSavingsMs||0)-(a.details?.overallSavingsMs||0))
    .slice(0,8).map(x=>({id:x.id,title:x.title,savings_ms:x.details?.overallSavingsMs||0}));
  const access=new Set(a.categories.accessibility?.auditRefs?.filter(r=>r.weight>0).map(r=>r.id)||[]);
  const accessibilityFindings=Object.values(a.audits).filter(v=>v && v.score!=null && v.score<1 && access.has(v.id))
    .map(v=>({id:v.id,title:v.title,score:v.score,description:v.description?.slice(0,180)||""}));
  const contrastFailures=(a.audits["color-contrast"]?.details?.items||[]).slice(0,30).map(i=>({
    selector:i.node?.selector,html:i.node?.snippet?.slice(0,180),
    explanation:i.node?.explanation?.slice(0,160),
    summary:i.node?.failureSummary?.slice(0,180),
  }));
  const url=a.finalDisplayedUrl||a.finalUrl||null;
  if(url && !/^https:\/\/tractorvs\.com\//.test(url))throw Error("Unexpected Lighthouse redirect outside TractorVS: "+url);
  const seoRefs=new Set(a.categories.seo?.auditRefs?.filter(r=>r.weight>0).map(r=>r.id)||[]);
  const seoFindings=Object.values(a.audits)
    .filter(v=>v&&v.score!=null&&v.score<1&&seoRefs.has(v.id))
    .map(v=>({id:v.id,title:v.title,score:v.score,
      description:v.description?.slice(0,180)||""}));
  return {route,url,scores,vitals,issues,accessibilityFindings,contrastFailures,seoFindings,
    imageCandidates:collectImageOptimizationCandidates(a),
    mode:"synthetic_lab_mobile",real_user_inp_measured:false};
}

export function interpretCrux(data) {
  // Google PageSpeed Insights includes field records only if CrUX has enough sample data.
  const selected=data?.loadingExperience?.metrics
    ? {scope:"URL",metrics:data.loadingExperience.metrics}
    : data?.originLoadingExperience?.metrics
      ? {scope:"origin_only",metrics:data.originLoadingExperience.metrics} : null;
  if(!selected)return {available:false,reason:"insufficient_real_user_sample_or_no_field_data"};
  const metrics=selected.metrics;
  const vals={
    lcp_ms:numeric(metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile),
    cls:numeric(metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile),
    inp_ms:numeric(metrics.INTERACTION_TO_NEXT_PAINT?.percentile),
  };
  if(Object.values(vals).every(x=>x==null))return {available:false,reason:"no_usable_CrUX_core_web_vitals"};
  // PSI reports CLS as an integer percentile with a scale factor of 100.
  if(vals.cls!==null)vals.cls=Number((vals.cls/100).toFixed(3));
  return {available:true,scope:selected.scope,values:vals,source:"CrUX 28-day field data via public PageSpeed Insights",
    threshold_pass:Object.fromEntries(Object.entries(FIELD_THRESHOLDS).map(([k,max])=>[k,vals[k]===null?null:vals[k]<=max]))};
}
const fmt=(v,unit="")=>v==null?"N/A":Number(v).toFixed(unit==="s"?3:unit==="cls"?3:0)+(unit==="ms"?" ms":unit==="s"?" s":"");
export function markdownReport(reports,field={}) {
  const lines=[
    "## TractorVS mobile performance — independent lab baseline",
    "",
    "Lighthouse measures **simulated mobile lab visits**, not real-user Core Web Vitals. TBT is **not** INP. Scores can vary with test infrastructure. No production deploy is performed by this audit.",
    "",
    "| Route | Perf | A11y | Best practices | SEO | Lab LCP | Lab CLS | Lab TBT |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for(const r of reports){
    lines.push("| "+r.route+" | "+fmt(r.scores.performance)+" | "+fmt(r.scores.accessibility)+
      " | "+fmt(r.scores["best-practices"])+" | "+fmt(r.scores.seo)+" | "+
      fmt(r.vitals["largest-contentful-paint"],"ms")+" | "+fmt(r.vitals["cumulative-layout-shift"],"cls")+
      " | "+fmt(r.vitals["total-blocking-time"],"ms")+" |");
  }
  const below100=reports.filter(r=>r.scores.seo!==100);
  lines.push("","### SEO Lighthouse checks on indexable representative templates","");
  if(below100.length){
    for(const r of below100){
      const reasons=r.seoFindings.map(f=>f.id+": "+f.title).join("; ");
      lines.push("- **"+r.route+"**: "+fmt(r.scores.seo)+"/100 — "+(reasons||"missing audit details; investigate report JSON"));
    }
  }else lines.push("All "+reports.length+" sampled routes scored 100/100 in this run. This does not certify every sitemap URL or Google indexation.");
  // An actionable, rights-neutral audit queue with no extra network/API calls.
  // A single image in two audits cannot have its potential waste double-counted.
  const imageMap=new Map();
  for(const report of reports){
    for(const item of report.imageCandidates||[]){
      const prev=imageMap.get(item.url)||{
        url:item.url,estimatedMaxWasteBytes:0,flags:[],routes:[]};
      prev.estimatedMaxWasteBytes=Math.max(prev.estimatedMaxWasteBytes,item.estimatedMaxWasteBytes);
      for(const flag of item.flags)if(!prev.flags.includes(flag))prev.flags.push(flag);
      if(!prev.routes.includes(report.route))prev.routes.push(report.route);
      imageMap.set(item.url,prev);
    }
  }
  const imageQueue=[...imageMap.values()]
    .sort((a,b)=>b.estimatedMaxWasteBytes-a.estimatedMaxWasteBytes||a.url.localeCompare(b.url)).slice(0,12);
  lines.push("","### First-party image optimization candidates (laboratory estimates only)","");
  if(imageQueue.length){
    lines.push("A Lighthouse image may appear in multiple audits/routes. Values below are the **largest estimated wasted bytes per image**, never added together. They are not proven speed gains or permissions to modify licensed source files.","",
      "| First-party image | Sample route(s) | Opportunity flags | Max estimated waste |",
      "| --- | --- | --- | ---: |");
    for(const item of imageQueue)lines.push("| \`"+new URL(item.url).pathname+"\` | "+
      item.routes.join(", ")+" | "+item.flags.join(", ")+" | "+
      Math.round(item.estimatedMaxWasteBytes/1024)+" KiB |");
  }else lines.push("No itemized public first-party image opportunities in these Lighthouse results; this does not prove all photographs are optimally sized.");
  lines.push("","Changing image formats or sizes still requires exact model identity, original file/license evidence, first-party URL, accessibility and image-SEO validation.");
  lines.push("","### Real-user CrUX field data (last 28 days, only if Google reports enough visits)","",
    "| URL | Data level | LCP p75 | CLS p75 | INP p75 |","| --- | --- | ---: | ---: | ---: |");
  for(const [key,url] of Object.entries(FIELD_URLS)){
    const f=field[key];
    lines.push("| "+url+" | "+(f?.available?f.scope:"Unavailable")+
      " | "+fmt(f?.values?.lcp_ms,"ms")+" | "+fmt(f?.values?.cls,"cls")+
      " | "+fmt(f?.values?.inp_ms,"ms")+" |");
  }
  lines.push("",
    "Good real-user thresholds: LCP at most 2,500 ms; CLS at most 0.1; INP at most 200 ms at p75. **N/A is never a pass or zero**.",
    "Full Lighthouse JSON reports are available in this workflow's artifact.",
    "");
  return lines.join("\n");
}
async function cruxField(url){
  try{
    const endpoint=new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url",url);
    endpoint.searchParams.set("strategy","mobile");
    endpoint.searchParams.append("category","PERFORMANCE");
    const response=await fetch(endpoint,{signal:AbortSignal.timeout(20000)});
    if(!response.ok)return {available:false,reason:"PageSpeed_http_"+response.status};
    const json=await response.json();
    return interpretCrux(json);
  }catch(error){return {available:false,reason:"PageSpeed_unavailable_"+(error?.name==="TimeoutError"?"timeout":"network")};}
}
export async function main(){
  const dir=resolve(process.env.TRACTORVS_LIGHTHOUSE_REPORT_DIR||"/tmp/tractorvs-lighthouse");
  const reports=ROUTES.map(route=>analyzeLighthouse(JSON.parse(readFileSync(join(dir,route+".json"),"utf8")),route));
  for(const result of reports)console.log("TRACTORVS_MOBILE_BASELINE "+JSON.stringify(result));
  const field={};
  for(const [key,url] of Object.entries(FIELD_URLS)){
    field[key]=await cruxField(url);
    console.log("TRACTORVS_REAL_USER_CRUX "+JSON.stringify({route:key,url,...field[key]}));
  }
  const json={created_at:new Date().toISOString(),lab:reports,crux_field:field};
  writeFileSync(join(dir,"summary.json"),JSON.stringify(json,null,2)+"\n","utf8");
  const markdown=markdownReport(reports,field);
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown+"\n");
  console.log(markdown);
  const nonPerfect=reports.filter(r=>r.scores.seo!==100);
  if(nonPerfect.length){
    console.error("TRACTORVS_SEO_SCORE_BELOW_TARGET "+JSON.stringify(nonPerfect.map(r=>({
      route:r.route,url:r.url,seo:r.scores.seo,findings:r.seoFindings
    }))));
    process.exitCode=1;
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
