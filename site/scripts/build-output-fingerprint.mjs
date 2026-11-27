import {createHash} from "node:crypto";
import {lstatSync,readdirSync,createReadStream} from "node:fs";
import {resolve,join,relative,sep} from "node:path";
import {pathToFileURL} from "node:url";
async function hashFile(path){
 const hash=createHash("sha256");let bytes=0;
 for await(const chunk of createReadStream(path)){hash.update(chunk);bytes+=chunk.length;}
 return {sha256:hash.digest("hex"),bytes};
}
export async function fingerprintBuild(directory){
 const root=resolve(directory),rows=[];
 if(!lstatSync(root).isDirectory())throw Error("Expected ordinary build directory");
 async function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
   const path=join(dir,entry.name);
   if(entry.isDirectory())await walk(path);
   else if(entry.isFile()){
    const before=lstatSync(path);
    const hash=await hashFile(path);
    const after=lstatSync(path);
    if(!after.isFile()||before.ino!==after.ino||before.size!==after.size||before.mtimeMs!==after.mtimeMs||hash.bytes!==after.size)throw Error("Build file changed during measurement");
    rows.push({file:relative(root,path).split(sep).join("/"),...hash});
   }else throw Error("Unexpected build entry; do not follow symlinks");
  }
 }
 await walk(root);
 if(!rows.length||!rows.some(r=>r.file==="index.html"))throw Error("Incomplete build output");
 const digest=createHash("sha256").update(JSON.stringify(rows)).digest("hex");
 return {version:1,files:rows.length,bytes:rows.reduce((n,r)=>n+r.bytes,0),digest,rows};
}
export function compareBuildFingerprints(a,b){
 if(a?.version!==1||b?.version!==1||!Array.isArray(a.rows)||!Array.isArray(b.rows))throw Error("Invalid fingerprint");
 const map=rows=>{const m=new Map();for(const r of rows){if(!r||typeof r.file!=="string"||!r.file||m.has(r.file)||!/^[a-f0-9]{64}$/.test(r.sha256)||!Number.isSafeInteger(r.bytes)||r.bytes<0)throw Error("Invalid fingerprint row");m.set(r.file,r);}return m;};
 const left=map(a.rows),right=map(b.rows);
 const missing=[...left.keys()].filter(k=>!right.has(k));
 const extra=[...right.keys()].filter(k=>!left.has(k));
 const changed=[...left.keys()].filter(k=>right.has(k)&&(left.get(k).sha256!==right.get(k).sha256||left.get(k).bytes!==right.get(k).bytes));
 return {identical:!missing.length&&!extra.length&&!changed.length,missing,extra,changed};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const [directory]=process.argv.slice(2);
 if(!directory)throw Error("Expected explicit completed build directory");
 console.log(JSON.stringify(await fingerprintBuild(directory),null,2));
}
