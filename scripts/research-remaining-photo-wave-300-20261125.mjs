// Evidence-only: scope from archived public sitemap, current UUID photo registry.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {APPROVED_TRACTOR_PHOTOS,photoMatchesTractor} from "../site/src/lib/tractor-photos.ts";
import {matchesPhotoFileModel} from "../site/scripts/photo-model-identity.mjs";
import {matchesManufacturerPhotoAlias,manufacturerPhotoAlias} from "../site/scripts/photo-model-aliases.mjs";
import {allowedPhotoReuseLicense} from "../site/scripts/photo-license-check.mjs";
import {fetchCommonsJson,CommonsCooldownError} from "../site/scripts/photo-commons-http.mjs";
const root="bulk-photo-wave-evidence",archive="prior-photo-research";
await mkdir(root+"/originals",{recursive:true});
const prior=JSON.parse(await readFile(archive+"/report.json","utf8"));
if(prior.runStatus!=="complete"||prior.models.some(r=>r.status!=="published"||!r.tractor_id||!r.brand||!r.model))throw Error("No verified public archive");
const unique=[...new Map(prior.models.map(r=>[r.tractor_id,r])).values()];
// #731/#735 production-confirmed first-photo UUID; branch registry predates this release.
const confirmedLater=new Set(["20e382ea-5464-4128-a15a-b7bc304ef01f"]);
const missing=unique.filter(r=>!confirmedLater.has(r.tractor_id)&&!APPROVED_TRACTOR_PHOTOS.some(p=>photoMatchesTractor(p,{tractor_id:r.tractor_id,brand_name:r.brand,model_name:r.model})));
const previous=JSON.parse(await readFile("previous-wave/report.json","utf8")); const second=JSON.parse(await readFile("second-wave/report.json","utf8")); const visited=new Set([...previous.selectedModels,...second.selectedModels].map(r=>r.tractor_id));
const priorities=["Yanmar","Mahindra","Sonalika","Swaraj","TYM","McCormick","Kioti","Agrale","LS Tractor","Iseki","Solis"];
// New discovery lane: enumerate actual event collections rather than repeat empty brand queries.
const direct=[]; // Previously published Başak 5075 wave must not be repeated.
const missingIds=new Set(missing.map(r=>r.tractor_id));
const targets=missing;
const hasPrior=[];
const report={generatedAt:new Date().toISOString(),scope:"Archived public sitemap model identities checked against current registry; not full live catalogue",sourceArchive:14994831046,mode:"nested category discovery; previously scanned root files excluded; missing UUIDs only; #731 excluded; branch registry must be rechecked against main before promotion",publicModelCount:unique.length,missingModelCount:missing.length,selectedModels:targets.map(({tractor_id,brand,model,variant})=>({tractor_id,brand,model,variant})),candidateCount:0,downloaded:0,publicationCount:0,allowedToPublish:false,errors:[],queries:[],entries:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const deadline=Date.now()+12*60*1000;
const withinBudget=()=>Date.now()<deadline;
const strip=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
const normalizeTitle=t=>{try{return decodeURIComponent(String(t)).replace(/_/g," ").replace(/^.*\/wiki\/File:/i,"File:").trim().toLowerCase()}catch{return ""}};
const registrySources=new Set(APPROVED_TRACTOR_PHOTOS.map(p=>normalizeTitle(p.sourcePage)));
const leads=new Map();
function add(title,rows,kind){
 if(!title?.startsWith("File:")||registrySources.has(normalizeTitle(title)))return;
 if(!/\.jpe?g$/i.test(title)||title.length>230)return;
 const k=normalizeTitle(title);
 if(!leads.has(k))leads.set(k,{title,targets:[],kinds:[]});
 const l=leads.get(k);
 for(const row of rows)if(!l.targets.some(t=>t.tractor_id===row.tractor_id))l.targets.push({tractor_id:row.tractor_id,brand:row.brand,model:row.model,variant:row.variant});
 if(!l.kinds.includes(kind))l.kinds.push(kind);
}
const match=(r,t)=>matchesPhotoFileModel(r.brand,r.model,t)||matchesManufacturerPhotoAlias(r.brand,r.model,t);
// Existing known rejected files are never silently rediscovered.
const held=new Set(["File:IRUM Tagro 102 Agritechnica 2019 - Front and right side.jpg","File:Solis 50.jpg","File:Tractors in Afghanistan.jpg","File:Eko-Las - Valtra N155 - 05.09.2025 13-24-29.jpg","File:Same Dorado 90.4 mit Agrar Swissline 7000.jpg","File:Sonalika Baagban DI-30Rx Tractor Left Front Coorg Feb24 A7C 09555.jpg"].map(normalizeTitle));
for(const row of [...(previous.entries||[]),...(second.entries||[])])held.add(normalizeTitle(row.title));
// Preserve user-rejected and retired rear views, and already staged files from the earlier wave.
for(const title of ["File:Lindner Lintrac 160 LDrive Agritechnica 2025 (DSC08778).jpg","File:TYM T25 Agritechnica 2025 (DSC04675).jpg","File:TYM T115 Agritechnica 2025 (DSC04663).jpg"])held.add(normalizeTitle(title));
for(const [brand,model,...titles] of direct){const rows=targets.filter(r=>r.brand===brand&&r.model.toUpperCase()===model.toUpperCase());if(!rows.length)continue;for(const name of titles){const title="File:"+name;if(!held.has(normalizeTitle(title)))add(title,rows,"indexed exact source page; visual inspection required");}}
let paused=false;
async function query(params){
 if(paused||!withinBudget())return null;
 await sleep(1600);
 const u=new URL("https://commons.wikimedia.org/w/api.php");
 for(const [k,v] of Object.entries({action:"query",format:"json",formatversion:"2",maxlag:"5",...params}))u.searchParams.set(k,String(v));
 try{return await fetchCommonsJson(u,{maxAttempts:1});}
 catch(e){report.errors.push({stage:"query",error:String(e)});if(e instanceof CommonsCooldownError)paused=true;return null}
}
// The collections below are indexed public event archives, not another brand keyword search.
// Keep the metadata/download phase within the same bounded provider budget.
const collections=[
 "Category:Agritechnica 2019",
 "Category:Farmtrac tractors in Germany",
 "Category:TYM tractors in Germany",
 "Category:TAFE tractors in Germany",
 "Category:Quality images of tractors in Germany",
 "Category:Tractors in Japan",
 "Category:Yanmar tractors in Japan",
 "Category:Iseki tractors",
 "Category:Tractors in India",
 "Category:Mahindra tractors in India",
 "Category:Swaraj tractors",
 "Category:Sonalika tractors",
 "Category:Mahindra tractors",
 "Category:Yanmar tractors",
 "Category:Valtra tractors in Germany",
 "Category:New Holland tractors in Germany",
 "Category:John Deere tractors in Germany"
];
const discoverUntil=Date.now()+Math.min(4*60*1000,Math.max(0,deadline-Date.now()-5*60*1000));
const attemptedTitles=new Set(prior.models.flatMap(r=>(r.candidates||[]).map(c=>normalizeTitle(c.fileTitle))));
// Previous run enumerated root files only: nested model/series categories were invisible.
// Discover subcategories first, then visit each distinct child with bounded breadth-first traversal.
const queue=collections.map(category=>({category,depth:0,root:true}));
const seenCategories=new Set(collections);
let nestedFiles=0,nestedCategories=0;
while(queue.length&&!paused&&withinBudget()&&Date.now()<discoverUntil){
 const {category,depth,root}=queue.shift();
 let continuation={};
 do{
  if(paused||!withinBudget()||Date.now()>=discoverUntil)break;
  const data=await query({list:"categorymembers",cmtitle:category,cmtype:root?"subcat":"file|subcat",cmlimit:500,...continuation});
  const members=data?.query?.categorymembers||[];
  report.queries.push({kind:root?"new subcategory discovery":"nested collection",category,depth,returned:members.length,completed:Boolean(data),continuation:Boolean(data?.continue)});
  const children=[];
  for(const item of members){
   if(item.ns===14&&depth<3&&item.title?.startsWith("Category:")&&!seenCategories.has(item.title)){
    seenCategories.add(item.title);children.push({category:item.title,depth:depth+1,root:false});nestedCategories++;
    continue;
   }
   if(item.ns!==6)continue;
   nestedFiles++;
   const key=normalizeTitle(item.title);
   if(held.has(key)||registrySources.has(key)||attemptedTitles.has(key))continue;
   const rows=targets.filter(r=>match(r,item.title));
   if(rows.length)add(item.title,rows,"new nested collection file title; actual image and rights review required");
  }
  // Model-specific categories first, rather than unrelated event infrastructure.
  children.sort((a,b)=>Number(targets.some(r=>match(r,b.category)))-Number(targets.some(r=>match(r,a.category)))||a.category.localeCompare(b.category));
  const exactChildren=children.filter(c=>targets.some(r=>match(r,c.category)));
  queue.unshift(...exactChildren);
  queue.push(...children.filter(c=>!exactChildren.includes(c)));
  continuation=data?.continue||null;
 }while(continuation);
}
report.nestedDiscovery={categoriesQueued:nestedCategories,filesExamined:nestedFiles,unvisitedCategories:queue.length,discoveryTimeLimitReached:Date.now()>=discoverUntil};

await writeFile(root+"/report.json",JSON.stringify(report,null,2));
const sorted=[...leads.values()].filter(x=>!held.has(normalizeTitle(x.title))).sort((a,b)=>Number(b.kinds.includes("archive"))-Number(a.kinds.includes("archive"))||a.targets.length-b.targets.length||a.title.localeCompare(b.title));
const selected=[],counts=new Map();
sorted.sort((a,b)=>Number(b.targets.some(t=>missingIds.has(t.tractor_id)))-Number(a.targets.some(t=>missingIds.has(t.tractor_id))));
// Give distinct missing UUIDs first choice, then retain the other unique leads.
for(const lead of sorted){if(lead.targets.some(r=>!counts.has(r.tractor_id))){selected.push(lead);for(const r of lead.targets)counts.set(r.tractor_id,1);}}
for(const lead of sorted)if(!selected.includes(lead))selected.push(lead);
report.candidateCount=sorted.length;report.metadataSelected=selected.length;
await writeFile(root+"/report.json",JSON.stringify(report,null,2));
const ready=[];
for(let i=0;i<selected.length&&!paused&&withinBudget();i+=15){
 const batch=selected.slice(i,i+15),data=await query({titles:batch.map(x=>x.title).join("|"),prop:"imageinfo",iiprop:"url|size|mime|sha1|extmetadata"});
 for(const page of data?.query?.pages||[]){
  const lead=batch.find(x=>normalizeTitle(x.title)===normalizeTitle(page.title));if(!lead)continue;
  const info=page.imageinfo?.[0],m=info?.extmetadata||{};
  const license=strip(m.LicenseShortName?.value),licenseUrl=strip(m.LicenseUrl?.value),photographer=strip(m.Artist?.value);
  const row={...lead,sourcePage:info?.descriptionurl||null,sourceUrl:info?.url||null,license,licenseUrl,photographer,description:strip(m.ImageDescription?.value).slice(0,1500),credit:strip(m.Credit?.value).slice(0,600),restrictions:strip(m.Restrictions?.value).slice(0,600),originalSha1:info?.sha1||null,originalBytes:info?.size||null,width:info?.width||null,height:info?.height||null,allowedToPublish:false,visualIdentityVerified:false};
  report.entries.push(row);
  if(!info||info.mime!=="image/jpeg"||!allowedPhotoReuseLicense(license,licenseUrl)||!photographer||row.restrictions||!Number.isInteger(info.size)||info.size<1||info.size>25*1024*1024||!info.sha1){row.error="metadata, rights or original unsupported";continue}
  let u;try{u=new URL(info.url)}catch{row.error="invalid original URL";continue}
  if(u.protocol!=="https:"||u.hostname!=="upload.wikimedia.org"||!u.pathname.startsWith("/wikipedia/commons/")||u.username||u.password||u.port){row.error="invalid origin";continue}
  u.search="";u.hash="";row.sourceUrl=u.toString();ready.push(row);
 }
}
const shaSeen=new Set();
for(const row of ready){
 if(paused||!withinBudget())break;
 try{
  await sleep(1600);
  const res=await fetch(row.sourceUrl,{redirect:"error",signal:AbortSignal.timeout(60000),headers:{"User-Agent":"TractorVS/1.0 (https://tractorvs.com/; public photo rights research)",Accept:"image/jpeg"}});
  if([429,503].includes(res.status)||res.headers.get("retry-after")){paused=true;throw Error("Provider cooldown "+res.status+" "+res.headers.get("retry-after"))}
  if(!res.ok||!/^image\/jpeg\b/i.test(res.headers.get("content-type")||""))throw Error("HTTP/MIME "+res.status);
  const bytes=Buffer.from(await res.arrayBuffer()),sha1=createHash("sha1").update(bytes).digest("hex"),sha256=createHash("sha256").update(bytes).digest("hex");
  const apiSha=String(row.originalSha1).toLowerCase();
  const base36=BigInt("0x"+sha1).toString(36).padStart(31,"0");
  if(bytes.length!==row.originalBytes||(apiSha!==sha1&&apiSha!==base36)||bytes[0]!==255||bytes[1]!==216)throw Error("Source byte count, SHA1 or SOI mismatch");
  if(shaSeen.has(sha256))throw Error("duplicate original SHA256");
  shaSeen.add(sha256);
  const name="candidate-"+String(report.downloaded+1).padStart(3,"0")+".jpg";
  await writeFile(root+"/originals/"+name,bytes);Object.assign(row,{file:name,verifiedSha1:sha1,originalSha256:sha256});report.downloaded++;
 }catch(e){row.error=String(e);report.errors.push({stage:"original",title:row.title,error:String(e)})}
 await writeFile(root+"/report.json",JSON.stringify(report,null,2));
}
report.providerPaused=paused;report.timeBudgetReached=!withinBudget();report.originalsValidated=report.downloaded;
await writeFile(root+"/report.json",JSON.stringify(report,null,2));
console.log("BULK_PHOTO_WAVE "+JSON.stringify({publicModels:unique.length,missing:missing.length,selected:targets.length,archiveLeads:hasPrior.length,queries:report.queries.length,nestedDiscovery:report.nestedDiscovery,matchedFiles:report.candidateCount,metadataSelected:selected.length,downloaded:report.downloaded,errors:report.errors.length,providerPaused:paused,publicationCount:0}));
if(paused||report.errors.length||report.timeBudgetReached)process.exitCode=1;
