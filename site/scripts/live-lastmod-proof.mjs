// Compare the public XML to the committed date map ONLY when the exact
// release is observed before and after the read. No IndexNow or writes.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {releaseFromHtml} from "./live-release-readiness.mjs";
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
  const result=await inspectLiveDates({target:process.argv[2],dateMap});
  console.log("TRACTORVS_LIVE_LASTMOD "+JSON.stringify(result));
  if(result.status==="date_mismatch")process.exitCode=1;
  if(result.status!=="verified"&&result.status!=="date_mismatch")console.log("::warning::Live date proof not complete: "+result.status+"; do not count as verified.");
 }catch(e){console.error(String(e.message));process.exitCode=1;}
}
