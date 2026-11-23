/**
 * Zero-cost, strictly read-only independent photograph discovery via Openverse.
 * Openverse indexes multiple providers, notably Flickr and Europeana.
 * This code does NOT publish photos or treat aggregated license metadata as proof.
 * It consumes ONLY the published public sitemap identity snapshot already made by
 * batch-photo-research.yml. No anon/service-role/private inventory, API keys or fees.
 */
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {APPROVED_TRACTOR_PHOTOS} from "../src/lib/tractor-photos.ts";

export const MAX_REQUESTS=12;
export const PUBLIC_REPORT_DIR=resolve("./photo-discovery-report");
const API="https://api.openverse.org/v1/images/";
const PRIORITY=["McCormick","Sonalika","TYM","Mahindra","Swaraj","Steyr","Valtra","Zetor","Antonio Carraro","Belarus","Agrale","Kioti"];
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"");
export const key=r=>norm(r.brand)+"|"+norm(r.model);
export function selectPublishedMissing(records,approved=APPROVED_TRACTOR_PHOTOS,{index=0,limit=MAX_REQUESTS}={}){
 if(!Array.isArray(records)||!records.length||records.some(r=>r.status!=="published"||!r.brand||!r.model||!r.pageUrl||!r.tractor_id||r.error)) throw Error("Incomplete or non-public input: refuse cross-platform research");
 if(!Array.isArray(approved)||!Number.isSafeInteger(index)||index<0||!Number.isInteger(limit)||limit<1||limit>MAX_REQUESTS)throw Error("Unsafe batch settings");
 const photographed=new Set(approved.map(p=>key({brand:p.brand,model:p.model})));
 const unique=new Map();
 for(const r of records){const k=key(r);if(!unique.has(k)&&!photographed.has(k))unique.set(k,{brand:r.brand,model:r.model});}
 const missing=[...unique.values()].sort((a,b)=>{
 const ap=PRIORITY.indexOf(a.brand),bp=PRIORITY.indexOf(b.brand);
 return (ap<0?99:ap)-(bp<0?99:bp)||a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model);
 });
 if(!missing.length)return {missing:0,selected:[],offset:0};
 const offset=(index*limit)%missing.length;
 return {missing:missing.length,offset,selected:[...missing,...missing].slice(offset,offset+Math.min(limit,missing.length))};
}
function cleanHttps(v){
 try{const u=new URL(v);if(u.protocol!=="https:"||u.username||u.password||u.port||u.href.length>800)return null;return u.href;}
 catch{return null;}
}
const allowed=new Set(["by","by-sa","cc0"]);
export function classifyOpenverseResult(item,brand,model){
 if(!item||typeof item!=="object"||!allowed.has(String(item.license||"").toLowerCase()))return null;
 if(typeof item.title!=="string"||!item.title.trim())return null;
 const source=String(item.source||"").toLowerCase();
 if(!["flickr","europeana"].includes(source))return null;
 const landing=cleanHttps(item.foreign_landing_url);
 const license=cleanHttps(item.license_url);
 if(!landing||!license)return null;
 const licenseUri=new URL(license);
 if(!["creativecommons.org","www.creativecommons.org"].includes(licenseUri.hostname))return null;
 if(!/\/licenses\/by(?:-sa)?\/[234]\.0\/?|\/publicdomain\/zero\/1\.0\/?/.test(licenseUri.pathname))return null;
 const val=String(item.license).toLowerCase(),path=licenseUri.pathname.toLowerCase();
 if(!(val==="cc0"?path.startsWith("/publicdomain/zero/"):
   path.startsWith("/licenses/"+val+"/")))return null;
 const tokens=(norm(brand+" "+model).match(/[a-z0-9]+/g)||[]).filter(t=>t.length>=2);
 const normalizedTitle=norm(item.title);
 const relevant=tokens.every(t=>normalizedTitle.includes(t));
 if(!relevant)return null;
 return {brand,model,title:item.title.slice(0,250),
  source,creator:String(item.creator||"").slice(0,160)||null,
  license:val,license_url:license,source_page_url:landing,
  exact_visual_model_identity_verified:false,original_author_rights_verified:false,
  allowed_to_publish:false,review_status:"external_provider_review_needed"};
}
export async function researchIndependentSources(records,{fetchFn=fetch,approved=APPROVED_TRACTOR_PHOTOS,index=0,limit=MAX_REQUESTS,delayFn=sleep}={}){
 const selection=selectPublishedMissing(records,approved,{index,limit});
 const report={generated_at:new Date().toISOString(),status:"complete",provider:"Openverse",
  scopes:["flickr","europeana"],read_only:true,source:"published sitemap only",
  missing_unique_pairs:selection.missing,rotation_offset:selection.offset,
  query_budget:limit,queries_sent:0,rate_limited:false,models:[],candidates:[],
  note:"Aggregator matches are untrusted leads, never photo publication approvals."};
 for(const item of selection.selected){
  const u=new URL(API);
  // Broad discoverability with a separate exact title-only model gate below.
  u.searchParams.set("q",item.brand+" "+item.model+" tractor");
  u.searchParams.set("source","flickr,europeana");
  u.searchParams.set("license","by,by-sa,cc0");
  u.searchParams.set("page_size","7");
  const url=u.toString();
  if(new URL(url).origin!=="https://api.openverse.org")throw Error("Openverse host changed");
  let response;
  try{response=await fetchFn(url,{signal:AbortSignal.timeout(18000),headers:{Accept:"application/json","User-Agent":"TractorVS-OpenLicenseResearch/1.0 (nonpublishing)"}});
    report.queries_sent++;
    if(response.status===429){report.status="rate_limited";report.rate_limited=true;report.models.push({...item,status:429,leads:0});break;}
    if(response.status!==200)throw Error("Openverse returned HTTP "+response.status);
    if(!String(response.headers?.get("content-type")||"").includes("application/json"))throw Error("Openverse unexpected response type");
    const body=await response.json();
    if(!Array.isArray(body?.results))throw Error("Openverse results absent");
    const matches=body.results.slice(0,7).map(x=>classifyOpenverseResult(x,item.brand,item.model)).filter(Boolean);
    report.models.push({...item,status:200,leads:matches.length});
    report.candidates.push(...matches);
  }catch(e){report.status="partial";report.models.push({...item,status:"error",reason:String(e?.message||e).slice(0,160),leads:0});}
  await delayFn(600);
 }
 return report;
}
export async function main(){
 const data=JSON.parse(await readFile(PUBLIC_REPORT_DIR+"/published-model-inventory.json","utf8"));
 const dateIndex=Math.floor(Date.now()/86400000);
 const result=await researchIndependentSources(data,{index:dateIndex,limit:MAX_REQUESTS});
 await mkdir(PUBLIC_REPORT_DIR,{recursive:true});
 await writeFile(PUBLIC_REPORT_DIR+"/openverse-independent-provider-review.json",JSON.stringify(result,null,2)+"\n");
 console.log("TRACTORVS_OPENVERSE_READONLY "+JSON.stringify({status:result.status,queries:result.queries_sent,
 missingUniquePairs:result.missing_unique_pairs,candidateCount:result.candidates.length,
 providers:result.scopes,publicationCount:0,rateLimited:result.rate_limited}));
 // API quota/source failures remain an explicit failure in this independent
 // research lane. The Commons gate stays separate; never label partial as complete.
 if(result.status!=="complete")process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
