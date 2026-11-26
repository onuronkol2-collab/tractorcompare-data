import {fetchIndexedSitemapPages} from "./photo-sitemap-fetch.mjs";
import {indexArchivePhotoCandidates,archiveCandidatesForModel} from "./photo-archive-candidate-index.mjs";
import {normalizePrivatePhotoResearchRows} from "./photo-private-inventory.mjs";
/**
 * One-pass, read-only catalogue image discovery.
 * Pulls public LIVE model inventory from the current published sitemap;
 * matches Wikimedia Commons file candidates and records license evidence.
 * Not a publisher: photo identity and rights are separately reviewed.
 *
 * Optional input JSON (e.g. authorized private Supabase export):
 * TRACTOR_IMAGE_INVENTORY_FILE=/path/models.json containing
 * [{brand,model,variant,market,status,tractor_id},...].
 * Draft inventory is processed for private research but NEVER sent to the site.
 */
import {writeFile,readFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";

const ORIGIN=process.env.TRACTORVS_URL||"https://tractorvs.com";
const OUTPUT=resolve(process.env.TRACTOR_IMAGE_REPORT_DIR||"./photo-discovery-report");
const PRIVATE_OUTPUT=process.env.TRACTOR_IMAGE_PRIVATE_REPORT_DIR?resolve(process.env.TRACTOR_IMAGE_PRIVATE_REPORT_DIR):null;
const USER_AGENT="TractorVS/1.0 (tractorvs.com; public photo license research)";
const REQUEST_LIMIT=4;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// JSON-LD names are already text, not HTML. Preserve literal entity spellings.
const cleanName=s=>typeof s==="string"?s.replace(/\s+/g," ").trim():"";
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/\u0131/g,"i").replace(/[^a-z0-9]+/g,"");
async function get(url,asJson=false){
  let last;
  for(let i=0;i<3;i++){
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(22000),
        headers:{"User-Agent":USER_AGENT,Accept:asJson?"application/json":"text/html,application/xml"}});
      if(!response.ok)throw Error("HTTP "+response.status+" "+url);
      if(asJson && !/application\/(?:[a-z0-9.+-]*\+)?json(?:;|$)/i.test(response.headers.get("content-type")||""))
        throw Error("Research API returned non-JSON response for "+new URL(url).origin);
      return asJson?await response.json():await response.text();
    }catch(e){last=e;if(i<2)await delay((i+1)*550);}
  }
  throw last;
}
// Positional wrappers: Array.map must never turn an index into a JSON flag.
const getText=url=>get(url,false);
async function publicInventory(){
  const index=await getText(new URL("/sitemap-index.xml",ORIGIN));
  const pages=await fetchIndexedSitemapPages(index,getText,{origin:ORIGIN});
  const detail=pages.filter(link=>/^\/tractors\/[^/]+\/$/.test(new URL(link).pathname));
  const results=[];
  for(let i=0;i<detail.length;i+=REQUEST_LIMIT){
    const batch=detail.slice(i,i+REQUEST_LIMIT);
    const records=await Promise.all(batch.map(async link=>{
      try{
        const html=await getText(link);
        const scripts=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
        for(const [,raw] of scripts){
          try{
            const data=JSON.parse(raw);
            const item=(data["@graph"]||[]).find(x=>x["@type"]==="Thing" && x.identifier);
            if(item){
              const name=cleanName(item.name);
              const {brand,model}=splitBrandModel(name);
              return {brand,model,variant:item.disambiguatingDescription||null,
                status:"published",pageUrl:link,tractor_id:item.identifier};
            }
          }catch{}
        }
        throw Error("No published tractor Thing metadata");
      }catch(e){return {error:String(e),pageUrl:link};}
    }));
    results.push(...records);
  }
  return results;
}
/* Known brand prefixes prevent 'New Holland' vs 'New' false matches. */
const BRANDS=[
"Antonio Carraro","Lamborghini Trattori","Massey Ferguson","New Holland",
"John Deere","Deutz-Fahr","LS Tractor","Başak Traktör","Case IH",
"Kioti","Landini","McCormick","TYM","Belarus","Fendt","CLAAS",
"Tümosan","Kubota","Iseki","ArmaTrac","Mahindra","Versatile",
"SAME","TAFE","Swaraj","Agrale"
].sort((a,b)=>b.length-a.length);
function splitBrandModel(name){
  const brand=BRANDS.find(b=>norm(name.slice(0,b.length))===norm(b));
  if(brand)return {brand,model:name.slice(brand.length).trim()};
  const p=name.indexOf(" ");return p<0?{brand:name,model:""}:{brand:name.slice(0,p),model:name.slice(p+1)};
}


async function main(){
  await mkdir(OUTPUT,{recursive:true});
  // Acquire one consistent public inventory BEFORE the shared Commons brand
  // scan. All later stages use this same file, not separate snapshots.
  if(process.argv.includes("--inventory-only")){
    const records=await publicInventory();
    if(!records.length||records.some(x=>x.error))
      throw Error("Cannot seed photo research from incomplete published inventory");
    await writeFile(OUTPUT+"/published-model-inventory.json",JSON.stringify(records,null,2));
    console.log("IMAGE_PUBLIC_INVENTORY "+JSON.stringify({pages:records.length,
      uniqueBrandModelPairs:new Set(records.map(x=>norm(x.brand)+"|"+norm(x.model))).size}));
    return;
  }
  const publicRecords=JSON.parse(await readFile(OUTPUT+"/published-model-inventory.json","utf8"));
  if(!Array.isArray(publicRecords)||!publicRecords.length||publicRecords.some(x=>x.error))
    throw Error("Preflight published model inventory missing or incomplete");
  const source=process.env.TRACTOR_IMAGE_INVENTORY_FILE;
  let privateRecords=[];
  if(source){
    const input=JSON.parse(await readFile(source,"utf8"));
    // A private export is research-only, even if its source row says published.
    // Only live, canonical sitemap pages are authorized for public artifacts.
    privateRecords=normalizePrivatePhotoResearchRows(input);
  }
  if(privateRecords.length && (!PRIVATE_OUTPUT || PRIVATE_OUTPUT===OUTPUT || PRIVATE_OUTPUT.startsWith(OUTPUT+"/"))) {
    throw Error("Draft research requires a separate, non-artifact TRACTOR_IMAGE_PRIVATE_REPORT_DIR");
  }
  const identity=new Map();
  for(const item of [...publicRecords,...privateRecords]){
    if(!item.brand||!item.model)continue;
    const key=[item.tractor_id||"",norm(item.brand),norm(item.model),norm(item.variant||""),norm(item.market||""),String(item.model_year||item.year||""),item.status].join("|");
    const current=identity.get(key);
    if(!current)identity.set(key,{tractor_id:item.tractor_id||null,brand:item.brand,model:item.model,
      variant:item.variant||null,market:item.market||null,year:item.model_year||item.year||null,
      status:item.status,publicPages:item.pageUrl?[item.pageUrl]:[],
      variants:[item.variant].filter(Boolean)});
    else{
      if(item.status==="published")current.status="published";
      if(item.pageUrl)current.publicPages.push(item.pageUrl);
      if(item.variant&&!current.variants.includes(item.variant))current.variants.push(item.variant);
    }
  }
  const entries=[...identity.values()];
  console.log("IMAGE_INVENTORY "+JSON.stringify({publicModelPages:publicRecords.length,
    publicModelErrors:publicRecords.filter(x=>x.error).length,
    optionalDraftRows:privateRecords.length,uniqueModelSearches:entries.length}));
  // Read-only published catalogue cross-check against this run's brand-batched
  // Commons evidence. Do NOT repeat 388 individual API searches: the old
  // workflow triggered 210 HTTP 429 rate-limit failures in a single run.
  const archive=JSON.parse(await readFile(OUTPUT+"/public-image-candidates.json","utf8"));
  const archiveIndex=indexArchivePhotoCandidates(archive);
  const reviewed=entries.map(entry=>({...entry,
    ...archiveCandidatesForModel(archiveIndex,entry)}));
  for(const entry of reviewed.filter(x=>x.status==="published")){
    const shortlist=entry.candidates.filter(x=>x.modelTextMatch&&x.reuseLicensePermitted);
    console.log("IMAGE_DISCOVERY "+JSON.stringify({brand:entry.brand,model:entry.model,
      status:entry.status,rightsClearedTitleCandidates:shortlist.length,
      file:shortlist[0]?.fileTitle||null,license:shortlist[0]?.license||null,
      error:null,method:"same-run Wikimedia brand evidence; no per-model API query"}));
  }
  const publicReviewed=reviewed.filter(x=>x.status==="published");
  const draftReviewed=reviewed.filter(x=>x.status!=="published");
  if(draftReviewed.length){
    await mkdir(PRIVATE_OUTPUT,{recursive:true});
    await writeFile(PRIVATE_OUTPUT+"/draft-report.json",JSON.stringify({generatedAt:new Date().toISOString(),note:"PRIVATE DRAFT RESEARCH. DO NOT PUBLISH.",models:draftReviewed},null,2),{mode:0o600});
  }
  const report={generatedAt:new Date().toISOString(),
    runStatus: publicRecords.some(x=>x.error)||reviewed.some(x=>x.error)?"partial":"complete",note:
    "Same-run Wikimedia brand-title candidate reuse only; NOT exhaustive per-model Commons searching. Photos are NOT published, uploaded, licensed by TractorVS, or identity-reviewed.",
    researchMethod:"published pages cross-checked against same-run archival brand candidate evidence",
    publicModelPages:publicRecords.length,optionalPrivateRecords:privateRecords.length,
    modelSearches:publicReviewed.length,models:publicReviewed};
  await writeFile(OUTPUT+"/report.json",JSON.stringify(report,null,2));
  await writeFile(OUTPUT+"/summary.csv","brand,model,status,license_title_candidates,search_error\n"+
    publicReviewed.map(r=>[r.brand,r.model,r.status,
      r.candidates.filter(c=>c.modelTextMatch&&c.reuseLicensePermitted).length,r.error||""]
      .map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n")+"\n");
  const candidates=reviewed.reduce((n,r)=>n+r.candidates.filter(c=>c.modelTextMatch&&c.reuseLicensePermitted).length,0);
  const failed=reviewed.filter(r=>r.error).length;
  console.log("IMAGE_DISCOVERY_SUMMARY "+JSON.stringify({researchMethod:"same-run-brand-evidence",modelSearches:reviewed.length,
    rightsClearedTitleCandidates:candidates,searchFailures:failed,output:OUTPUT}));
  if(!publicReviewed.length||publicRecords.some(x=>x.error)||failed>0)process.exitCode=1;
}
main().catch(e=>{console.error("IMAGE_DISCOVERY_ERROR "+String(e));process.exitCode=1;});
