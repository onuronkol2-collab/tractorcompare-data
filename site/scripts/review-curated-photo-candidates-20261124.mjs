import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fetchCommonsJson} from "./photo-commons-http.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
// Bounded single-run review, NOT production assets and NOT publication approval.
const candidates=[
  {
    "title": "File:Solis 50.jpg",
    "targets": [
      "c7ce4206-cf30-405e-9de1-ec6491dda11f",
      "6ecbbd12-b0fd-40e6-a9bf-1c8ea7fa3a8d"
    ],
    "hold": "Verify S 50 DT versus ST; only one correct drive configuration."
  },
  {
    "title": "File:Sonalika Baagban DI-30Rx Tractor Left Front Coorg Feb24 A7C 09555.jpg",
    "targets": [
      "ad248a3c-d9af-45f9-9aff-93c54d2f45e8"
    ],
    "hold": "Author requests commercial contact; verify 2WD/Rx trim; do not publish."
  },
  {
    "title": "File:Sonalika Baagban DI-30Rx Tractor Coorg Feb24 A7C 09554.jpg",
    "targets": [
      "ad248a3c-d9af-45f9-9aff-93c54d2f45e8"
    ],
    "hold": "Author requests commercial contact; verify 2WD/Rx trim; do not publish."
  },
  {
    "title": "File:Lanouaille Massey Ferguson 4708.jpg",
    "targets": [
      "5727a834-a31d-4d85-9d0a-22468b2fa6c7"
    ],
    "hold": "France 2016 photographed; South Africa 2021 platform record; confirm model and configuration."
  },
  {
    "title": "File:ZETOR MAJOR.jpg",
    "targets": [
      "755e44bc-8043-4d41-9e08-f40e818ac00b"
    ],
    "hold": "Verify CL80 badge and generation, not HS."
  }
];
const dir="curated-photo-review-20261124";
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
