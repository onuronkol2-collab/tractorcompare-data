import {mkdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {fetchCommonsJson} from "./photo-commons-http.mjs";
import {allowedPhotoReuseLicense} from "./photo-license-check.mjs";
// Bounded single-run review, NOT production assets and NOT publication approval.
const candidates=[
  {
    "title": "File:Sommet de l'Élevage 2019 - Tracteur Solis 26 HST.jpg",
    "targets": [
      "45b7ce31-c2d1-492d-a2eb-8b081fc89c7f"
    ],
    "hold": "2019 generation vs current HST; inspect full photo and OEM market generation."
  },
  {
    "title": "File:Solis 75 Allrad-Traktor.jpg",
    "targets": [
      "39a48550-4804-4700-9a81-ebb5a37ccacd"
    ],
    "hold": "Verify DT MR wide tire ROPS, generation and badge."
  },
  {
    "title": "File:Solis 75N, WAW.jpg",
    "targets": [
      "d3dccd43-69e6-46cb-b7c8-9a849930e6a0"
    ],
    "hold": "75N vs S75 NT CRDi; narrow variant and emissions not yet proven."
  },
  {
    "title": "File:Solis S90 Shuttle XL Cabin Agritechnica 2025 (DSC04064).jpg",
    "targets": [
      "8760f728-4121-4f22-85c5-dbf5c99ab64b"
    ],
    "hold": "Verify same exact Stage V HVAC model; XL may be distinct, hold."
  },
  {
    "title": "File:TYM T475C Agritechnica 2023 (DSC03513).jpg",
    "targets": [
      "8f3833e6-7eea-4a5c-a7eb-caa01b065cd5"
    ],
    "hold": "T475C vs T475; no use until variant confirmed."
  },
  {
    "title": "File:TYM T495SH Agritechnica 2025 (DSC04665).jpg",
    "targets": [
      "1e6d82f3-7a8a-4c3e-8aca-44f0e63f257d"
    ],
    "hold": "T495SH vs T495; no use until variant confirmed."
  }
];
const dir="solis-tym-photo-review-20261125";
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
