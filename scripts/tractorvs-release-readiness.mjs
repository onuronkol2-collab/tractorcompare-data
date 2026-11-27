import {readFile} from "node:fs/promises";
import {REPO,CONTEXT,eligible,evaluate,validSha} from "./tractorvs-release-readiness-policy.mjs";
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,"utf8"));
// Completion events run only from the trusted default branch. Resolve exactly
// one candidate PR and bind the decision to its current head, never event code.
const completion=event.workflow_run ?? event.check_run;
const candidates=completion?.pull_requests ?? [];
const n=event.pull_request?.number ?? (completion && candidates.length===1 ? candidates[0].number : Number(event.inputs?.pr_number));
if(completion && (!Array.isArray(candidates)||candidates.length!==1)){
 console.log("Completion event has no unique PR; no status write");process.exit(0);
}
if (process.env.GITHUB_REPOSITORY!==REPO || !Number.isSafeInteger(n) || n<1) throw Error("Invalid repository/PR");
const token=process.env.GH_TOKEN;
if(!token) throw Error("Readiness token unavailable");
const base="https://api.github.com/repos/"+REPO;
async function api(path,method="GET",body){
 const res=await fetch(base+path,{method,redirect:"error",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!res.ok)throw Error("GitHub API HTTP "+res.status);
 return {data:await res.json(),more:/rel="next"/.test(res.headers.get("link")??"")};
}
async function pages(path,key){
 const rows=[];
 for(let i=1;i<=5;i++){
  const {data,more}=await api(path+(path.includes("?")?"&":"?")+"per_page=100&page="+i);
  rows.push(...(key?data[key]:data));
  if(!more)return rows;
 }
 throw Error("Incomplete pagination");
}
const getPR=async()=> (await api("/pulls/"+n)).data;
const pr=await getPR();
const sha=pr.head?.sha;
if(!validSha(sha))throw Error("Invalid head");
if(completion && completion.head_sha!==sha){console.log("Superseded completion; no status write");process.exit(0);}
if(event.pull_request && event.pull_request.head?.sha!==sha){console.log("Superseded event");process.exit(0);}
if(pr.head?.repo?.full_name!==REPO || pr.base?.repo?.full_name!==REPO){console.log("Foreign PR: no writes");process.exit(0);}
const files=await pages("/pulls/"+n+"/files");
if(files.length!==pr.changed_files)throw Error("Incomplete changed-file inventory");
const target_url="https://github.com/"+REPO+"/actions/runs/"+process.env.GITHUB_RUN_ID;
const status=async(state,description)=>{
 const current=await getPR();
 if(current.head.sha!==sha || current.state!=="open"){console.log("Superseded/closed PR; no status write");return false;}
 await api("/statuses/"+sha,"POST",{context:CONTEXT,state,description:description.slice(0,135),target_url});
 return true;
};
if(!eligible(pr,files)){await status("failure","Outside initial automated UI scope; separate release review required");process.exit(0);}
if(!await status("pending","Waiting for current SHA release evidence"))process.exit(0);
try{
 const deadline=Date.now()+(completion?60_000:15*60_000);
 while(Date.now()<deadline){
  const current=await getPR();
  if(current.head.sha!==sha||current.state!=="open"){console.log("Superseded/closed PR");process.exit(0);}
  if(!eligible(current,files)){await status("failure","Eligibility changed");process.exit(0);}
  const main=(await api("/branches/main")).data.commit.sha;
  if(!validSha(main))throw Error("Invalid main SHA");
  const comparison=(await api("/compare/"+main+"..."+sha)).data;
  if(!["ahead","identical"].includes(comparison.status)){await status("failure","Update branch with current main and rerun all checks");process.exit(0);}
  const checks=await pages("/commits/"+sha+"/check-runs?filter=latest","check_runs");
  const statuses=await pages("/commits/"+sha+"/statuses");
  // API statuses are newest first; ignore older status attempts.
  const latest=[...new Map(statuses.slice().reverse().map(s=>[s.context,s])).values()];
  const decision=evaluate({sha,checks,statuses:latest});
  if(decision.state!=="pending"){
   const finalMain=(await api("/branches/main")).data.commit.sha;
   if(finalMain!==main){await status("failure","Main moved; update and revalidate");process.exit(0);}
   await status(decision.state,decision.reason);console.log(decision);process.exit(0);
  }
  console.log(decision.reason);
  if(completion){await status("pending",decision.reason);process.exit(0);}
  await new Promise(resolve=>setTimeout(resolve,30000));
 }
 await status("failure","Evidence deadline expired; no automatic publication");
}catch(e){
 console.error("Readiness verification failed:",String(e.message).slice(0,150));
 await status("failure","Readiness evidence unavailable; no automatic publication");
 process.exitCode=1;
}
