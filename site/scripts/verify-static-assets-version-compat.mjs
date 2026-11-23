/**
 * TractorVS Cloudflare Workers Static Assets release check.
 *
 * One version's manifest does NOT make another version's files available.
 * This script checks the currently built Astro asset graph and, optionally,
 * compares two local build directories for *potential* old-tab / rollback skew.
 *
 * Never claims a live Cloudflare version has been inspected. No network calls,
 * external files, secrets, private DB data or production mutations.
 */
import {existsSync,readdirSync,readFileSync,statSync} from "node:fs";
import {join,relative,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";

const PREFIX="/_astro/";
const ASSET_REF=/(?:["'(\s=])\/_astro\/([A-Za-z0-9._/-]+\.(?:m?js|css|woff2?|svg|png|jpe?g|webp|avif))(?=[?#"'()\s<>,]|$)/g;

function checkBuildRoot(dir){
 const root=resolve(dir);
 if(!existsSync(root)||!statSync(root).isDirectory())throw Error("Static asset audit requires a built dist directory");
 if(!existsSync(join(root,"index.html")))throw Error("Static asset audit: missing generated index.html");
 return root;
}
function safeAstroRef(value){
 if(!value.startsWith(PREFIX))throw Error("Unexpected non-Astro asset reference");
 const parts=value.slice(PREFIX.length).split("/");
 if(!parts.length||parts.some(p=>!p||p==="."||p===".."))
  throw Error("Unsafe Astro asset path in built output");
 return PREFIX+parts.join("/");
}
export function extractAstroReferences(source){
 const refs=new Set();
 for(const match of source.matchAll(ASSET_REF)){
  refs.add(safeAstroRef(PREFIX+match[1]));
 }
 return [...refs].sort();
}
function visitTree(root,visit){
 const walk=dir=>{
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const full=join(dir,entry.name);
   if(entry.isSymbolicLink())throw Error("Static output contains an unexpected symlink");
   if(entry.isDirectory())walk(full);
   else if(entry.isFile())visit(full);
  }
 };
 walk(root);
}
export function auditBuiltAstroAssets(dir){
 const root=checkBuildRoot(dir);
 const files=[];
 let htmlDocuments=0,dependencyDocuments=0;
 const refs=new Set();
 const sourceForRef=new Map();
 const astroRoot=resolve(root,"_astro");
 visitTree(root,full=>{
  const rel=relative(root,full).split(sep).join("/");
  if(rel.startsWith("_astro/")){
   files.push("/"+rel);
   if(/\.(?:m?js|css)$/i.test(rel)){
    dependencyDocuments++;
    const content=readFileSync(full,"utf8");
    for(const ref of extractAstroReferences(content)){
     refs.add(ref);
     if(!sourceForRef.has(ref))sourceForRef.set(ref,rel);
    }
   }
  }else if(rel.endsWith(".html")){
   htmlDocuments++;
   const content=readFileSync(full,"utf8");
   for(const ref of extractAstroReferences(content)){
    refs.add(ref);
    if(!sourceForRef.has(ref))sourceForRef.set(ref,rel);
   }
  }
 });
 const available=new Set(files);
 const missingReferences=[...refs].filter(ref=>!available.has(ref)).map(ref=>({
  asset:ref,referencedBy:sourceForRef.get(ref)
 }));
 return {
  htmlDocuments,dependencyDocuments,
  assetFiles:files.length,referenceCount:refs.size,
  assetPaths:files.sort(),referencedPaths:[...refs].sort(),missingReferences,
  state:"local_build_output_only_not_cloudflare_deployment"
 };
}
export function compareBuiltAssetVersions(previous,current){
 const old=auditBuiltAstroAssets(previous),next=auditBuiltAstroAssets(current);
 if(old.missingReferences.length||next.missingReferences.length)
  throw Error("Cannot compare invalid builds: missing local asset references");
 const oldFiles=new Set(old.assetPaths),newFiles=new Set(next.assetPaths);
 const absentFromNew=old.assetPaths.filter(p=>!newFiles.has(p));
 const absentFromOld=next.assetPaths.filter(p=>!oldFiles.has(p));
 const oldRefsAbsentFromNew=old.referencedPaths.filter(p=>!newFiles.has(p));
 const newRefsAbsentFromOld=next.referencedPaths.filter(p=>!oldFiles.has(p));
 return {
  previous:{htmlDocuments:old.htmlDocuments,assetFiles:old.assetFiles},
  current:{htmlDocuments:next.htmlDocuments,assetFiles:next.assetFiles},
  oldAssetPathsAbsentFromNew:absentFromNew.length,
  newAssetPathsAbsentFromOld:absentFromOld.length,
  oldHtmlAndModuleReferencesAbsentFromNew:oldRefsAbsentFromNew.length,
  newHtmlAndModuleReferencesAbsentFromOld:newRefsAbsentFromOld.length,
  examples:{
   oldMissing:absentFromNew.slice(0,12),
   newMissing:absentFromOld.slice(0,12),
   oldReferencedMissing:oldRefsAbsentFromNew.slice(0,12),
   newReferencedMissing:newRefsAbsentFromOld.slice(0,12)
  },
  status:absentFromNew.length||absentFromOld.length?"POTENTIAL_VERSION_SKEW":"NO_MISSING_CROSS_VERSION_ASSETS_IN_LOCAL_INPUTS",
  interpretation:"Static local files only: not proof of Cloudflare rollout propagation, version routing or real user errors"
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const current=process.argv[2]||resolve(import.meta.dirname,"../dist");
  const result=auditBuiltAstroAssets(current);
  console.log("TRACTORVS_BUILT_ASSET_GRAPH "+JSON.stringify({
   htmlDocuments:result.htmlDocuments,
   dependencyDocuments:result.dependencyDocuments,
   assetFiles:result.assetFiles,referenceCount:result.referenceCount,
   missingReferences:result.missingReferences.slice(0,12),status:result.state
  }));
  if(!result.htmlDocuments||!result.assetFiles||!result.referenceCount||
     result.missingReferences.length)
   throw Error("Missing or dangling static HTML/JS/CSS asset references");
  if(process.argv[3]){
   const comparison=compareBuiltAssetVersions(process.argv[3],current);
   console.log("TRACTORVS_CROSS_RELEASE_ASSET_RISK "+JSON.stringify(comparison));
   // A newly deployed version cannot automatically repair previously deployed
   // versions. Report both directions rather than blocking every hash change.
   if(process.env.TRACTORVS_STRICT_ASSET_RETENTION==="true"&&
      comparison.oldAssetPathsAbsentFromNew)throw Error("Previous asset retention requirement failed");
  }
 }catch(error){
  console.error("TRACTORVS_ASSET_AUDIT_ERROR "+String(error?.message||error));
  process.exitCode=1;
 }
}
