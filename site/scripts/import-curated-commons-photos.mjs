/**
 * Curated Commons import. This deliberately does NOT discover or approve images.
 * The reviewed evidence ledger pins exact model, author, CC license, dimensions.
 * Failed licence/HTTP/JPEG checks fail closed; never bypass 429 or publish drafts.
 * This is a one-time PR branch importer; no production or Supabase writes.
 */
import {readFile,writeFile,mkdir,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import {join} from "node:path";

const EVIDENCE="site/docs/photo-evidence-belarus-510-9223-20261122.json";
const OUTPUT="site/public/images/tractors";
const SIZES=[[480,500],[960,960],[1920,1920]];
const UA="TractorVS-photo-review/1.0 (https://tractorvs.com; licensed Commons import)";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url,accept="*/*"){
  for(let attempt=0;attempt<3;attempt++){
    const res=await fetch(url,{signal:AbortSignal.timeout(40000),headers:{"User-Agent":UA,Accept:accept}});
    if(res.status===429 || res.status===503){
      const retry=Number(res.headers.get("retry-after"));
      const ms=Number.isFinite(retry)&&retry>0?retry*1000:1800*(attempt+1);
      if(attempt===2 || ms>15000)throw Error("Rate limit unresolved: HTTP "+res.status+" "+url);
      await sleep(ms);continue;
    }
    if(!res.ok)throw Error("Source HTTP "+res.status+" "+url);
    return {res,body:Buffer.from(await res.arrayBuffer())};
  }
  throw Error("Bounded retries exhausted: "+url);
}
const norm=s=>String(s).replaceAll("_"," ").normalize("NFC").trim();
const strip=s=>String(s).replace(/<[^>]*>/g," ").replace(/&[^;]+;/g," ").replace(/\s+/g," ").trim();
function validateIdentity(source,info){
  if(!info||info.mime!=="image/jpeg")throw Error("Commons did not identify a real JPEG "+source.fileId);
  if(info.width!==source.width||info.height!==source.height)throw Error("Original dimensions changed "+source.fileId);
  const meta=info.extmetadata||{};
  const license=strip(meta.LicenseShortName?.value||"");
  const artist=strip(meta.Artist?.value||"");
  const licenseUrl=String(meta.LicenseUrl?.value||"");
  if(license!==source.licenseName||licenseUrl.replace(/\/?$/,"/")!==source.licenseUrl)
    throw Error("Unverified Commons CC license "+source.fileId+": "+license);
  const words=source.photographer.split(/\s+/).filter(x=>x.length>=4);
  if(!words.every(word=>artist.toLowerCase().includes(word.toLowerCase())))
    throw Error("Artist mismatch "+source.fileId+": "+artist);
  const filename=decodeURIComponent(new URL(info.url).pathname.split("/").at(-1));
  if(norm(filename)!==norm(source.originalFilename))
    throw Error("Source original-file identity mismatch "+source.fileId);
  return {artist,license,licenseUrl};
}
async function main(){
  const ledger=JSON.parse(await readFile(EVIDENCE,"utf8"));
  if(!Array.isArray(ledger.sources)||ledger.sources.length!==2)throw Error("Unexpected curated list");
  const titles=ledger.sources.map(s=>"File:"+s.originalFilename).join("|");
  const api="https://commons.wikimedia.org/w/api.php?"+new URLSearchParams({
    action:"query",prop:"imageinfo",iiprop:"url|size|mime|extmetadata",
    titles,format:"json",formatversion:"2"
  });
  const raw=await get(api,"application/json");
  let json;try{json=JSON.parse(raw.body.toString("utf8"))}catch{throw Error("Commons API did not return JSON")}
  if(json.error||!Array.isArray(json.query?.pages))throw Error("Commons API logical error "+JSON.stringify(json.error||{}));
  const files=[];
  const proofs=[];
  for(const source of ledger.sources){
    if(source.licenseName!=="CC BY-SA 4.0"||source.variantExact!==false)
      throw Error("Unexpected rights/variant conditions "+source.fileId);
    if(!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(source.sourcePage))
      throw Error("Untrusted File page "+source.fileId);
    if(!/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(source.sourceImageUrl))
      throw Error("Untrusted image origin "+source.fileId);
    const page=json.query.pages.find(p=>norm(p.title)==="File:"+norm(source.originalFilename));
    if(!page||page.missing||page.invalid||page.imageinfo?.length!==1)throw Error("Exact Commons File title missing "+source.fileId);
    const info=page.imageinfo[0];
    const proof=validateIdentity(source,info);
    const original=new URL(info.url);
    const relative=original.pathname.split("/wikipedia/commons/")[1];
    if(!relative||!relative.includes("/"))throw Error("Wrong Commons original path "+source.fileId);
    const filename=relative.split("/").at(-1);
    if(decodeURIComponent(filename)!==source.originalFilename)throw Error("Filename mismatch "+source.fileId);
    const digests={};
    for(const [local,commons] of SIZES){
      const url="https://upload.wikimedia.org/wikipedia/commons/thumb/"+relative+"/"+commons+"px-"+filename;
      const {res,body}=await get(url,"image/jpeg");
      if(!/image\/jpeg/i.test(res.headers.get("content-type")||"")||body.length<=9000||
         body[0]!==255||body[1]!==216||body[2]!==255||body.at(-2)!==255||body.at(-1)!==217)
         throw Error("Corrupt/non-JPEG derivative "+source.fileId+" "+local);
      const sha256=createHash("sha256").update(body).digest("hex");
      const path=join(OUTPUT,source.fileId+"-"+local+".jpg");
      files.push({path,body});
      digests[String(local)]={bytes:body.length,sha256,url};
      console.log("VERIFIED "+JSON.stringify({fileId:source.fileId,size:local,bytes:body.length,sha256}));
      await sleep(1250);
    }
    proofs.push({fileId:source.fileId,commonsSourceUrl:info.url,sourcePage:source.sourcePage,
      photographer:source.photographer,license:proof.license,artistVerified:proof.artist,
      originalWidth:info.width,originalHeight:info.height,derivatives:digests});
  }
  await mkdir(OUTPUT,{recursive:true});
  for(const file of files){
    const previous=await stat(file.path).catch(()=>null);
    if(previous){
      const old=await readFile(file.path);
      if(!old.equals(file.body))throw Error("Refusing to overwrite existing file "+file.path);
    }else await writeFile(file.path,file.body,{flag:"wx"});
  }
  ledger.originalBinaryHttpVerified=true;
  ledger.jpegContentVerified=true;
  ledger.firstPartyProxyHttpVerified=false; // needs preview + production checks
  ledger.sha256=Object.fromEntries(proofs.map(p=>[p.fileId,p.derivatives]));
  ledger.importProof=proofs;
  ledger.releaseStatus="PR JPEG assets staged, requires CI, first-party HTTP and release approval";
  await writeFile(EVIDENCE,JSON.stringify(ledger,null,2)+"\n");
  console.log("SUCCESS: downloaded "+files.length+" validated JPEG derivatives; no production deployment");
}
main().catch(e=>{console.error("PHOTO IMPORT BLOCKED: "+String(e));process.exitCode=1});
