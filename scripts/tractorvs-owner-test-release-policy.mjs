import {REPO,requiredCandidateChecks,actionRunId,OLD_CONTEXT,trustedStatusRun} from "./tractorvs-protected-candidate-policy.mjs";
import {browserRequiredNames} from "./tractorvs-browser-checks.mjs";
export const OWNER="onuronkol2-collab",OWNER_ID=356616554;
export const WORKFLOW=".github/workflows/tractorvs-owner-test-release.yml";
const sha=s=>typeof s==="string"&&/^[a-f0-9]{40}$/.test(s);
const wf=n=>".github/workflows/"+n+".yml";
export function authorization(event,env,now=Date.now()){
 if(env.GITHUB_REPOSITORY!==REPO||env.GITHUB_REF!=="refs/heads/main"||env.GITHUB_WORKFLOW_REF!==REPO+"/"+WORKFLOW+"@refs/heads/main"||env.GITHUB_ACTOR!==OWNER||env.GITHUB_TRIGGERING_ACTOR!==OWNER||env.GITHUB_ACTOR_ID!==String(OWNER_ID)||event.sender?.id!==OWNER_ID||event.sender?.login!==OWNER)return null;
 let number,head,base,commentId=null;
 if(env.GITHUB_EVENT_NAME==="issue_comment"){
  const c=event.comment,match=typeof c?.body==="string"&&c.body.match(/^TRACTORVS TEST RELEASE ([a-f0-9]{40}) ([a-f0-9]{40})$/);
  if(event.action!=="created"||!event.issue?.pull_request||c?.user?.id!==OWNER_ID||c?.user?.login!==OWNER||c?.author_association!=="OWNER"||!match||!Number.isSafeInteger(c.id)||c.id<1||c.updated_at!==c.created_at)return null;
  const at=Date.parse(c.created_at);if(!Number.isFinite(at)||at>now+1000||now-at>2*60*60*1000)return null;
  number=event.issue.number;head=match[1];base=match[2];commentId=c.id;
 }else if(env.GITHUB_EVENT_NAME==="workflow_dispatch"){
  number=Number(event.inputs?.pr_number);head=event.inputs?.head_sha;base=event.inputs?.base_sha;
 }else return null;
 if(!Number.isSafeInteger(number)||number<1||!sha(head)||!sha(base)||head===base||env.GITHUB_SHA!==base)return null;
 return {number,head,base,commentId};
}
export function matchesAuthorizedPR(pr,selection,files){
 return pr?.number===selection.number&&pr.state==="open"&&!pr.draft&&pr.user?.id===OWNER_ID&&pr.user?.login===OWNER&&pr.head?.repo?.full_name===REPO&&pr.base?.repo?.full_name===REPO&&pr.base?.ref==="main"&&pr.head.sha===selection.head&&pr.base.sha===selection.base&&pr.mergeable===true&&["clean","unstable","has_hooks"].includes(pr.mergeable_state)&&!pr.requested_reviewers?.length&&!pr.requested_teams?.length&&!/^(qa|research|dependabot)\//i.test(pr.head.ref??"")&&!/\b(QA only|research only|draft|TEST only)\b/i.test(pr.title??"")&&Array.isArray(files)&&files.length===pr.changed_files&&files.length>0&&files.length<=300;
}
const origin=(c,r,runs,head)=>c.name===r.name&&c.app?.id===r.appId&&(!r.path||runs.some(x=>x.id===actionRunId(c)&&x.path===r.path&&x.event===r.event&&x.repository?.full_name===REPO&&x.head_repository?.full_name===REPO&&x.head_sha===head&&x.status==="completed"&&x.conclusion==="success"));
const allowedSkip=(c,runs,head)=>c.app?.id===15368&&runs.some(r=>r.id===actionRunId(c)&&r.event==="pull_request"&&r.repository?.full_name===REPO&&r.head_repository?.full_name===REPO&&r.head_sha===head&&((c.name==="build_and_reconcile"&&r.path===wf("tractorvs-sitemap-history"))||(c.name==="protected_candidate"&&[wf("tractorvs-sitemap-history"),wf("tractorvs-publication-autosync"),wf("tractorvs-forum-publication-autosync")].includes(r.path))));
export function assessOwnerEvidence({selection,checks,statuses,runs,files=[]}){
 const {head,base}=selection;
 if(!sha(head)||!sha(base)||!Array.isArray(checks)||!Array.isArray(statuses)||!Array.isArray(runs)||!browserRequiredNames(checks)||checks.some(c=>c.head_sha!==head))return false;
 const req=requiredCandidateChecks("sitemap").filter(r=>!r.name.startsWith("browser-projects ("));
 req.push(...browserRequiredNames(checks).map(name=>({name,appId:15368,path:wf("playwright-accessibility"),event:"pull_request"})));
 if(files.some(f=>/^(supabase\/|\.github\/workflows\/site-health-safety\.yml$)/.test(f.filename)))for(const name of ["isolated-rls (baseline)","isolated-rls (candidate)","isolated-rls (rollback)","dependency-audit","forum-clock"])req.push({name,appId:15368,path:wf("site-health-safety"),event:"pull_request"});
 if(files.some(f=>/^site\/src\//.test(f.filename)))req.push({name:"production-research-browser",appId:15368,path:wf("tractorvs-nonforum-research-qa"),event:"pull_request"});
 for(const r of req){const found=checks.filter(c=>origin(c,r,runs,head));if(found.length!==1||found[0].status!=="completed"||found[0].conclusion!=="success")return false;}
 for(const c of checks)if(c.status!=="completed"||!(c.conclusion==="success"||c.conclusion==="skipped"&&allowedSkip(c,runs,head)))return false;
 const latest=[...new Map(statuses.slice().reverse().map(s=>[s.context,s])).values()];
 for(const s of latest){
  // Only authenticated scope classification, not a technical failure.
  if(s.context===OLD_CONTEXT&&s.state==="failure"&&s.description==="Outside initial automated UI scope; separate release review required"&&trustedStatusRun(s,runs,base,wf("tractorvs-release-readiness")))continue;
  if(s.state!=="success")return false;
 }
 return true;
}
