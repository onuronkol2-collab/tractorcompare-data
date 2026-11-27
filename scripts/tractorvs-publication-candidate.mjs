// Staged PR-only transport. No direct main writes, no auto-merge, no credentials
// minted here. Call only from the trusted main workflow after evidence validation.
import {createHash} from "node:crypto";
export const REPO="onuronkol2-collab/tractorcompare-data";
const ALLOWED=Object.freeze({
 catalog:["site/src/data/public-catalog-sync.json"],
 forum:["site/src/data/public-forum-sync.json"],
 sitemap:["seo/sitemap-content-history.json","site/src/data/sitemap-lastmod.json"]
});
const shaOk=s=>typeof s==="string"&&/^[a-f0-9]{40}$/.test(s);
export function candidatePlan({kind,baseSha,files}){
 if(!Object.hasOwn(ALLOWED,kind)||!shaOk(baseSha)||!Array.isArray(files))throw Error("Invalid candidate scope");
 const expected=ALLOWED[kind];
 if(files.length!==expected.length||new Set(files.map(f=>f.path)).size!==expected.length||!expected.every(p=>files.some(f=>f.path===p)))throw Error("Candidate path set must match exact allowlist");
 const sorted=files.map(f=>{
  if(typeof f.content!=="string"||Buffer.byteLength(f.content)>30_000_000)throw Error("Invalid candidate content");
  const obj=JSON.parse(f.content);
  if(!obj||typeof obj!=="object"||Array.isArray(obj))throw Error("Invalid candidate JSON");
  if(kind!=="sitemap"&&(!/^[a-f0-9]{64}$/.test(obj.fingerprint??"")||obj.scope!=="aaufxtcvnzgavtlintiv"||obj.source!==(kind==="catalog"?"anon_public_view":"anon_public_forum_views")))throw Error("Invalid public fingerprint scope");
  return {path:f.path,mode:"100644",type:"blob",content:f.content};
 }).sort((a,b)=>a.path.localeCompare(b.path));
 const digest=createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
 return {kind,baseSha,digest,branch:"ops/publication-candidate/"+kind+"/"+baseSha.slice(0,12)+"-"+digest.slice(0,16),files:sorted};
}
export async function openPublicationCandidate({repo,ref,kind,baseSha,files,token,fetchFn=fetch,dryRun=true}){
 if(repo!==REPO||ref!=="refs/heads/main")throw Error("Candidate writer must run on trusted main");
 const plan=candidatePlan({kind,baseSha,files});
 if(dryRun)return {dryRun:true,branch:plan.branch,digest:plan.digest,paths:plan.files.map(f=>f.path)};
 if(!token)throw Error("Candidate transport credential missing");
 const api=async(path,method="GET",body)=>{
  const r=await fetchFn("https://api.github.com/repos/"+REPO+path,{method,redirect:"error",signal:AbortSignal.timeout(25000),headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!r.ok)throw Error("Candidate API HTTP "+r.status+" at "+method+" "+path);
  return r.json();
 };
 const checkBase=async()=>{const r=await api("/git/ref/heads/main");if(r.object?.sha!==baseSha)throw Error("Main moved: rebuild candidate evidence");};
 await checkBase();
 const existing=await api("/pulls?state=open&base=main&per_page=100");
 if(!Array.isArray(existing)||existing.length>=100||existing.some(p=>p.head?.ref?.startsWith("ops/publication-candidate/"+kind+"/")))throw Error("Outstanding or incomplete candidate inventory; reconcile first");
 const base=await api("/git/commits/"+baseSha);
 if(!shaOk(base.tree?.sha))throw Error("Missing base tree");
 const tree=await api("/git/trees","POST",{base_tree:base.tree.sha,tree:plan.files});
 if(!shaOk(tree.sha)||tree.sha===base.tree.sha)throw Error("No changed candidate tree");
 const commit=await api("/git/commits","POST",{message:"chore(publication): verified "+kind+" candidate",tree:tree.sha,parents:[baseSha]});
 if(!shaOk(commit.sha))throw Error("Candidate commit missing");
 await checkBase();
 await api("/git/refs","POST",{ref:"refs/heads/"+plan.branch,sha:commit.sha});
 await checkBase();
 const pr=await api("/pulls","POST",{title:"Publication candidate: "+kind,head:plan.branch,base:"main",body:"Evidence base: "+baseSha+"\nCandidate digest: "+plan.digest+"\nPR-only staging. Independent release authorization and all applicable checks required."});
 if(!Number.isSafeInteger(pr.number)||pr.head?.sha!==commit.sha||pr.base?.ref!=="main")throw Error("Candidate PR not confirmed");
 return {dryRun:false,number:pr.number,sha:commit.sha,branch:plan.branch,digest:plan.digest};
}
