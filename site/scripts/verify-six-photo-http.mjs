/** Verify real first-party HTTP 200/JPEG and content hash, not only a build artifact.
 * Does not modify the site, the database or Wikimedia.
 */
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
const origin=process.env.PHOTO_ORIGIN;
if(!origin||!/^https:\/\/[-a-z0-9.]+(?::443)?\/?$/.test(origin))throw Error("Explicit HTTPS PHOTO_ORIGIN required");
const files=["photo-evidence-belarus-510-9223-20261122.json","photo-evidence-mccormick-four-20261122.json"];
const problems=[];
for(const file of files){
  const ledger=JSON.parse(await readFile(new URL("../docs/"+file,import.meta.url),"utf8"));
  if(!ledger.jpegContentVerified||!ledger.originalBinaryHttpVerified)throw Error("Source proof absent "+file);
  for(const item of ledger.sources){
    const proof=ledger.importProof.find(x=>x.fileId===item.fileId);
    if(!proof)throw Error("Missing hash ledger "+item.fileId);
    for(const size of [480,960,1920]){
      const path="/images/tractors/"+item.fileId+"-"+size+".jpg";
      try{
        const response=await fetch(origin.replace(/\/$/,"")+path,{signal:AbortSignal.timeout(30000),headers:{Accept:"image/jpeg"}});
        if(!response.ok)throw Error("HTTP "+response.status);
        const mime=response.headers.get("content-type")||"";
        if(!/^image\/jpeg(?:;|$)/i.test(mime))throw Error("Wrong Content-Type "+mime);
        const data=Buffer.from(await response.arrayBuffer());
        if(data.length!==proof.derivatives[size].bytes||data[0]!==255||data[1]!==216||data[2]!==255||
           data.at(-2)!==255||data.at(-1)!==217)throw Error("Invalid JPEG bytes "+data.length);
        const hash=createHash("sha256").update(data).digest("hex");
        if(hash!==proof.derivatives[size].sha256)throw Error("JPEG sha256 differs");
        console.log("LIVE PHOTO PASS "+path+" "+data.length);
      }catch(e){
        problems.push({path,error:String(e)});
        console.error("LIVE PHOTO FAIL "+path+" "+String(e));
      }
    }
  }
}
console.log(JSON.stringify({checked:18,failures:problems.length,origin,problems}));
if(problems.length)process.exitCode=1;
