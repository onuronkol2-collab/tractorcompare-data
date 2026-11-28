import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fetchCommonsJson} from "./photo-commons-http.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
// Bounded single-run review, NOT production assets and NOT publication approval.
const candidates=[
  {
    "title": "File:Hattat B 3105, Agritechnica 2023, Hanover (P1160245).jpg",
    "targets": [
      "5b745a3d-b5f6-4635-b90a-b77c61709cfe"
    ],
    "hold": "Exact B 3105 caption; verify Stage V ROPS vs cab, badge and source rights."
  },
  {
    "title": "File:Hattat B3105 Agritechnica 2023 (DSC04248).jpg",
    "targets": [
      "5b745a3d-b5f6-4635-b90a-b77c61709cfe"
    ],
    "hold": "Alternative front view; same target. Prefer one good primary photo, not duplicate coverage."
  },
  {
    "title": "File:TAFE 7515 Cab Agritechnica 2023 (DSC06665).jpg",
    "targets": [
      "2009a1ab-5c09-4484-8356-0ce5b957ae27"
    ],
    "hold": "7515 CAB vs Advanced equipment, require OEM proof and only representative same model scope."
  },
  {
    "title": "File:Eko-Las - Valtra N155 - 05.09.2025 13-24-29.jpg",
    "targets": [
      "d0e4b7ae-d357-4d19-bf98-9c42faf71ca3"
    ],
    "hold": "N155 vs N155e is not automatically identical; confirm badge and EcoPower identity."
  },
  {
    "title": "File:Tractors in Afghanistan.jpg",
    "targets": [
      "5c47fdb3-0794-4bce-b0c6-f7110dacc132"
    ],
    "hold": "Belarus 512 category only; group shot, require unambiguous individual model and public domain or compatible rights."
  },
  {
    "title": "File:Solis 50.jpg",
    "targets": [
      "c7ce4206-cf30-405e-9de1-ec6491dda11f",
      "6ecbbd12-b0fd-40e6-a9bf-1c8ea7fa3a8d"
    ],
    "hold": "One retry after earlier original mismatch. Verify actual 2WD or 4WD; never both."
  },
  {
    "title": "File:Same Dorado 90.4 mit Agrar Swissline 7000.jpg",
    "targets": [
      "f3ebdbe2-40bd-85ac-8237-40a83e4902e4"
    ],
    "hold": "2020 source; Dorado 90.4 vs Natural 90.4 exact model/trim not established. Require evidence, otherwise reject."
  }
];
const dir="hattat-tafe-valtra-photo-review-20261125";
await mkdir(dir,{recursive:true});
const report={generatedAt:new Date().toISOString(),publicationCount:0,allowedToPublish:false,entries:[],errors:[]};
try{
 const u=new URL("https://commons.wikimedia.org/w/api.php");
 for(const [k,v] of Object.entries({action:"query",format:"json",formatversion:"2",maxlag:"5",titles:candidates.map(c=>c.title).join("|"),prop:"imageinfo",iiprop:"url|size|mime|sha1|extmetadata"}))u.searchParams.set(k,v);
 const data=await fetchCommonsJson(u,{maxAttempts:1});
 const pages=data.query?.pages;
 if(!Array.isArray(pages))throw Error("Missing Commons pages");
 for(let i=0;i<candidates.length;i++){
  const c=candidates[i],page=pages.find(p=>p.title===c.title),info=page?.imageinfo?.[0];
  const row={...c,allowedToPublish:false,visualIdentityVerified:false,sourcePage:info?.descriptionurl||null,metadata:info||null};
  report.entries.push(row);
  if(!info||info.mime!=="image/jpeg"||!Number.isInteger(info.size)||info.size<1||info.size>25*1024*1024){report.errors.push(c.title+": unsupported or absent original");continue;}
  const m=info.extmetadata||{};
  if(!allowedPhotoReuseLicense(m.LicenseShortName?.value,m.LicenseUrl?.value)||!m.Artist?.value){report.errors.push(c.title+": no allowed rights metadata");continue;}
  const url=new URL(info.url);
  if(url.protocol!=="https:"||url.hostname!=="upload.wikimedia.org"||!url.pathname.startsWith("/wikipedia/commons/")||url.username||url.password||url.port){report.errors.push(c.title+": invalid original origin");continue;}
  try {
  await new Promise(r=>setTimeout(r,1500));
  const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(45000),headers:{"User-Agent":"TractorVS/1.0 (https://tractorvs.com/; public photo rights research)",Accept:"image/jpeg"}});
  if(response.status===429||response.status===503){report.errors.push(c.title+": provider cooldown "+response.status+"; Retry-After "+(response.headers.get("retry-after")||"unspecified"));break;}
  if(!response.ok||!/^image\/jpeg\b/i.test(response.headers.get("content-type")||"")){report.errors.push(c.title+": original HTTP or MIME failure "+response.status);continue;}
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length!==info.size||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217){report.errors.push(c.title+": original size or JPEG marker mismatch");continue;}
  const sha1=createHash("sha1").update(bytes).digest("hex");
  if(info.sha1&&info.sha1!==sha1){report.errors.push(c.title+": source SHA1 mismatch");continue;}
  const file="candidate-"+(i+1)+".jpg";
  await writeFile(dir+"/"+file,bytes);
  Object.assign(row,{file,bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex"),sha1});
  }catch(e){report.errors.push(c.title+": "+String(e));}
 }
}catch(e){report.errors.push(String(e));}
await writeFile(dir+"/report.json",JSON.stringify(report,null,2)+"\n");
console.log("TRACTORVS_CURATED_PHOTO_REVIEW "+JSON.stringify({expected:candidates.length,reviewed:report.entries.length,downloaded:report.entries.filter(r=>r.file).length,errors:report.errors,publicationCount:0}));
if(report.errors.length||report.entries.length!==candidates.length)process.exitCode=1;
