// Evidence-only: scope from archived public sitemap, current UUID photo registry.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {APPROVED_TRACTOR_PHOTOS,photoMatchesTractor} from "../src/lib/tractor-photos.ts";
import {matchesPhotoFileModel} from "./photo-model-identity.mjs";
import {matchesManufacturerPhotoAlias,manufacturerPhotoAlias} from "./photo-model-aliases.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
import {fetchCommonsJson,CommonsCooldownError} from "./photo-commons-http.mjs";
const root="bulk-photo-wave-evidence",archive="prior-photo-research";
await mkdir(root+"/originals",{recursive:true});
const prior=JSON.parse(await readFile(archive+"/report.json","utf8"));
if(prior.runStatus!=="complete"||prior.models.some(r=>r.status!=="published"||!r.tractor_id||!r.brand||!r.model))throw Error("No verified public archive");
const unique=[...new Map(prior.models.map(r=>[r.tractor_id,r])).values()];
const missing=unique.filter(r=>!APPROVED_TRACTOR_PHOTOS.some(p=>photoMatchesTractor(p,{tractor_id:r.tractor_id,brand_name:r.brand,model_name:r.model})));
const priorities=["Başak Traktör","Bobcat","Versatile","Valtra","Steyr","Zetor","Belarus","Hattat","TAFE","Mahindra","Yanmar","Solis","TYM","McCormick"];
const eligible=missing.filter(r=>priorities.includes(r.brand));
const ordered=eligible.sort((a,b)=>priorities.indexOf(a.brand)-priorities.indexOf(b.brand)||a.model.localeCompare(b.model));
const hasPrior=ordered.filter(r=>r.candidates?.length);
const targets=[...new Map([...hasPrior,...ordered].map(r=>[r.tractor_id,r])).values()].slice(0,100);
const report={generatedAt:new Date().toISOString(),scope:"Archived public sitemap model identities checked against current registry; not full live catalogue",sourceArchive:14994831046,publicModelCount:unique.length,missingModelCount:missing.length,selectedModels:targets.map(({tractor_id,brand,model,variant})=>({tractor_id,brand,model,variant})),candidateCount:0,downloaded:0,publicationCount:0,allowedToPublish:false,errors:[],queries:[],entries:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
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
for(const row of targets)for(const c of row.candidates||[])if(!held.has(normalizeTitle(c.fileTitle)))add(c.fileTitle,[row],"archive");
let paused=false;
async function query(params){
 if(paused)return null;
 await sleep(1600);
 const u=new URL("https://commons.wikimedia.org/w/api.php");
 for(const [k,v] of Object.entries({action:"query",format:"json",formatversion:"2",maxlag:"5",...params}))u.searchParams.set(k,String(v));
 try{return await fetchCommonsJson(u,{maxAttempts:1});}
 catch(e){report.errors.push({stage:"query",error:String(e)});if(e instanceof CommonsCooldownError)paused=true;return null}
}
const groups=new Map();
for(const row of targets){if(!groups.has(row.brand))groups.set(row.brand,[]);groups.get(row.brand).push(row)}
// Focused brand+model phrases search captions/description as well as titles, 4-8 models per query.
// Limit to 15 calls total; record actual queried UUIDs. No individual per-model request.
let budget=15;
for(const [brand,rows] of groups){
 if(paused||budget<=0)break;
 const brandTerm=brand==="Başak Traktör"?"Başak":brand;
 const clean=s=>String(s).replace(/["\\]/g,"").slice(0,70);
 const modelGroups=[...new Map(rows.map(r=>[r.model,r])).values()];
 for(let i=0;i<modelGroups.length&&budget>0&&!paused;i+=8){
  const selected=modelGroups.slice(i,i+8);
  const terms=selected.map(r=>'"'+clean(manufacturerPhotoAlias(brand,r.model)||r.model)+'"').join(" OR ");
  const srsearch='"'+clean(brandTerm)+'" ('+terms+')';
  budget--;
  const data=await query({list:"search",srsearch,srnamespace:6,srlimit:100});
  const result=data?.query?.search||[];
  report.queries.push({brand,models:selected.map(r=>r.model),srsearch,returned:result.length,completed:Boolean(data)});
  for(const item of result){
    const title=item.title;
    if(held.has(normalizeTitle(title)))continue;
    const matches=rows.filter(r=>match(r,title)||match(r,strip(item.snippet)));
    if(matches.length)add(title,matches,"focused title/caption search");
  }
 }
}
const sorted=[...leads.values()].filter(x=>!held.has(normalizeTitle(x.title))).sort((a,b)=>Number(b.kinds.includes("archive"))-Number(a.kinds.includes("archive"))||a.targets.length-b.targets.length||a.title.localeCompare(b.title));
const selected=[],counts=new Map();
for(const lead of sorted){
 if(selected.length>=65)break;
 if(lead.targets.every(r=>(counts.get(r.tractor_id)||0)>=2))continue;
 selected.push(lead);for(const r of lead.targets)counts.set(r.tractor_id,(counts.get(r.tractor_id)||0)+1);
}
report.candidateCount=sorted.length;report.metadataSelected=selected.length;
await writeFile(root+"/report.json",JSON.stringify(report,null,2));
const ready=[];
for(let i=0;i<selected.length&&!paused;i+=15){
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
 if(paused||report.downloaded>=50)break;
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
report.providerPaused=paused;report.originalsValidated=report.downloaded;
await writeFile(root+"/report.json",JSON.stringify(report,null,2));
console.log("BULK_PHOTO_WAVE "+JSON.stringify({publicModels:unique.length,missing:missing.length,selected:targets.length,archiveLeads:hasPrior.length,queries:report.queries.length,matchedFiles:report.candidateCount,metadataSelected:selected.length,downloaded:report.downloaded,errors:report.errors.length,providerPaused:paused,publicationCount:0}));
if(paused||report.errors.length)process.exitCode=1;
