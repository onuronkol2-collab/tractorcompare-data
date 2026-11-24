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
import {APPROVED_TRACTOR_PHOTOS,photoMatchesTractor} from "../src/lib/tractor-photos.ts";
import {matchesPhotoFileModel} from "./photo-model-identity.mjs";
import {matchesManufacturerPhotoAlias,manufacturerPhotoAlias} from "./photo-model-aliases.mjs";

export const MAX_REQUESTS=12;
export const PUBLIC_REPORT_DIR=resolve("./photo-discovery-report");
const API="https://api.openverse.org/v1/images/";
const PRIORITY=["McCormick","Sonalika","TYM","Mahindra","Swaraj","Steyr","Valtra","Zetor","Antonio Carraro","Belarus","Agrale","Kioti"];
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"");
export const key=r=>norm(r.brand)+"|"+norm(r.model);
function missingInventory(records,approved){
 if(!Array.isArray(records)||!records.length||records.some(r=>r.status!=="published"||!r.brand||!r.model||!r.pageUrl||!r.tractor_id||r.error)) throw Error("Incomplete or non-public input: refuse cross-platform research");
 if(!Array.isArray(approved))throw Error("Unsafe batch settings");
 // Photo identity is sometimes variant-scoped (tractorId), never just a
 // brand+model string. A photographed TYM T3048/F50CHN must not cause the
 // photo-less T3048/F50 and F50CN entries to be skipped from research.
 const unique=new Map(),missingPublishedIds=new Set(),seenIds=new Map();
 for(const r of records){
  const k=key(r), id=String(r.tractor_id);
  const prior=seenIds.get(id);
  if(prior && prior!==k)throw Error("Published tractor_id reused by different model: refuse photo research");
  seenIds.set(id,k);
  if(approved.some(p=>photoMatchesTractor(p,{tractor_id:id,brand_name:r.brand,model_name:r.model})))continue;
  missingPublishedIds.add(id);
  if(!unique.has(k))unique.set(k,{brand:r.brand,model:r.model,missingTractorIds:[]});
  if(!unique.get(k).missingTractorIds.includes(id))unique.get(k).missingTractorIds.push(id);
 }
 const missing=[...unique.values()].sort((a,b)=>{
 const ap=PRIORITY.indexOf(a.brand),bp=PRIORITY.indexOf(b.brand);
 return (ap<0?99:ap)-(bp<0?99:bp)||a.brand.localeCompare(b.brand)||a.model.localeCompare(b.model);
 });
 return {missing,missingPublishedRecords:missingPublishedIds.size};
}
function rotateMissing(inventory,index,limit){
 if(!Number.isSafeInteger(index)||index<0||!Number.isInteger(limit)||limit<1||limit>MAX_REQUESTS)throw Error("Unsafe batch settings");
 const {missing,missingPublishedRecords}=inventory;
 if(!missing.length)return {missing:0,missingPublishedRecords:0,selected:[],offset:0};
 // Reduce before multiplying so even a large valid rotation index stays safe.
 const offset=((index%missing.length)*limit)%missing.length;
 return {missing:missing.length,missingPublishedRecords,
  offset,selected:[...missing,...missing].slice(offset,offset+Math.min(limit,missing.length))};
}
export function selectPublishedMissing(records,approved=APPROVED_TRACTOR_PHOTOS,{index=0,limit=MAX_REQUESTS}={}){
 return rotateMissing(missingInventory(records,approved),index,limit);
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
 const matches=value=>matchesPhotoFileModel(brand,model,value)||matchesManufacturerPhotoAlias(brand,model,value);
 const tags=Array.isArray(item.tags)?item.tags.slice(0,40).map(t=>typeof t?.name==="string"?t.name.slice(0,120):"").filter(Boolean):[];
 const evidence=matches(item.title)?"title":matches(tags.join(" "))?"tags":null;
 if(!evidence)return null;
 return {brand,model,title:item.title.slice(0,250),
  source,metadata_match:evidence,creator:String(item.creator||"").slice(0,160)||null,
  license:val,license_url:license,source_page_url:landing,
  exact_visual_model_identity_verified:false,original_author_rights_verified:false,
  allowed_to_publish:false,review_status:"external_provider_review_needed"};
}
export async function researchIndependentSources(records,{fetchFn=fetch,approved=APPROVED_TRACTOR_PHOTOS,index=0,limit=MAX_REQUESTS,delayFn=sleep}={}){
 const inventory=missingInventory(records,approved);
 const selection=rotateMissing(inventory,index,limit);
 const missingByBrand=new Map();
 for(const row of inventory.missing){
  if(!missingByBrand.has(norm(row.brand)))missingByBrand.set(norm(row.brand),[]);
  missingByBrand.get(norm(row.brand)).push(row);
 }
 const candidatesByTarget=new Map();
 const report={generated_at:new Date().toISOString(),status:"complete",provider:"Openverse",
  scopes:["flickr","europeana"],read_only:true,source:"published sitemap only",
  missing_unique_pairs:selection.missing,
  missing_published_variant_records:selection.missingPublishedRecords,
  rotation_offset:selection.offset,
  query_budget:limit,queries_sent:0,rate_limited:false,models:[],candidates:[],
  cross_model_candidates:0,matched_model_pairs:0,
  note:"Aggregator matches are untrusted leads, never photo publication approvals."};
 for(const item of selection.selected){
  const u=new URL(API);
  // Broad discoverability with a separate exact title-only model gate below.
  const alias=manufacturerPhotoAlias(item.brand,item.model);
  u.searchParams.set("q",item.brand+" "+(alias||item.model));
  u.searchParams.set("source","flickr,europeana");
  u.searchParams.set("license","by,by-sa,cc0");
  u.searchParams.set("page_size","20");
  const url=u.toString();
  if(new URL(url).origin!=="https://api.openverse.org")throw Error("Openverse host changed");
  let response;
  try{
    // Count attempts even when transport fails; never hide request usage.
    report.queries_sent++;
    response=await fetchFn(url,{signal:AbortSignal.timeout(18000),headers:{Accept:"application/json","User-Agent":"TractorVS-OpenLicenseResearch/1.0 (nonpublishing)"}});
    if(response.status===429){report.status="rate_limited";report.rate_limited=true;report.models.push({...item,status:429,leads:0});break;}
    if(response.status!==200)throw Error("Openverse returned HTTP "+response.status);
    if(!String(response.headers?.get("content-type")||"").includes("application/json"))throw Error("Openverse unexpected response type");
    const body=await response.json();
    if(!Array.isArray(body?.results))throw Error("Openverse results absent");
    // One provider response can contain several models of the same brand.
    // Reuse all returned metadata against every missing model of that brand,
    // including models not selected in today's 12-query rotation.
    // A title/tag match remains an unapproved lead, never a variant match.
    const results=body.results.slice(0,20);
    let direct=0,cross=0;
    for(const target of missingByBrand.get(norm(item.brand))||[]){
      const targetKey=key(target),queryKey=key(item);
      const leads=results.map(x=>classifyOpenverseResult(x,target.brand,target.model)).filter(Boolean);
      const matches=[...new Map(leads.map(lead=>[lead.source_page_url,lead])).values()]
       .sort((a,b)=>Number(b.metadata_match==="title")-Number(a.metadata_match==="title")).slice(0,7);
      if(!matches.length)continue;
      if(targetKey===queryKey)direct=matches.length;else cross+=matches.length;
      if(!candidatesByTarget.has(targetKey))candidatesByTarget.set(targetKey,new Map());
      const saved=candidatesByTarget.get(targetKey);
      for(const lead of matches){
       const previous=saved.get(lead.source_page_url);
       const candidate={...lead,missingTractorIds:target.missingTractorIds,
        discovered_by_model:item.model,cross_model_discovery:targetKey!==queryKey};
       if(!previous|| (previous.metadata_match!=="title"&&candidate.metadata_match==="title")||
         (previous.cross_model_discovery&&!candidate.cross_model_discovery&&previous.metadata_match===candidate.metadata_match))
        saved.set(lead.source_page_url,candidate);
      }
    }
    report.models.push({...item,status:200,leads:direct,cross_model_leads:cross});
  }catch(e){report.status="partial";report.models.push({...item,status:"error",reason:String(e?.message||e).slice(0,160),leads:0});}
  await delayFn(600);
 }
 // Cap review workload per target across all responses, not merely per query.
 for(const saved of candidatesByTarget.values()){
  const ranked=[...saved.values()].sort((a,b)=>Number(b.metadata_match==="title")-Number(a.metadata_match==="title")||
   Number(a.cross_model_discovery)-Number(b.cross_model_discovery)||a.source_page_url.localeCompare(b.source_page_url));
  report.candidates.push(...ranked.slice(0,7));
 }
 report.cross_model_candidates=report.candidates.filter(x=>x.cross_model_discovery).length;
 report.matched_model_pairs=new Set(report.candidates.map(key)).size;
 return report;
}
export async function main(){
 const data=JSON.parse(await readFile(PUBLIC_REPORT_DIR+"/published-model-inventory.json","utf8"));
 const dateIndex=Math.floor(Date.now()/86400000);
 const result=await researchIndependentSources(data,{index:dateIndex,limit:MAX_REQUESTS});
 await mkdir(PUBLIC_REPORT_DIR,{recursive:true});
 await writeFile(PUBLIC_REPORT_DIR+"/openverse-independent-provider-review.json",JSON.stringify(result,null,2)+"\n");
 console.log("TRACTORVS_OPENVERSE_READONLY "+JSON.stringify({status:result.status,queries:result.queries_sent,
 missingUniquePairs:result.missing_unique_pairs,
 missingPublishedVariants:result.missing_published_variant_records,
 candidateCount:result.candidates.length,crossModelCandidates:result.cross_model_candidates,
 matchedModelPairs:result.matched_model_pairs,
 providers:result.scopes,publicationCount:0,rateLimited:result.rate_limited}));
 // API quota/source failures remain an explicit failure in this independent
 // research lane. The Commons gate stays separate; never label partial as complete.
 if(result.status!=="complete")process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
