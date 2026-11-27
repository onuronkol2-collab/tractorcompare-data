// Trusted-main only; never checkout, import, build or run candidate code.
import {readFileSync,appendFileSync} from "node:fs";
import {authorization,matchesAuthorizedPR,assessOwnerEvidence,OWNER,OWNER_ID} from "./tractorvs-owner-test-release-policy.mjs";
import {REPO,assertProtectedReleaseRule,actionRunId} from "./tractorvs-protected-candidate-policy.mjs";
import {withAppToken} from "./tractorvs-integrated-publication-pilot.mjs";
const env=process.env,root="https://api.github.com/repos/"+REPO;
const event=JSON.parse(readFileSync(env.GITHUB_EVENT_PATH,"utf8"));
const must=(v,m)=>{if(!v)throw Error(m);};
const selection=authorization(event,env);
must(selection,"Missing exact owner TEST release authorization");
const {number,head,base,commentId}=selection;
const client=token=>async(path,method="GET",body)=>{
 const r=await fetch(root+path,{method,redirect:"error",signal:AbortSignal.timeout(20000),headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 must(r.ok,"GitHub API HTTP "+r.status);
 return {data:r.status===204?null:await r.json(),more:/rel="next"/.test(r.headers.get("link")??"")};
};
const api=client(env.GH_TOKEN),get=async(a,p)=>(await a(p)).data;
async function pages(path,key){
 const result=[];for(let page=1;page<=5;page++){const {data,more}=await api(path+(path.includes("?")?"&":"?")+"per_page=100&page="+page);const a=key?data[key]:data;must(Array.isArray(a),"Incomplete inventory");result.push(...a);if(!more)return result;}throw Error("Pagination limit");
}
async function verify({allowClosed=false}={}){
 must(authorization(event,env),"Authorization expired or invalid");
 if(commentId!==null){
  const c=await get(api,"/issues/comments/"+commentId);
  must(c.user?.id===OWNER_ID&&c.user?.login===OWNER&&c.author_association==="OWNER"&&c.body===event.comment.body&&c.created_at===event.comment.created_at&&c.updated_at===c.created_at,"Owner authorization comment changed");
 }
 assertProtectedReleaseRule(await get(api,"/rulesets/28247144"));
 must((await get(api,"/git/ref/heads/main")).object?.sha===base,"Main changed; new TEST evidence required");
 const pr=await get(api,"/pulls/"+number);
 if(allowClosed&&pr.number===number&&pr.state==="closed"){
  console.log("No release: exact PR is already closed. Protected ruleset verified; no credentials or writes used.");
  return false;
 }
 const [files,checks,statuses,reviews]=await Promise.all([pages("/pulls/"+number+"/files"),pages("/commits/"+head+"/check-runs?filter=latest","check_runs"),pages("/commits/"+head+"/statuses"),pages("/pulls/"+number+"/reviews")]);
 must(matchesAuthorizedPR(pr,selection,files),"Not the reviewed exact open owner PR");
 const cmp=await get(api,"/compare/"+base+"..."+head);must(cmp.status==="ahead"&&cmp.behind_by===0&&cmp.merge_base_commit?.sha===base,"PR not current with main");
 const by=new Map(reviews.filter(x=>x.user?.login&&["APPROVED","CHANGES_REQUESTED","DISMISSED"].includes(x.state)).map(x=>[x.user.login,x.state]));
 must(![...by.values()].includes("CHANGES_REQUESTED"),"Outstanding review");
 const statusId=s=>{const m=typeof s.target_url==="string"&&s.target_url.match(/^https:\/\/github\.com\/onuronkol2-collab\/tractorcompare-data\/actions\/runs\/([1-9][0-9]*)$/);return m?Number(m[1]):null;};
 const ids=[...new Set([...checks.map(actionRunId),...statuses.map(statusId)].filter(x=>Number.isSafeInteger(x)&&x>0))];must(ids.length<=80,"Unexpected run inventory");
 const runs=[];for(let i=0;i<ids.length;i+=8)runs.push(...await Promise.all(ids.slice(i,i+8).map(id=>get(api,"/actions/runs/"+id))));
 must(assessOwnerEvidence({selection,files,checks,statuses,runs}),"Exact trusted technical evidence incomplete or failed");
 console.log("Exact owner-authorized PR and technical evidence verified: #"+number+" "+head);
 return true;
}
try{
 if(process.argv[2]==="scan"){
  const ready=await verify({allowClosed:true});
  appendFileSync(env.GITHUB_OUTPUT,"ready="+ready+"\n");
 }
 else if(process.argv[2]==="merge"){
  await verify();
  must(env.PILOT_OWNER_RELEASE==="true"&&env.CUTOVER_ENABLED==="true","Protected owner release disabled");
  const result=await withAppToken(env,async token=>{
   const write=client(token);
   await verify();
   assertProtectedReleaseRule(await get(write,"/rulesets/28247144"));
   must((await get(write,"/git/ref/heads/main")).object?.sha===base,"Main changed");
   const pr=await get(write,"/pulls/"+number);
   must(pr.head?.sha===head&&pr.base?.sha===base&&pr.state==="open"&&!pr.draft&&pr.mergeable===true,"PR changed");
   const m=(await write("/pulls/"+number+"/merge","PUT",{sha:head,merge_method:"squash",commit_title:"chore: owner TEST verified release (#"+number+")"})).data;
   must(m?.merged===true&&/^[a-f0-9]{40}$/.test(m.sha),"Merge not confirmed");
   const final=await get(write,"/pulls/"+number);must(final.merged===true&&final.merge_commit_sha===m.sha&&final.head.sha===head,"Merged identity mismatch");return m.sha;
  },{mask:s=>console.log("::add-mask::"+s)});
  appendFileSync(env.GITHUB_OUTPUT,"merged_sha="+result+"\n");
 }else throw Error("Unknown operation");
}catch(e){console.error("Owner release stopped: "+String(e.message).slice(0,180));process.exitCode=1;}
