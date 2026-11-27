import {openPublicationCandidate} from "./tractorvs-publication-candidate.mjs";
/**
 * TractorVS zero-paid, anon-only forum revision listener.
 *
 * This DOES NOT publish, approve, translate, or read private posts. It watches
 * already-moderated and consent-safe public language views. A changed snapshot
 * requests a new static Cloudflare build. Hiding a harmful post changes the
 * fingerprint too, so moderation removal is not blocked by a count floor.
 */
import {fetchPublicRows} from "../site/src/lib/forum-public-rows.mjs";
import {createHash} from "node:crypto";
import {appendFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const REPO="onuronkol2-collab/tractorcompare-data";
export const REVISION_PATH="site/src/data/public-forum-sync.json";
const PROJECT="aaufxtcvnzgavtlintiv";
const API="https://"+PROJECT+".supabase.co/rest/v1";
const COLLECTIONS=[
 {table:"tc_forum_localized_topics",fields:"id,topic_id,locale,original_locale,slug,category,tractor_id,status,created_at,updated_at,title,body,seo_ready,machine_translated"},
 {table:"tc_forum_localized_replies",fields:"id,topic_id,locale,original_locale,status,created_at,body,machine_translated"},
 {table:"tc_forum_public_media",fields:"id,topic_id,reply_id,position,alt_text,status,locale,created_at"}
];

export function validateScope(repo,ref){
 if(repo!==REPO||ref!=="refs/heads/main")throw Error("Forum sync is allowed only on TractorVS main.");
}
export function validateAnon(jwt){
 const p=jwt?.split(".");
 if(p?.length!==3)throw Error("Legacy anon JWT required for read-only forum sync.");
 try{
  const payload=JSON.parse(Buffer.from(p[1],"base64url").toString("utf8"));
  if(payload.role!=="anon")throw Error("Only anon JWT is allowed, never service_role.");
 }catch(err){throw Error("Non-anonymous or invalid JWT (forum sync blocked)");}
}
export async function fingerprintPublicForum({jwt,fetchFn=fetch}){
 validateAnon(jwt);
 const hash=createHash("sha256");
 let total=0,publicTopics=0,publicReplies=0,publicImages=0,indexableTopics=0;
 for(const {table,fields} of COLLECTIONS){
  const rows=await fetchPublicRows({api:API,table,fields,headers:{apikey:jwt,Authorization:"Bearer "+jwt},fetchFn});
  total+=rows.length;
  if(table==="tc_forum_localized_topics"){
   publicTopics=rows.length;
   indexableTopics=rows.filter(x=>x.seo_ready===true && (x.machine_translated || (x.title?.trim().length>=12 && x.body?.trim().length>=150))).length;
  }else if(table==="tc_forum_localized_replies")publicReplies=rows.length;
  else publicImages=rows.length;
  for(const row of rows)hash.update(JSON.stringify([table,row])+"\n");
 }
 return {fingerprint:hash.digest("hex"),public_topics:publicTopics,
  indexable_topics:indexableTopics,public_replies:publicReplies,public_images:publicImages,public_rows:total,
  source:"anon_public_forum_views",scope:PROJECT};
}
async function fetchRevision({token,fetchFn}){
 const res=await fetchFn("https://api.github.com/repos/"+REPO+"/contents/"+REVISION_PATH+"?ref=main",{
  headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json"},
  signal:AbortSignal.timeout(20000)
 });
 if(res.status===404)return {sha:null,record:null};
 if(res.status!==200)throw Error("Current forum revision read failed ("+res.status+")");
 const data=await res.json();
 if(typeof data.sha!=="string"||data.encoding!=="base64"||typeof data.content!=="string")
  throw Error("Current forum revision is invalid");
 return {sha:data.sha,record:JSON.parse(Buffer.from(data.content.replace(/\s/g,""),"base64").toString("utf8"))};
}
export async function runForumSync({repo,ref,jwt,token,fetchFn=fetch,dryRun=false,now=new Date(),candidateBaseSha}){
 validateScope(repo,ref);validateAnon(jwt);
 if(!token)throw Error("Repository-only GitHub token required.");
 let latest=await fingerprintPublicForum({jwt,fetchFn});
 let previous=await fetchRevision({token,fetchFn});
 // Different main-branch writers use separate workflow concurrency groups.
 // On a 409, recompute the moderated public view and refresh the remote SHA
 // once. Never commit an unverified stale snapshot or retry auth failures.
 for(let attempt=0;attempt<2;attempt++){
  if(previous.record?.fingerprint===latest.fingerprint)
   return {changed:false,committed:false,
    reason:attempt===0?"public_forum_unchanged":"public_forum_already_synced_after_conflict",...latest};
  const payload=JSON.stringify({...latest,generated_at:now.toISOString()},null,2)+"\n";
  if(candidateBaseSha){
   const candidate=await openPublicationCandidate({repo,ref,kind:"forum",baseSha:candidateBaseSha,files:[{path:REVISION_PATH,content:payload}],dryRun:true});
   return {changed:true,committed:false,reason:"candidate_plan_no_commit",candidate,...latest};
  }
  if(dryRun)return {changed:true,committed:false,reason:"dry_run_no_commit",...latest};
  const request={message:"chore(site): refresh moderated forum public pages ("+latest.public_topics+" locale topics)",
   branch:"main",content:Buffer.from(payload).toString("base64")};
  if(previous.sha)request.sha=previous.sha;
  const res=await fetchFn("https://api.github.com/repos/"+REPO+"/contents/"+REVISION_PATH,{
   method:"PUT",
   headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"application/json"},
   body:JSON.stringify(request),signal:AbortSignal.timeout(25000)
  });
  if(res.status===409&&attempt===0){
   previous=await fetchRevision({token,fetchFn});
   latest=await fingerprintPublicForum({jwt,fetchFn});
   continue;
  }
  if(res.status!==200&&res.status!==201)throw Error("Forum fingerprint commit failed with HTTP "+res.status);
  const data=await res.json();
  if(typeof data?.commit?.sha!=="string")throw Error("Forum refresh commit not confirmed.");
  return {changed:true,committed:true,reason:"moderated_forum_site_refresh_requested",...latest,commit:data.commit.sha};
 }
 throw Error("Forum fingerprint commit could not complete after bounded conflict retry.");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=await runForumSync({repo:process.env.GITHUB_REPOSITORY,ref:process.env.GITHUB_REF,
  jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT,token:process.env.GITHUB_TOKEN,
  dryRun:process.env.TRACTORVS_FORUM_DRY_RUN==="true",
  candidateBaseSha:process.env.TRACTORVS_FORUM_DRY_RUN==="true"?process.env.GITHUB_SHA:undefined});
 const summary="TractorVS forum sync: "+r.reason+"; public_locale_topics="+r.public_topics+
 "; indexed_eligible="+r.indexable_topics+"; visible_replies="+r.public_replies+"; commit="+r.committed;
 console.log(summary);
 if(process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,"## Moderated forum sync\n\n"+summary+
   "\n\nThis updates static build input; it does not prove Google indexing.\n");
}
