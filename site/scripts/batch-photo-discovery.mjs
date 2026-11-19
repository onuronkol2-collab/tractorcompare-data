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
const USER_AGENT="TractorVS/1.0 (tractorvs.com; public photo license research)";
const REQUEST_LIMIT=4;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const stripTags=s=>String(s||"").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').trim();
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .replace(/\u0131/g,"i").replace(/[^a-z0-9]+/g,"");
async function get(url,asJson=false){
  let last;
  for(let i=0;i<3;i++){
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(22000),
        headers:{"User-Agent":USER_AGENT,Accept:asJson?"application/json":"text/html,application/xml"}});
      if(!response.ok)throw Error("HTTP "+response.status+" "+url);
      return asJson?await response.json():await response.text();
    }catch(e){last=e;if(i<2)await delay((i+1)*550);}
  }
  throw last;
}
function xmlLocs(doc){return [...doc.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(m=>m[1].replaceAll("&amp;","&"));}
async function publicInventory(){
  const index=await get(new URL("/sitemap-index.xml",ORIGIN));
  const sitemaps=xmlLocs(index);if(!sitemaps.length)throw Error("No sitemap index children");
  const pages=(await Promise.all(sitemaps.map(get))).flatMap(xmlLocs);
  const detail=pages.filter(link=>/^\/tractors\/[^/]+\/$/.test(new URL(link).pathname));
  const results=[];
  for(let i=0;i<detail.length;i+=REQUEST_LIMIT){
    const batch=detail.slice(i,i+REQUEST_LIMIT);
    const records=await Promise.all(batch.map(async link=>{
      try{
        const html=await get(link);
        const scripts=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
        for(const [,raw] of scripts){
          try{
            const data=JSON.parse(raw);
            const item=(data["@graph"]||[]).find(x=>x["@type"]==="Thing" && x.identifier);
            if(item){
              const name=stripTags(item.name||"").trim();
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
const supportedLicense=(license,link)=>{
  const label=String(license||"").toLowerCase();
  const u=String(link||"").toLowerCase();
  return (/\bcc0\b|cc by(?:-sa)?\b|public domain/i.test(label) ||
    /creativecommons\.org\/(?:licenses\/by(?:-sa)?\/|publicdomain\/zero\/)/.test(u))
    && !/nc|nd|noncommercial|no derivatives/.test(label);
};
function sameModelTitle(brand,model,title){
  const file=norm(title.replace(/^File:/i,""));
  const brandTokens=brand.toLowerCase().replace(/[-_]/g," ").split(/\s+/).filter(t=>t.length>1);
  const brandGood=brandTokens.every(x=>file.includes(norm(x)));
  const m=norm(model);
  if(!brandGood||m.length<2)return false;
  const number=String(model).match(/[0-9]+(?:[.\-][0-9a-z]+)*/i)?.[0]||"";
  if(number && !file.includes(norm(number)))return false;
  return file.includes(m);
}
async function commonsCandidates(record){
  const q=record.brand+" "+record.model;
  const url=new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action","query");
  url.searchParams.set("format","json");
  url.searchParams.set("formatversion","2");
  url.searchParams.set("generator","search");
  url.searchParams.set("gsrsearch","intitle:"+q);
  url.searchParams.set("gsrnamespace","6");
  url.searchParams.set("gsrlimit","15");
  url.searchParams.set("prop","imageinfo");
  url.searchParams.set("iiprop","url|size|mime|extmetadata");
  url.searchParams.set("iiurlwidth","960");
  const body=await get(url.toString(),true);
  const pages=Array.isArray(body.query?.pages)?body.query.pages:[];
  const results=pages.map(page=>{
    const info=page.imageinfo?.[0]||{};
    const meta=info.extmetadata||{};
    const text=(key)=>stripTags(meta[key]?.value||"");
    const license=text("LicenseShortName")||text("UsageTerms");
    const licenseUrl=text("LicenseUrl");
    const artist=text("Artist")||text("Credit");
    const matching=sameModelTitle(record.brand,record.model,page.title||"");
    const permitted=supportedLicense(license,licenseUrl);
    return {fileTitle:page.title,url:info.url||null,
      thumbnail:info.thumburl||null,
      descriptionUrl:info.descriptionurl||null,
      mime:info.mime||null,width:info.width||null,height:info.height||null,
      photographer:artist?.slice(0,250),license,licenseUrl,
      modelTextMatch:matching,reuseLicensePermitted:permitted,
      reviewStatus:matching&&permitted&&artist&&info.url?"human_review_required":"unverified"};
  }).filter(x=>x.modelTextMatch || x.reuseLicensePermitted).slice(0,12);
  results.sort((a,b)=>Number(b.modelTextMatch&&b.reuseLicensePermitted)-Number(a.modelTextMatch&&a.reuseLicensePermitted));
  return {search:q,matches:results.length,candidates:results};
}
async function main(){
  await mkdir(OUTPUT,{recursive:true});
  const publicRecords=await publicInventory();
  const source=process.env.TRACTOR_IMAGE_INVENTORY_FILE;
  let privateRecords=[];
  if(source){
    const input=JSON.parse(await readFile(source,"utf8"));
    if(!Array.isArray(input))throw Error("Private inventory must be a JSON array");
    privateRecords=input.filter(x=>x?.brand&&x?.model).map(x=>({
      ...x,status:x.status==="published"?"published":"draft",pageUrl:null}));
  }
  const identity=new Map();
  for(const item of [...publicRecords,...privateRecords]){
    if(!item.brand||!item.model)continue;
    const key=norm(item.brand)+"|"+norm(item.model);
    const current=identity.get(key);
    if(!current)identity.set(key,{brand:item.brand,model:item.model,
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
  const reviewed=[];
  for(let start=0;start<entries.length;start+=REQUEST_LIMIT){
    const result=await Promise.all(entries.slice(start,start+REQUEST_LIMIT).map(async entry=>{
      try{return {...entry,...await commonsCandidates(entry)};}
      catch(e){return {...entry,error:String(e),candidates:[]};}
    }));
    reviewed.push(...result);
    for(const entry of result){
      const shortlist=entry.candidates.filter(x=>x.modelTextMatch&&x.reuseLicensePermitted);
      console.log("IMAGE_DISCOVERY "+JSON.stringify({brand:entry.brand,model:entry.model,
        status:entry.status,rightsClearedTitleCandidates:shortlist.length,
        file:shortlist[0]?.fileTitle||null,license:shortlist[0]?.license||null,
        error:entry.error||null}));
    }
  }
  const report={generatedAt:new Date().toISOString(),note:
    "Candidate discovery only. Photos are NOT published, uploaded, licensed by TractorVS, or identity-reviewed.",
    publicModelPages:publicRecords.length,optionalPrivateRecords:privateRecords.length,
    modelSearches:reviewed.length,models:reviewed};
  await writeFile(OUTPUT+"/report.json",JSON.stringify(report,null,2));
  await writeFile(OUTPUT+"/summary.csv","brand,model,status,license_title_candidates,search_error\n"+
    reviewed.map(r=>[r.brand,r.model,r.status,
      r.candidates.filter(c=>c.modelTextMatch&&c.reuseLicensePermitted).length,r.error||""]
      .map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n")+"\n");
  const candidates=reviewed.reduce((n,r)=>n+r.candidates.filter(c=>c.modelTextMatch&&c.reuseLicensePermitted).length,0);
  const failed=reviewed.filter(r=>r.error).length;
  console.log("IMAGE_DISCOVERY_SUMMARY "+JSON.stringify({modelSearches:reviewed.length,
    rightsClearedTitleCandidates:candidates,searchFailures:failed,output:OUTPUT}));
  if(!reviewed.length||publicRecords.some(x=>x.error))process.exitCode=1;
}
main().catch(e=>{console.error("IMAGE_DISCOVERY_ERROR "+String(e));process.exitCode=1;});
