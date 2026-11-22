/** Offline SHA-pinned media gate for the reviewed Steyr/Zetor images.
 *
 * Origin is fetched ONCE by a controlled default-branch staging workflow.
 * A PR must never repeat six Wikimedia requests and turn a legitimate 429
 * into a false loss of provenance, nor publish without real JPEG files.
 */
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {tractorPhotos,resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";

const targets=[
  ["Steyr","6240 ABSOLUT CVT","steyr-6240-absolut-blonder1984-2022","Blonder1984","CC BY 4.0"],
  ["Zetor","PROXIMA","zetor-proxima-jj7777-2021","JJ7777","CC BY-SA 4.0"],
  ["Zetor","PROXIMA","zetor-proxima-raf24-warsaw-2019","Raf24~commonswiki","CC BY-SA 4.0"]
];
const report={ok:false,photos:0,derivatives:0,sourceEvidenceChecked:0,failures:[]};
const fail=reason=>{report.failures.push(reason);throw new Error(reason)};
function imageDimensions(bytes){
  if(bytes.length<3000||bytes[0]!==255||bytes[1]!==216||
     bytes.at(-2)!==255||bytes.at(-1)!==217)fail("Invalid JPEG SOI/EOI");
  for(let p=2;p+9<bytes.length;){
    if(bytes[p]!==255){p++;continue}
    while(bytes[p]===255)p++;
    const marker=bytes[p++];
    if(marker===216||marker===217||marker===1)continue;
    if(marker>=208&&marker<=215)continue;
    if(p+2>bytes.length)break;
    const n=(bytes[p]<<8)|bytes[p+1];
    if(n<2||p+n>bytes.length)break;
    if([192,193,194,195,198,199,201,202,203,205,206,207].includes(marker)){
      if(n<7)break;
      return {height:(bytes[p+3]<<8)|bytes[p+4],width:(bytes[p+5]<<8)|bytes[p+6]};
    }
    p+=n;
  }
  fail("JPEG dimensions not present");
}
try{
  const ledger=JSON.parse(readFileSync(new URL("../docs/photo-import-evidence-steyr-zetor-20261122.json",import.meta.url),"utf8"));
  if(!ledger.reviewRequired||ledger.publicationCount!==0||
     !Array.isArray(ledger.images)||ledger.images.length!==3)fail("Missing/incomplete review evidence");
  if(ledger.images.some(x=>x.approvedToPublish!==false))fail("Unreviewed staging ledger cannot claim approval");
  const ids=new Set();
  for(const [brand,model,id,author,license] of targets){
    const entry=ledger.images.find(x=>x.fileId===id);
    if(!entry||ids.has(entry.fileId))fail("Source identity missing/duplicated: "+id);
    ids.add(id);
    const photo=tractorPhotos({brand_name:brand,model_name:model}).find(x=>x.fileId===id);
    if(!photo)fail("Source points at wrong tractor model: "+id);
    if(entry.photographer!==photo.photographer||entry.photographer!==author||
       entry.license!==license||photo.licenseName!==license||
       entry.sourcePage!==photo.sourcePage||photo.configurationExact!==false)
      fail("Invalid rights/identity metadata: "+id);
    const source=new URL(entry.origin);
    if(source.protocol!=="https:"||
       !["upload.wikimedia.org","thumb.wikimedia.org"].includes(source.hostname)||
       source.username||source.password||source.search||source.hash||
       source.pathname!==new URL(photo.originFullUrl).pathname)
      fail("Invalid actual reviewed source provenance: "+id);
    if(resolveApprovedPhotoSource(photo.thumbUrl)!==photo.originThumbUrl||
       resolveApprovedPhotoSource(photo.displayUrl)!==photo.originDisplayUrl)
      fail("First-party photo Worker mapping broken: "+id);
    if(!/^[a-f0-9]{64}$/.test(entry.originSha256)||
       !Number.isSafeInteger(entry.originBytes)||entry.originBytes<10_000)
      fail("Missing real upstream SHA-256 source: "+id);
    report.sourceEvidenceChecked++;
    if(!Array.isArray(entry.derivatives)||entry.derivatives.length!==3)
      fail("Missing JPEG derivatives: "+id);
    const seen=new Set();
    for(const rendition of entry.derivatives){
      const width=rendition.width;
      if(![480,960,1920].includes(width)||seen.has(width))fail("Invalid image widths: "+id);
      seen.add(width);
      const basename=id+"-"+width+".jpg";
      if(rendition.file!==basename||!Number.isSafeInteger(rendition.height)||rendition.height<100)
        fail("Invalid source-labeled filename or height: "+id);
      const bytes=readFileSync(new URL("../public/images/tractors/"+basename,import.meta.url));
      const size=imageDimensions(bytes);
      if(bytes.length!==rendition.bytes||
         !/^[a-f0-9]{64}$/.test(rendition.sha256)||
         createHash("sha256").update(bytes).digest("hex")!==rendition.sha256||
         size.width!==width||size.height!==rendition.height)
        fail("Media integrity mismatch: "+basename);
      report.derivatives++;
    }
    report.photos++;
  }
  report.ok=report.photos===3&&report.derivatives===9&&report.sourceEvidenceChecked===3;
}catch(e){if(!report.failures.length)report.failures.push(String(e?.message||e))}
console.log("TRACTORVS_SHA_MEDIA_RELEASE_QA "+JSON.stringify(report));
if(!report.ok)process.exitCode=1;
