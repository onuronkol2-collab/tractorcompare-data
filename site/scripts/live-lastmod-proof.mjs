// Compare the public XML to the committed date map ONLY when the exact
// release is observed before and after the read. No IndexNow or writes.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {releaseFromHtml,waitForProductionRelease,mainDescendantVerifier} from "./live-release-readiness.mjs";
import {parseProductionSitemapInventory} from "./production-sitemap-inventory.mjs";
const origin="https://tractorvs.com";
const shaPattern=/^[a-f0-9]{40}$/;
export function compareLiveDates({indexXml,children,dateMap}){
 if(dateMap?.version!==1||!dateMap.dates||typeof dateMap.dates!=="object"||Array.isArray(dateMap.dates))throw Error("Invalid committed date map");
 const inventory=parseProductionSitemapInventory({indexXml,children});
 const seen=new Set(), mismatches=[];
 let dated=0;
 for(const [url,xml] of children){
  if(!/^\/sitemap-[0-9]+\.xml$/.test(new URL(url).pathname))continue;
  for(const [,entry] of xml.matchAll(/<url(?:\s[^>]*)?>([\s\S]*?)<\/url>/g)){
   const loc=entry.match(/<loc>([^<]+)<\/loc>/)?.[1]?.replaceAll("&amp;","&");
   if(!loc||!inventory.htmlPages.has(loc)||seen.has(loc))throw Error("Unexpected live XML page");
   seen.add(loc);
   const path=new URL(loc).pathname;
   const expected=Object.hasOwn(dateMap.dates,path)?dateMap.dates[path]:null;
   const dates=[...entry.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m=>m[1]);
   if(expected!==null&&!Number.isFinite(Date.parse(expected)))throw Error("Invalid committed date for "+path);
   if(expected===null?dates.length!==0:dates.length!==1||!Number.isFinite(Date.parse(dates[0]))||Date.parse(dates[0])!==Date.parse(expected))mismatches.push(path);
   if(dates.length)dated++;
  }
 }
 if(seen.size!==inventory.htmlPages.size)throw Error("Incomplete live HTML date audit");
 const missing=Object.keys(dateMap.dates).filter(path=>!seen.has(origin+path));
 return {verifiedPages:seen.size,datedPages:dated,mismatches,missingRecordedUrls:missing};
}
// Only a previously ancestry-verified main descendant is passed here.
// Fetch its exact immutable ledger rather than comparing it with stale checkout data.
export async function readRevisionDateMap(sha,{token="",fetchFn=fetch}={}){
 if(typeof sha!=="string"||!shaPattern.test(sha))throw Error("Invalid ledger revision");
 const url="https://api.github.com/repos/onuronkol2-collab/tractorcompare-data/contents/site/src/data/sitemap-lastmod.json?ref="+sha;
 const response=await fetchFn(url,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{Accept:"application/vnd.github.raw+json",...(token?{Authorization:"Bearer "+token}:{})}});
 if(!response.ok)throw Error("Exact revision ledger unavailable: HTTP "+response.status);
 const raw=await response.text();
 if(raw.length>2_000_000)throw Error("Exact revision ledger exceeds audit size");
 const map=JSON.parse(raw);
 if(map?.version!==1||!map.dates||typeof map.dates!=="object"||Array.isArray(map.dates))throw Error("Invalid exact revision ledger");
 return map;
}
export async function proveDeployedDates({target,dateMap,fetchFn=fetch,acceptDescendant=async()=>false,readMap=async()=>{throw Error("Exact descendant ledger unavailable");},pause,attempts=16,log=()=>{}}={}){
 const readiness=await waitForProductionRelease({target,fetchFn,acceptDescendant,sleep:pause,attempts,log});
 if(readiness.status!=="ready")return {status:readiness.status,target,observed:readiness.observed,verifiedPages:0};
 const revision=readiness.observed;
 const ledger=revision===target?dateMap:await readMap(revision);
 const proof=await inspectLiveDates({target:revision,dateMap:ledger,fetchFn});
 return {...proof,requestedTarget:target};
}
export async function inspectLiveDates({target,dateMap,fetchFn=fetch}={}){
 if(typeof target!=="string"||!shaPattern.test(target))throw Error("Invalid expected release SHA");
 const read=async(path,mime)=>{
  const url=new URL(path,origin);
  if(url.origin!==origin||url.search||url.hash)throw Error("Noncanonical audit URL");
  const res=await fetchFn(url.href,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{"Cache-Control":"no-cache"}});
  if(res.status!==200||!mime.test(res.headers.get("content-type")||""))throw Error("Unexpected public response "+res.status+" for "+path);
  const text=await res.text();
  if(text.length>30_000_000)throw Error("Unexpected public response size");
  return text;
 };
 const home=()=>read("/",/^text\/html(?:;|$)/i);
 const xml=path=>read(path,/^(?:application|text)\/xml(?:;|$)/i);
 const before=releaseFromHtml(await home());
 if(before!==target)return {status:"deployment_pending",target,observed:before,verifiedPages:0};
 const indexXml=await xml("/sitemap-index.xml");
 const urls=[...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
 if(urls.length<3||urls.length>30||new Set(urls).size!==urls.length)throw Error("Unexpected live sitemap child inventory");
 const children=new Map();
 for(const url of urls){
  const u=new URL(url);
  if(u.origin!==origin||u.href!==url||u.search||u.hash||!/^\/(?:sitemap-[0-9]+|forum-sitemap|image-sitemap)\.xml$/.test(u.pathname))throw Error("Unexpected live sitemap child");
  children.set(url,await xml(u.pathname));
 }
 const after=releaseFromHtml(await home());
 if(after!==target)return {status:"deployment_changed",target,observed:after,verifiedPages:0};
 const result=compareLiveDates({indexXml,children,dateMap});
 return {status:result.mismatches.length?"date_mismatch":result.missingRecordedUrls.length?"inventory_drift":"verified",target,observed:after,...result};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const dateMap=JSON.parse(readFileSync(new URL("../src/data/sitemap-lastmod.json",import.meta.url),"utf8"));
  const token=process.env.GITHUB_TOKEN||"";
  const result=await proveDeployedDates({target:process.argv[2],dateMap,acceptDescendant:mainDescendantVerifier({token}),readMap:sha=>readRevisionDateMap(sha,{token}),log:row=>console.log("TRACTORVS_LASTMOD_READINESS "+JSON.stringify(row))});
  console.log("TRACTORVS_LIVE_LASTMOD "+JSON.stringify(result));
  if(result.status==="date_mismatch"||result.status==="inventory_drift")process.exitCode=1;
  else if(result.status!=="verified"){console.error("::error::Live date proof not complete: "+result.status+"; no successful release proof.");process.exitCode=2;}
 }catch(e){console.error(String(e.message));process.exitCode=1;}
}
