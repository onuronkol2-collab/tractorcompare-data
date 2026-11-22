/**
 * Live post-deploy discovery gate for TractorVS.
 * Compares *live* public sitemap versions with an Actions-cache checkpoint.
 * Never assumes a Git commit, Supabase row or build means a deployed page.
 * Google has no general IndexNow endpoint. No crawling/indexing claims here.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync,appendFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const ORIGIN="https://tractorvs.com";
export const KEY="e4b1594b38e2465b9659c00b778571a5";
export const KEY_URL=ORIGIN+"/"+KEY+".txt";
export const INDEXNOW_URL="https://api.indexnow.org/indexnow";
// IndexNow distributes one accepted submission across participating engines.
// These official endpoints are failovers, NEVER extra sends on success.
export const INDEXNOW_FALLBACK_URLS=Object.freeze([
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
  "https://searchadvisor.naver.com/indexnow",
]);
const STATE=resolve(fileURLToPath(new URL("../.seo-discovery/state.json",import.meta.url)));
const REPORT=resolve(fileURLToPath(new URL("../.seo-discovery/report.json",import.meta.url)));
const MAX_URLS=20000;
// Verify a modest, bounded number of public pages each hour. Never bulk-ping
// unchanged historic pages or skip canonical/robots checks to drain a backlog.
export const MAX_CHANGED_PER_RUN=120;

function fail(message){throw Error("[TractorVS SEO discovery] "+message);}
function xmlField(body,tag){
  return [...body.matchAll(new RegExp("<"+tag+"(?:\\s[^>]*)?>([^<]+)</"+tag+">","g"))].map(x=>x[1].replaceAll("&amp;","&"));
}
function allowUrl(raw){
  let url;
  try{url=new URL(raw);}catch{fail("Invalid sitemap URL");}
  if(url.origin!==ORIGIN||url.username||url.password||url.search||url.hash||url.protocol!=="https:")
    fail("Noncanonical sitemap URL: "+raw);
  if(url.pathname.includes("..")||url.pathname.startsWith("/language/"))fail("Unsafe or noncanonical URL: "+raw);
  return url.href;
}
export function parseIndex(xml){
  if(!xml.includes("<sitemapindex"))fail("Missing sitemapindex");
  const entries=xmlField(xml,"loc").map(allowUrl);
  if(!entries.length||entries.length>30||new Set(entries).size!==entries.length)
    fail("Sitemap index is missing, duplicated or too large");
  for(const url of entries)if(!/^\/(?:sitemap-[0-9]+|forum-sitemap|image-sitemap)\.xml$/.test(new URL(url).pathname))
    fail("Unexpected sitemap child file");
  return entries;
}
export function parsePageSitemap(xml){
  if(!xml.includes("<urlset"))fail("Missing urlset");
  const items=new Map();
  const matches=[...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  if(matches.length>MAX_URLS)fail("Unexpected sitemap size");
  for(const [,entry] of matches){
    const url=xmlField(entry,"loc");
    if(url.length!==1)fail("Invalid sitemap URL entry");
    const href=allowUrl(url[0]);
    if(items.has(href))fail("Duplicate sitemap URL: "+href);
    const mods=xmlField(entry,"lastmod");
    let lastmod=null;
    if(mods.length>1)fail("Duplicate lastmod");
    if(mods.length===1){
      const d=Date.parse(mods[0]);
      if(!Number.isFinite(d)||d>Date.now()+86400000)fail("Invalid/future lastmod");
      // Preserve trustworthy timestamps (including same-day content changes).
      lastmod=/^\d{4}-\d\d-\d\d$/.test(mods[0])?mods[0]:new Date(d).toISOString();
    }
    items.set(href,lastmod);
  }
  if(!items.size)fail("Empty sitemap");
  return items;
}
export function changedUrls(previous,current,limit=MAX_CHANGED_PER_RUN){
  const out=[];
  for(const [url,lastmod] of current){
    const prev=previous[url];
    if(!Object.hasOwn(previous,url) || (lastmod&&prev!==lastmod))out.push(url);
    if(out.length>=limit)break;
  }
  return out;
}
function validSavedState(state){
  if(!state||state.version!==1||!state.urls||typeof state.urls!=="object"||Array.isArray(state.urls))
    fail("Invalid checkpoint format");
  if(Object.keys(state.urls).length>MAX_URLS)fail("Checkpoint too large");
  for(const [url,mod] of Object.entries(state.urls)){
    allowUrl(url);
    if(mod!==null && (!/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d:\d\d\.\d{3}Z)?$/.test(mod)||!Number.isFinite(Date.parse(mod))))
      fail("Invalid checkpoint date");
  }
  return state;
}
export function validatePage(html,url){
  if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)||
     /<meta\b[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html))
    fail("Noindex page cannot be notified: "+url);
  const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)||[];
  if(canonical.length!==1||!canonical[0].includes('href="'+url+'"'))
    fail("Missing/wrong canonical on "+url);
  if(!/<main\b/i.test(html))fail("No main landmark: "+url);
  return true;
}
async function fetchWithTimeout(url,opts={},fetchFn=fetch){
  const result=await fetchFn(url,{...opts,redirect:"manual",signal:AbortSignal.timeout(20000)});
  return result;
}
export async function liveSitemap({fetchFn=fetch}={}){
  const fetchText=async(url)=>{
    const r=await fetchWithTimeout(url,{},fetchFn);
    if(r.status!==200)fail("Live resource failed "+r.status+": "+url);
    return r.text();
  };
  const robots=await fetchText(ORIGIN+"/robots.txt");
  if(!robots.includes("Sitemap: "+ORIGIN+"/sitemap-index.xml")||
     /^Disallow:\s*\/\s*$/mi.test(robots))fail("robots.txt sitemap or crawling policy invalid");
  const key=(await fetchText(KEY_URL)).trim();
  if(key!==KEY)fail("IndexNow ownership key mismatch");
  const children=parseIndex(await fetchText(ORIGIN+"/sitemap-index.xml"));
  // The submitted root index must cover all approved public sitemap types.
  if(!children.includes(ORIGIN+"/forum-sitemap.xml")||
     !children.includes(ORIGIN+"/image-sitemap.xml")||
     !children.some(url=>/^\/sitemap-[0-9]+\.xml$/.test(new URL(url).pathname)))
    fail("Root sitemap index must contain HTML, forum and image sitemap files");
  const all=new Map();
  for(const child of children){
    const xml=await fetchText(child);
    // Image page references overlap HTML URLs: never send them twice via IndexNow.
    if(child===ORIGIN+"/image-sitemap.xml")continue;
    // No approved forum topics yet is a valid empty public forum sitemap.
    if(child===ORIGIN+"/forum-sitemap.xml"&&!/<url>/i.test(xml)){
      if(!/<urlset(?:\s|>)/.test(xml))fail("Invalid empty approved forum sitemap");
      continue;
    }
    const urls=parsePageSitemap(xml);
    for(const [url,mod] of urls){
      if(all.has(url))fail("Duplicate URL across HTML and forum sitemaps");
      all.set(url,mod);
    }
    if(all.size>MAX_URLS)fail("Sitemap URL cap exceeded");
  }
  return all;
}
async function validateChangedPages(urls,fetchFn=fetch){
  for(let i=0;i<urls.length;i+=8){
    await Promise.all(urls.slice(i,i+8).map(async(url)=>{
      const res=await fetchWithTimeout(url,{},fetchFn);
      if(res.status!==200)fail("New/changed page not live with 200: "+url+" ("+res.status+")");
      if((res.headers.get("x-robots-tag")||"").includes("noindex"))fail("Noindex header: "+url);
      const html=await res.text();
      validatePage(html,url);
    }));
  }
}
export async function submitIndexNow(urls,{fetchFn=fetch}={}){
  if(!urls.length)return {status:"no_changes",sent:0};
  if(urls.length>MAX_CHANGED_PER_RUN)fail("Unbounded IndexNow batch");
  const body=JSON.stringify({host:"tractorvs.com",key:KEY,keyLocation:KEY_URL,urlList:urls});
  const failures=[];
  // One successful IndexNow endpoint shares the update with participants.
  // Stop immediately on success; do not send duplicate requests to each engine.
  for(const endpoint of [INDEXNOW_URL,...INDEXNOW_FALLBACK_URLS]){
    let response;
    try{
      response=await fetchFn(endpoint,{
        method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},
        body,signal:AbortSignal.timeout(20000)
      });
    }catch{
      failures.push("network_error");
      continue;
    }
    if([200,202].includes(response.status))
      return {status:response.status===200?"accepted":"received_pending_key_validation",
        sent:urls.length,http:response.status,endpoint};
    // Never evade rate limits, invalid submissions, or ownership failures.
    if(![500,502,503,504].includes(response.status))
      fail("IndexNow API rejected submission with HTTP "+response.status);
    failures.push("HTTP_"+response.status);
  }
  // Throw before the caller advances the checkpoint. Retrying is safe.
  fail("All IndexNow endpoints unavailable ("+failures.join(",")+")");
}

export async function run({fetchFn=fetch,statePath=STATE,reportPath=null,dryRun=false,now=new Date()}={}){
  const current=await liveSitemap({fetchFn});
  // Read-only gate: sitemap is based on a *real* deployed production build.
  const baseline=!existsSync(statePath);
  const state=baseline?{version:1,urls:{}}:validSavedState(JSON.parse(readFileSync(statePath,"utf8")));
  const pending=baseline?[]:changedUrls(state.urls,current);
  const count=baseline?0:changedUrls(state.urls,current,MAX_URLS).length;
  const result={as_of:now.toISOString(),live_urls:current.size,previous_urls:Object.keys(state.urls).length,
    max_urls_per_run:MAX_CHANGED_PER_RUN,
    historical_urls_baselined:baseline?current.size:0,
    new_or_modified:count,checked:pending.length,remaining:Math.max(0,count-pending.length),
    mode:baseline?"baseline_only":dryRun?"dry_run":"notify",indexnow:"not_sent",indexnow_endpoint:null,
    indexnow_http:null,indexnow_sent:0,
    google_discovery:"public_sitemap_and_robots; Google_does_not_use_IndexNow",indexed_urls:"unavailable",
    index_status_reason:"Submission or sitemap inclusion is not proof of indexing"};
  if(pending.length){
    await validateChangedPages(pending,fetchFn);
    if(!dryRun){
      const sent=await submitIndexNow(pending,{fetchFn});
      result.indexnow=sent.status;
      result.indexnow_endpoint=sent.endpoint;
      result.indexnow_http=sent.http;
      result.indexnow_sent=sent.sent;
    }
  }
  if(!dryRun){
    // Bootstrap without spamming old pages. Never advance past unsubmitted URLs.
    if(baseline)state.urls=Object.fromEntries(current);
    else {
      for(const url of pending)state.urls[url]=current.get(url);
      // Do not submit deletions until reviewed separately (404/410 workflows).
      // Preserve historical checkpoint for removed URLs as no-op.
    }
    mkdirSync(dirname(statePath),{recursive:true});
    writeFileSync(statePath,JSON.stringify(state)+"\n");
  }
  if(reportPath){
    mkdirSync(dirname(reportPath),{recursive:true});
    writeFileSync(reportPath,JSON.stringify(result,null,2)+"\n");
  }
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const result=await run({dryRun:process.env.TRACTORVS_SEO_DRY_RUN==="true",reportPath:REPORT});
    console.log("TRACTORVS_SEARCH_DISCOVERY "+JSON.stringify(result));
    if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      "## TractorVS public search discovery\n\n"+
      "| Signal | Evidence |\n|---|---|\n"+
      "| Live sitemap URLs | "+result.live_urls+" |\n"+
      "| New/changed vs checkpoint | "+result.new_or_modified+" |\n"+
      "| Verified URLs this run | "+result.checked+" |\n"+
      "| Pending | "+result.remaining+" |\n"+
      "| IndexNow shared-protocol response | "+result.indexnow+" |\n"+
      "| IndexNow endpoint used | "+(result.indexnow_endpoint||"None") +" |\n"+
      "| Bing / Yandex / Naver / Seznam | IndexNow participants; individual engine receipt not verified |\n"+
      "| Google | Sitemap/robots discovery; not an IndexNow participant |\n"+
      "| Indexed in search engines | Not measurable from sitemap/IndexNow; requires webmaster data |\n\n"+
      "Baseline created without bulk submission; new public URLs are validated and sent after deployment.\n");
  }catch(e){console.error(e);process.exitCode=1;}
}
