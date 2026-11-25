import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fetchCommonsJson} from "./photo-commons-http.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
// Bounded single-run review, NOT production assets and NOT publication approval.
const candidates=[
  {
    "title": "File:IRUM Tagro 102 Agritechnica 2019 - Front and right side.jpg",
    "targets": [
      "5bd6c24b-48dc-4ff5-beed-6c6196098604"
    ],
    "hold": "Confirm photographed model and 2019 versus Stage V generation; representative only if appropriate."
  },
  {
    "title": "File:Lindner Lintrac 160 LDrive Agritechnica 2025 (DSC08766).jpg",
    "targets": [
      "7999a853-ec41-4c44-9f1d-2fa326713a81"
    ],
    "hold": "Confirm model badge and whole tractor; representative configuration."
  },
  {
    "title": "File:Lindner Lintrac 160 LDrive Agritechnica 2025 (DSC08778).jpg",
    "targets": [
      "7999a853-ec41-4c44-9f1d-2fa326713a81"
    ],
    "hold": "Rear angle, secondary only; confirm identity and visual quality."
  },
  {
    "title": "File:BB-Umwelttechnik Clementer 330 HR Öko-Feldtage 2025 (DSC02082).jpg",
    "targets": [
      "11f9778b-cf7c-4a66-af26-138dcebd54b0"
    ],
    "hold": "Caption names towing tractor; require clearly visible whole Lintrac 115 LS and model identity; reject if implement dominates."
  },
  {
    "title": "File:Lindner Lintrac 95 LS Alpin Agritechnica 2023 (DSC05164).jpg",
    "targets": [
      "092125c4-ef05-44ac-a2b3-9c653dda01f4"
    ],
    "hold": "Alpin configuration differs; verify whether representative base model use permitted; never claim exact configuration."
  },
  {
    "title": "File:Eko-Las - Antonio Carraro Tigre 3800 - 05.09.2025 12-42-28.jpg",
    "targets": [
      "3872ab21-af50-417c-8b98-fa5f0de71c01"
    ],
    "hold": "Require exact Tigre 3800 F badge or manufacturer-supported identity; reject TTR/HST or different suffix."
  }
];
const dir="curated-photo-review-20261125";
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
 }
}catch(e){report.errors.push(String(e));}
await writeFile(dir+"/report.json",JSON.stringify(report,null,2)+"\n");
console.log("TRACTORVS_CURATED_PHOTO_REVIEW "+JSON.stringify({expected:candidates.length,reviewed:report.entries.length,downloaded:report.entries.filter(r=>r.file).length,errors:report.errors,publicationCount:0}));
if(report.errors.length||report.entries.length!==candidates.length)process.exitCode=1;
