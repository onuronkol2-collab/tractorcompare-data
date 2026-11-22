#!/usr/bin/env node
// Read-only production proof: checks all nine real JPEG bytes against SHA
// hashes produced from independently licensed Commons source photographs.
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const base=dirname(fileURLToPath(import.meta.url));
const ledger=JSON.parse(readFileSync(resolve(base,"../docs/photo-import-evidence-tym-exact-three-20261122.json"),"utf8"));
const source=JSON.parse(readFileSync(resolve(base,"../docs/photo-curated-tym-exact-three-20261122.json"),"utf8"));
const origin=process.env.PHOTO_ORIGIN || "https://tractorvs.com";

export function checkImageResponse({status,mime,bytes,expected}){
  if(status!==200)throw Error("HTTP "+status+" for "+expected.file);
  if(!/^image\/jpeg(?:\s*;|\s*$)/i.test(mime))throw Error("Unexpected MIME "+mime+" for "+expected.file);
  if(!Buffer.isBuffer(bytes)||bytes.length!==expected.bytes||bytes.length<10000)
    throw Error("Wrong byte count for "+expected.file);
  if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff||
     bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9)
    throw Error("Invalid JPEG markers for "+expected.file);
  const actual=createHash("sha256").update(bytes).digest("hex");
  if(actual!==expected.sha256)throw Error("SHA-256 mismatch for "+expected.file);
  return actual;
}

export function expectedAssets(){
  if(ledger.publicationCount!==0||ledger.reviewRequired!==true||ledger.images.length!==3)
    throw Error("Source artifact not verified as exact review batch");
  if(source.photos.length!==3||source.photos.some(p=>p.publishStatus!=="research_only"))
    throw Error("Unexpected source photo release evidence");
  const expectedNames=new Set(source.photos.map(p=>p.fileId));
  const got=new Set(ledger.images.map(p=>p.fileId));
  if(got.size!==3||[...got].some(n=>!expectedNames.has(n)))
    throw Error("Original licensed photo set changed");
  const all=[];
  for(const item of ledger.images){
    if(item.approvedToPublish!==false||item.derivatives.length!==3)
      throw Error("Staging source accounting changed for "+item.fileId);
    const widths=new Set(item.derivatives.map(x=>x.width));
    if(widths.size!==3||[480,960,1920].some(w=>!widths.has(w)))
      throw Error("Not all three optimization widths recorded");
    for(const d of item.derivatives){
      if(!/^tym-(?:t2026-2500l|t4058-6225c|t5075-t78)-marcelx42-2023-(?:480|960|1920)\.jpg$/.test(d.file))
        throw Error("Unexpected image release filename "+d.file);
      if(!/^[a-f0-9]{64}$/.test(d.sha256))throw Error("No origin SHA proof for "+d.file);
      all.push(d);
    }
  }
  if(all.length!==9||new Set(all.map(x=>x.file)).size!==9)
    throw Error("Unexpected origin photo count");
  return all;
}

export async function proveProduction({
  endpoint=origin,
  fetcher=fetch,
  attempts=30,
  delayMs=8000,
  log=console.log
}={}){
  const expected=expectedAssets();
  if(endpoint!=="https://tractorvs.com" && !/^https:\/\/[a-z0-9-]+-tractorvs-site\.onuronkol2\.workers\.dev$/.test(endpoint))
    throw Error("Unapproved photo-proof domain");
  for(const item of expected){
    const url=endpoint+"/images/tractors/"+item.file;
    let checked=false;
    for(let n=1;n<=attempts;n++){
      let response;
      try{
        response=await fetcher(url,{signal:AbortSignal.timeout(15000),redirect:"error",headers:{"Accept":"image/jpeg"}});
      }catch(err){
        if(n===attempts)throw Error("Network failure for "+item.file+": "+err.message);
        await new Promise(r=>setTimeout(r,delayMs));
        continue;
      }
      // Fail closed for permission and rate-limit errors.
      if([401,403,429].includes(response.status))throw Error("Unsafe live HTTP "+response.status+" at "+url);
      if(response.status===404||response.status===502||response.status===503||response.status===504){
        if(n===attempts)throw Error("Asset unavailable after retries: "+url+" HTTP "+response.status);
        await new Promise(r=>setTimeout(r,delayMs));
        continue;
      }
      const bytes=Buffer.from(await response.arrayBuffer());
      const hash=checkImageResponse({
        status:response.status,
        mime:response.headers.get("content-type")||"",
        bytes,
        expected:item,
      });
      log("LIVE_OK "+item.file+" HTTP 200 image/jpeg "+bytes.length+" bytes SHA256 "+hash);
      checked=true;
      break;
    }
    if(!checked)throw Error("Failed real production verification: "+url);
  }
  log("TRACTORVS_TYM_3_MODELS_9_JPEG_PRODUCTION_HASHES_MATCH");
}

if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  proveProduction().catch(err=>{console.error("PRODUCTION_PHOTO_PROOF_FAILED",err.message);process.exitCode=1;});
}
