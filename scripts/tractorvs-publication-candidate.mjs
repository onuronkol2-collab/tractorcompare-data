// Staged PR-only transport. No direct main writes, no auto-merge, no credentials
// minted here. Call only from the trusted main workflow after evidence validation.
import {createHash} from "node:crypto";
export const REPO="onuronkol2-collab/tractorcompare-data";
const ALLOWED=Object.freeze({
 catalog:["site/src/data/public-catalog-sync.json"],
 forum:["site/src/data/public-forum-sync.json"],
 "forum-recovery":["site/src/data/public-forum-sync.json"],
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
// Obsolete machine candidates must not block every later real-source refresh.
const BOT="tractorvs-secure-publisher[bot]";
const candidateBody=plan=>"Evidence base: "+plan.baseSha+"\nCandidate digest: "+plan.digest+"\nPR-only staging. Independent release authorization and all applicable checks required.";
const blobSha=content=>createHash("sha1").update("blob "+Buffer.byteLength(content)+"\0").update(content).digest("hex");
const assert=(ok,message)=>{if(!ok)throw Error(message);};
function machineKind(pr){
 const m=pr?.head?.ref?.match(/^ops\/publication-candidate\/(catalog|forum|forum-recovery|sitemap)\/[a-f0-9]{12}-[a-f0-9]{16}$/);
 return m&&pr.title==="Publication candidate: "+m[1]?m[1]:null;
}
function untouched(pr){
 return pr?.state==="open"&&!pr.draft&&pr.user?.login===BOT&&pr.head?.repo?.full_name===REPO&&pr.base?.repo?.full_name===REPO&&pr.base?.ref==="main"&&shaOk(pr.head?.sha)&&Number.isSafeInteger(pr.number)&&pr.number>0&&Array.isArray(pr.requested_reviewers)&&pr.requested_reviewers.length===0&&Array.isArray(pr.requested_teams)&&pr.requested_teams.length===0&&Array.isArray(pr.labels)&&pr.labels.length===0&&Array.isArray(pr.assignees)&&pr.assignees.length===0;
}
// Cloudflare posts a machine-generated preview receipt on every build.
 // It is not human discussion or approval. Only this exact verified app/bot,
 // association and receipt shape may be ignored; never ignore other comments.
function isPreviewReceipt(comment,head){
 const user=comment?.user,app=comment?.performed_via_github_app,body=comment?.body;
 if(user?.id!==73139402||user.login!=="cloudflare-workers-and-pages[bot]"||user.type!=="Bot"||comment.author_association!=="NONE"||app?.id!==85455||app.slug!=="cloudflare-workers-and-pages"||app.owner?.login!=="cloudflare"||typeof body!=="string"||body.length>100000||!body.startsWith("## 🚀 Deploying Preview to Cloudflare 🚀\n<!-- Preview URL -->\n")||!body.includes("<!-- Preview Deployments -->"))return false;
 const heading=body.match(/^### Preview URL: (https:\/\/[^\s]+) \(commit ([a-f0-9]{7})\)$/m);
 if(!heading||heading[2]!==head.slice(0,7))return false;
 try{
  const preview=new URL(heading[1]);
  if(preview.protocol!=="https:"||preview.username||preview.password||preview.port||preview.pathname!=="/"||preview.search||preview.hash||!/^[-a-z0-9]+-tractorvs-site\.onuronkol2\.workers\.dev$/.test(preview.hostname))return false;
  return [...body.matchAll(/href="([^"\s]+)"/g)].some(match=>{
   try{const link=new URL(match[1]);return link.origin==="https://dash.cloudflare.com"&&!link.username&&!link.password;}catch{return false;}
  });
 }catch{return false;}
}
export async function reconcileExpiredMachineCandidate({api,number,baseSha,now=Date.now()}){
 assert(Number.isSafeInteger(number)&&number>0&&shaOk(baseSha)&&Number.isFinite(now),"Invalid reconciliation input");
 const get=()=>api("/pulls/"+number);
 const pr=await get(),kind=machineKind(pr);
 // Never touch fresh candidates, drafts, human-managed PRs or other branches.
 if(!kind||!untouched(pr)||!shaOk(pr.base.sha)||pr.number!==number)return false;
 const created=Date.parse(pr.created_at),updated=Date.parse(pr.updated_at);
 if(!Number.isFinite(created)||!Number.isFinite(updated)||now-created<25*60000||now-updated<25*60000)return false;
 const head=pr.head.sha,commit=await api("/git/commits/"+head);
 assert(commit.sha===head&&commit.parents?.length===1&&shaOk(commit.parents[0].sha),"Unverified old candidate parent");
 const oldBase=commit.parents[0].sha;
 // The pull API can retain the recorded base SHA even after main advances.
 // Only the exact verified parent or the requested current main is acceptable.
 if(pr.base.sha!==baseSha&&pr.base.sha!==oldBase)return false;
 if(pr.base.sha!==baseSha){
  const ancestry=await api("/compare/"+oldBase+"..."+baseSha+"?per_page=1");
  if(ancestry.status!=="ahead"||ancestry.behind_by!==0||ancestry.merge_base_commit?.sha!==oldBase)return false;
 }
 const files=await Promise.all(ALLOWED[kind].map(async path=>({path,content:await api("/contents/"+path+"?ref="+head,"GET",undefined,false,true)})));
 const plan=candidatePlan({kind,baseSha:oldBase,files});
 assert(pr.head.ref===plan.branch&&pr.body===candidateBody(plan),"Unverified old candidate identity");
 const diff=await api("/compare/"+oldBase+"..."+head+"?per_page=100");
 assert(diff.status==="ahead"&&diff.ahead_by===1&&diff.behind_by===0&&diff.files?.length===plan.files.length&&plan.files.every(f=>diff.files.some(x=>x.filename===f.path&&x.status==="modified"&&x.sha===blobSha(f.content))),"Unverified old candidate bytes");
 // Source evidence expires after 20 minutes. A candidate older than 25 minutes
 // is reconciled only if it is still exactly machine-generated and untouched.
 const hasDiscussion=async()=>{const [reviews,comments]=await Promise.all([api("/pulls/"+number+"/reviews?per_page=100"),api("/issues/"+number+"/comments?per_page=100")]);return !Array.isArray(reviews)||!Array.isArray(comments)||reviews.length!==0||comments.length>=100||comments.some(c=>!isPreviewReceipt(c,head));};
 if(await hasDiscussion())return false;
 const fresh=await get(),ref=await api("/git/ref/heads/"+plan.branch);
 if(!untouched(fresh)||fresh.head.sha!==head||fresh.head.ref!==plan.branch||fresh.body!==pr.body||fresh.updated_at!==pr.updated_at||fresh.base.sha!==pr.base.sha||fresh.title!==pr.title||await hasDiscussion())return false;
 assert(ref.ref==="refs/heads/"+plan.branch&&ref.object?.type==="commit"&&ref.object.sha===head,"Old candidate ref changed");
 assert((await api("/git/ref/heads/main")).object?.sha===baseSha,"Main changed before reconciliation");
 // Close only, never delete a branch, force-push, merge, change content or reviews.
 const closed=await api("/pulls/"+number,"PATCH",{state:"closed"});
 assert(closed.number===number&&closed.state==="closed"&&closed.merged===false&&closed.head?.sha===head,"Candidate closure not confirmed");
 return true;
}
export async function openPublicationCandidate({repo,ref,kind,baseSha,files,token,fetchFn=fetch,dryRun=true,reconcileStale=false}){
 if(repo!==REPO||ref!=="refs/heads/main")throw Error("Candidate writer must run on trusted main");
 const plan=candidatePlan({kind,baseSha,files});
 const conflicts=p=>{const ref=p.head?.ref??"";return ref.startsWith("ops/publication-candidate/"+kind+"/")||(["forum","forum-recovery"].includes(kind)&&["forum","forum-recovery"].some(k=>ref.startsWith("ops/publication-candidate/"+k+"/")));};
 if(dryRun)return {dryRun:true,branch:plan.branch,digest:plan.digest,paths:plan.files.map(f=>f.path)};
 if(!token)throw Error("Candidate transport credential missing");
 const api=async(path,method="GET",body,allowMissing=false,raw=false)=>{
  const r=await fetchFn("https://api.github.com/repos/"+REPO+path,{method,redirect:"error",signal:AbortSignal.timeout(25000),headers:{Authorization:"Bearer "+token,Accept:raw?"application/vnd.github.raw+json":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(allowMissing && method==="GET" && r.status===404)return null;
  if(!r.ok)throw Error("Candidate API HTTP "+r.status+" at "+method+" "+path);
  if(raw){const content=await r.text();if(Buffer.byteLength(content)>30_000_000)throw Error("Oversize candidate");return content;}
  return r.json();
 };
 const checkBase=async()=>{const r=await api("/git/ref/heads/main");if(r.object?.sha!==baseSha)throw Error("Main moved: rebuild candidate evidence");};
 await checkBase();
 let existing=await api("/pulls?state=open&base=main&per_page=100");
 if(!Array.isArray(existing)||existing.length>=100)throw Error("Incomplete candidate inventory");
 if(reconcileStale){
  for(const old of existing.filter(conflicts)){
   if(!Number.isSafeInteger(old.number)||!await reconcileExpiredMachineCandidate({api,number:old.number,baseSha}))throw Error("Outstanding candidate requires reconciliation");
  }
  await checkBase();
  existing=await api("/pulls?state=open&base=main&per_page=100");
 }
 if(!Array.isArray(existing)||existing.length>=100||existing.some(conflicts))throw Error("Outstanding or incomplete candidate inventory; reconcile first");
 const base=await api("/git/commits/"+baseSha);
 if(!shaOk(base.tree?.sha))throw Error("Missing base tree");
 const tree=await api("/git/trees","POST",{base_tree:base.tree.sha,tree:plan.files});
 if(!shaOk(tree.sha)||tree.sha===base.tree.sha)throw Error("No changed candidate tree");
 const refPath="/git/ref/heads/"+plan.branch;
 const old=await api(refPath,"GET",undefined,true);
 let commit;
 if(old){
  // Only a byte-identical candidate on the same verified parent is recoverable.
  if(!shaOk(old.object?.sha)||old.object?.type!=="commit"||old.ref!=="refs/heads/"+plan.branch)throw Error("Unverified orphan candidate ref");
  commit=await api("/git/commits/"+old.object.sha);
  if(commit.sha!==old.object.sha||commit.tree?.sha!==tree.sha||commit.parents?.length!==1||commit.parents[0].sha!==baseSha)throw Error("Orphan candidate does not match exact parent and tree");
 }else{
  commit=await api("/git/commits","POST",{message:"chore(publication): verified "+kind+" candidate",tree:tree.sha,parents:[baseSha]});
  if(!shaOk(commit.sha))throw Error("Candidate commit missing");
  await checkBase();
  await api("/git/refs","POST",{ref:"refs/heads/"+plan.branch,sha:commit.sha});
 }
 await checkBase();
 const current=await api(refPath);
 if(current.ref!=="refs/heads/"+plan.branch||current.object?.type!=="commit"||current.object?.sha!==commit.sha)throw Error("Candidate ref moved before PR creation");
 const pending=await api("/pulls?state=open&base=main&per_page=100");
 if(!Array.isArray(pending)||pending.length>=100||pending.some(conflicts))throw Error("Outstanding or incomplete candidate inventory; reconcile first");
 await checkBase();
 const pr=await api("/pulls","POST",{title:"Publication candidate: "+kind,head:plan.branch,base:"main",body:candidateBody(plan),maintainer_can_modify:false});
 if(!Number.isSafeInteger(pr.number)||pr.head?.sha!==commit.sha||pr.base?.ref!=="main")throw Error("Candidate PR not confirmed");
 return {dryRun:false,number:pr.number,sha:commit.sha,branch:plan.branch,digest:plan.digest};
}
