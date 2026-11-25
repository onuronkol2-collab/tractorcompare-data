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
const missing=unique.filter(r=>!APPROVED_TRACTOR_PHOTOS.some(p=>photoMatchesTractor(p,{tractor_id:r.tractor_id,brand_name:r.brand,model_name:r.model})));
const previous=JSON.parse(await readFile("previous-wave/report.json","utf8")); const second=JSON.parse(await readFile("second-wave/report.json","utf8")); const visited=new Set([...previous.selectedModels,...second.selectedModels].map(r=>r.tractor_id));
const priorities=["Yanmar","Mahindra","Sonalika","Swaraj","TYM","McCormick","Kioti","Agrale","LS Tractor","Iseki","Solis"];
// New direct source-page leads discovered by indexed web search, not the exhausted archive query.
const direct=[
  [
    "Belarus",
    "1221.3",
    "Belarus MTZ-1221 3 tractor.jpg",
    "Belarus 1221.3 (open day 2017) 1.jpg"
  ],
  [
    "Belarus",
    "952",
    "Belarus 952.jpg",
    "Belarus 952 (new).jpg"
  ],
  [
    "Belarus",
    "952.3",
    "Belarus 952.3 Tractor in Bucharest 2011.jpg"
  ],
  [
    "Belarus",
    "952.4",
    "Belarus 952.4 tractor.jpg",
    "Belarus 952.4 tractor 2.jpg"
  ],
  [
    "Belarus",
    "920.2",
    "Belarus 920.2 tractor.jpg"
  ],
  [
    "Belarus",
    "1220.4",
    "Belarus 1220.4.jpg"
  ],
  [
    "Belarus",
    "892.2",
    "Belarus 892.2, 2025 Dunapataj.jpg",
    "Космос, МТЗ-892.2 на Желтоксане.jpg"
  ],
  [
    "Belarus",
    "922.3",
    "Алматы, Беларус-922.3 на Кулымбетова-Бруно (1).jpg"
  ],
  [
    "Belarus",
    "923.4",
    "Belarus 923.4 (open day 2017) 2.jpg"
  ],
  [
    "Belarus",
    "510",
    "Belarus 510 tractor, Minsk Tractor Works.jpg",
    "Belarus 510 (open day 2017) 1.jpg"
  ],
  [
    "Belarus",
    "572",
    "Belazs MTZ 572.jpg"
  ],
  [
    "Steyr",
    "6240 ABSOLUT CVT",
    "Steyr Absolut 6240.jpg"
  ],
  [
    "Steyr",
    "4075 KOMPAKT",
    "Steyr 4075 Kompakt.jpg"
  ],
  [
    "Steyr",
    "4115 KOMPAKT",
    "Steyr Kompakt 4115.jpg"
  ],
  [
    "Steyr",
    "4105 KOMPAKT",
    "2018-06-28 (801) Steyr 4105 Kompakt in Kirchberg an der Pielach.jpg"
  ],
  [
    "Steyr",
    "4085 KOMPAKT",
    "Steyr 4085 Kompakti Ecotech.jpg"
  ],
  [
    "Steyr",
    "4095 KOMPAKT",
    "Steyr 4095 Kompakt mit Kuhn BRP28 Mulch- und Häckselgerät.jpg"
  ],
  [
    "Steyr",
    "6340 TERRUS CVT",
    "Steyr 6340 Terrus CVT Agritechnica 2023 (DSC04861).jpg"
  ],
  [
    "Steyr",
    "6200 IMPULS",
    "Steyr 6200 Impuls CVT Agritechnica 2025 (DSC03498).jpg"
  ],
  [
    "Steyr",
    "6280 ABSOLUT CVT",
    "Steyr 6280 Absolut CVT agra 2024 (DSC02603).jpg",
    "Steyr 6280 Absolut CVT Öko-Feldtage 2025 (DSC01877).jpg",
    "Steyr 6280 Absolut CVT Öko-Feldtage 2025 (DSC02133).jpg"
  ],
  [
    "Steyr",
    "6440 CERVUS CVT",
    "Steyr 6440 Cervus CVT Agritechnica 2025 (DSC04360).jpg",
    "Steyr 6440 Cervus CVT Agritechnica 2025 (DSC08437).jpg"
  ],
  [
    "Steyr",
    "4130 EXPERT CVT",
    "Steyr 4130 Expert CVT agra 2024 (DSC01621).jpg",
    "Steyr 4130 Expert CVT agra 2026 (DSC1525).jpg"
  ],
  [
    "Steyr",
    "4140 EXPERT CVT",
    "Steyr 4140 Expert CVT Agritechnica 2023 (DSC05407).jpg",
    "Steyr 4140 Expert CVT Kommunal Agritechnica 2025 (DSC05835).jpg"
  ]
];
const missingIds=new Set(missing.map(r=>r.tractor_id));
const targets=missing.filter(r=>direct.some(([brand,model])=>r.brand===brand&&r.model.toUpperCase()===model.toUpperCase()));
const hasPrior=[];
const report={generatedAt:new Date().toISOString(),scope:"Archived public sitemap model identities checked against current registry; not full live catalogue",sourceArchive:14994831046,mode:"new exact source pages for currently missing Belarus and Steyr models",publicModelCount:unique.length,missingModelCount:missing.length,selectedModels:targets.map(({tractor_id,brand,model,variant})=>({tractor_id,brand,model,variant})),candidateCount:0,downloaded:0,publicationCount:0,allowedToPublish:false,errors:[],queries:[],entries:[]};
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
// Two discovery waves returned zero new leads. Do not repeat those searches.
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
console.log("BULK_PHOTO_WAVE "+JSON.stringify({publicModels:unique.length,missing:missing.length,selected:targets.length,archiveLeads:hasPrior.length,queries:report.queries.length,matchedFiles:report.candidateCount,metadataSelected:selected.length,downloaded:report.downloaded,errors:report.errors.length,providerPaused:paused,publicationCount:0}));
if(paused||report.errors.length||report.timeBudgetReached)process.exitCode=1;
