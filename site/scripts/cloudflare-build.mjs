/**
 * Build once, using production checks only for the main branch.
 * Cloudflare Workers Builds executes this at root directory "site".
 * Preview branches always render noindex HTML even when production build
 * environment variables were inherited by the preview.
 */
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {preflight,postflight} from "./production-release-gate.mjs";
const site=resolve(fileURLToPath(new URL("../",import.meta.url)));

export function buildMode(branch=process.env.WORKERS_CI_BRANCH){
 return branch && branch!=="main" ? "preview" : "production";
}

function runBuild(env){
 const npm=process.platform==="win32"?"npm.cmd":"npm";
 const result=spawnSync(npm,["run","build"],{cwd:site,env,stdio:"inherit"});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error("Astro build failed with exit code "+result.status);
}
export function buildForCloudflare(env=process.env){
 const mode=buildMode(env.WORKERS_CI_BRANCH);
 const totalStart=performance.now();
 // Timings are diagnostic only, with no environment or credentials logged.
 const phase=(name,fn)=>{
  const start=performance.now();
  try{return fn();}
  finally{if(env.TRACTORVS_BUILD_PROFILE==="true")console.log("TRACTORVS_BUILD_PHASE "+JSON.stringify({mode,phase:name,elapsedMs:Math.round(performance.now()-start)}));}
 };
 if(mode==="preview"){
  console.log("[TractorVS] Building isolated noindex preview branch.");
  phase("astro",()=>runBuild({...env,PUBLIC_INDEXING_ENABLED:"false",SITE_URL:""}));
  return {mode};
 }
 phase("preflight",()=>preflight(env));
 phase("astro",()=>runBuild(env));
 const check=phase("postflight",()=>postflight(env));
 if(env.TRACTORVS_BUILD_PROFILE==="true")console.log("TRACTORVS_BUILD_TOTAL "+JSON.stringify({mode,elapsedMs:Math.round(performance.now()-totalStart)}));
 console.log("[TractorVS] Production bundle has passed all release checks.");
 return {mode,...check};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{buildForCloudflare();}
 catch(error){console.error(error instanceof Error?error.message:"Cloudflare build failed");process.exitCode=1;}
}
