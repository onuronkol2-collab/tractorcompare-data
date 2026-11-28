import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {candidatePlan,openPublicationCandidate,reconcileExpiredMachineCandidate,REPO} from "../../scripts/tractorvs-publication-candidate.mjs";
const baseSha="a".repeat(40),tree="b".repeat(40),newTree="c".repeat(40),commit="d".repeat(40);
const cat={path:"site/src/data/public-catalog-sync.json",content:JSON.stringify({fingerprint:"e".repeat(64),scope:"aaufxtcvnzgavtlintiv",source:"anon_public_view",published_models:300})};
const forum={path:"site/src/data/public-forum-sync.json",content:JSON.stringify({fingerprint:"f".repeat(64),scope:"aaufxtcvnzgavtlintiv",source:"anon_public_forum_views",public_topics:0})};
const sitemap=[{path:"seo/sitemap-content-history.json",content:'{"pages":{}}'},{path:"site/src/data/sitemap-lastmod.json",content:"{}"}];
const input={repo:REPO,ref:"refs/heads/main",kind:"catalog",baseSha,files:[cat]};
test("all three scoped publication candidates are deterministic and dry run writes nothing",async()=>{
 for(const [kind,files] of [["catalog",[cat]],["forum",[forum]],["sitemap",sitemap]]){
  const plan=candidatePlan({kind,baseSha,files});
  assert.equal(plan.branch,candidatePlan({kind,baseSha,files:files.slice().reverse()}).branch);
  assert.match(plan.branch,/^ops\/publication-candidate\//);
  const r=await openPublicationCandidate({...input,kind,files,fetchFn:()=>{throw Error("network forbidden in dry run")}});
  assert.equal(r.dryRun,true);assert.equal(r.digest,plan.digest);
 }
});
test("rejects extra paths, duplicates, missing sitemap file, wrong source, wrong base and wrong repository",async()=>{
 for(const bad of [{files:[cat,forum]},{files:[cat,cat]},{kind:"sitemap",files:[sitemap[0]]},{files:[{...cat,path:"AGENTS.md"}]},{files:[{...cat,content:forum.content}]},{baseSha:"main"},{kind:"__proto__"}])assert.throws(()=>candidatePlan({...input,...bad}));
 await assert.rejects(openPublicationCandidate({...input,ref:"refs/heads/untrusted"}),/trusted main/);
 await assert.rejects(openPublicationCandidate({...input,repo:"foreign/repo"}),/trusted main/);
 await assert.rejects(openPublicationCandidate({...input,dryRun:false}),/credential missing/);
});
function mock({moveAt=0,existing=[],failRef=false,orphan=false,wrongParent=false,wrongTree=false,moveRef=false,latePending=false}={}){
 let reads=0,created=false,pullReads=0,refReads=0;const calls=[];
 const fetchFn=async(url,options)=>{
  const path=new URL(url).pathname.split("/repos/"+REPO)[1];
  const method=options.method,body=options.body?JSON.parse(options.body):null;
  calls.push({path,method,body});
  const reply=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
  if(path==="/git/ref/heads/main")return reply({object:{sha:++reads===moveAt?"9".repeat(40):baseSha}});
  if(path==="/pulls"&&method==="GET")return reply(++pullReads===2&&latePending?[{head:{ref:"ops/publication-candidate/catalog/other"}}]:existing);
  if(path.startsWith("/git/ref/heads/ops/publication-candidate/")){refReads++;return orphan||created?reply({ref:path.replace("/git/ref/","refs/"),object:{sha:moveRef&&refReads>1?tree:commit,type:"commit"}}):reply({},404);}
  if(path==="/git/commits/"+commit)return reply({sha:commit,tree:{sha:wrongTree?tree:newTree},parents:[{sha:wrongParent?tree:baseSha}]});
  if(path==="/git/commits/"+baseSha)return reply({tree:{sha:tree}});
  if(path==="/git/trees")return reply({sha:newTree},201);
  if(path==="/git/commits"&&method==="POST")return reply({sha:commit},201);
  if(path==="/git/refs"){created=!failRef;return reply({},failRef?422:201);}
  if(path==="/pulls"&&method==="POST")return reply({number:42,head:{sha:commit},base:{ref:"main"}},201);
  throw Error("unexpected endpoint");
 };
 return {fetchFn,calls};
}
test("live transport creates only candidate branch and PR with atomic tree commit",async()=>{
 const m=mock();const r=await openPublicationCandidate({...input,token:"fake",dryRun:false,fetchFn:m.fetchFn});
 assert.equal(r.number,42);assert.equal(r.sha,commit);
 const writes=m.calls.filter(c=>c.method!=="GET");
 assert.deepEqual(writes.map(c=>c.path),["/git/trees","/git/commits","/git/refs","/pulls"]);
 assert.deepEqual(writes[1].body.parents,[baseSha]);
 assert.equal(writes[2].body.ref,"refs/heads/"+r.branch);
 assert.equal(writes[3].body.head,r.branch);assert.equal(writes[3].body.base,"main");
});
test("stale main, outstanding candidate and ref collision fail closed without PR",async()=>{
 for(const options of [{moveAt:1},{moveAt:2},{moveAt:3},{existing:[{head:{ref:"ops/publication-candidate/catalog/old"}}]},{existing:Array.from({length:100},()=>({}))},{failRef:true}]){
  const m=mock(options);await assert.rejects(openPublicationCandidate({...input,token:"fake",dryRun:false,fetchFn:m.fetchFn}));
  assert.ok(!m.calls.some(c=>c.path==="/pulls"&&c.method==="POST"));
 }
});

test("orphan recovery accepts only the exact tree and parent; concurrent changes stop PR creation",async()=>{
 const m=mock({orphan:true});const result=await openPublicationCandidate({...input,token:"fake",dryRun:false,fetchFn:m.fetchFn});
 assert.equal(result.sha,commit);
 assert.deepEqual(m.calls.filter(c=>c.method!=="GET").map(c=>c.path),["/git/trees","/pulls"]);
 for(const bad of [{orphan:true,wrongParent:true},{orphan:true,wrongTree:true},{moveRef:true},{latePending:true},{moveAt:4}]){
  const n=mock(bad);await assert.rejects(openPublicationCandidate({...input,token:"fake",dryRun:false,fetchFn:n.fetchFn}));
  assert.ok(!n.calls.some(c=>c.path==="/pulls"&&c.method==="POST"));
 }
});

test("expired untouched App candidate may only be closed, never merged or deleted",async()=>{
 const plan=candidatePlan({kind:"catalog",baseSha,files:[cat]}),current="9".repeat(40),now=Date.parse("2026-11-27T16:00:00.000Z");
 const old=new Date(now-30*60000).toISOString(),recent=new Date(now-60000).toISOString();
 const body="Evidence base: "+baseSha+"\nCandidate digest: "+plan.digest+"\nPR-only staging. Independent release authorization and all applicable checks required.";
 const pr={number:42,state:"open",draft:false,merged:false,user:{login:"tractorvs-secure-publisher[bot]"},title:"Publication candidate: catalog",body,created_at:old,updated_at:old,head:{sha:commit,ref:plan.branch,repo:{full_name:REPO}},base:{ref:"main",sha:current,repo:{full_name:REPO}},requested_reviewers:[],requested_teams:[],labels:[],assignees:[]};
 function mock({override={},comment=false,commentRows=null,review=false,changed=false,wrongBlob=false,moved=false,ancestryMismatch=false,baseChanged=false}={}){
  let reads=0;const writes=[];
  const api=async(path,method="GET",data,missing,raw)=>{
   if(method!=="GET"){writes.push({path,method,data});return {...pr,state:"closed"};}
   if(path==="/pulls/42")return {...pr,...override,...(++reads>1?{...(changed?{updated_at:recent}:{}),...(baseChanged?{base:{...pr.base,sha:current}}:{})}:{})};
   if(path==="/git/commits/"+commit)return {sha:commit,parents:[{sha:baseSha}]};
   if(path==="/contents/"+cat.path+"?ref="+commit){assert.equal(raw,true);return cat.content;}
   if(path==="/compare/"+baseSha+"..."+current+"?per_page=1")return {status:ancestryMismatch?"diverged":"ahead",behind_by:ancestryMismatch?1:0,merge_base_commit:{sha:ancestryMismatch?tree:baseSha}};
   if(path.startsWith("/compare/"))return {status:"ahead",ahead_by:1,behind_by:0,files:[{filename:cat.path,status:"modified",sha:wrongBlob?tree:createHash("sha1").update("blob "+Buffer.byteLength(cat.content)+"\0").update(cat.content).digest("hex")}]};
   if(path==="/pulls/42/reviews?per_page=100")return review?[{}]:[];
   if(path==="/issues/42/comments?per_page=100")return commentRows??(comment?[{}]:[]);
   if(path==="/git/ref/heads/"+plan.branch)return {ref:"refs/heads/"+plan.branch,object:{type:"commit",sha:commit}};
   if(path==="/git/ref/heads/main")return {object:{sha:moved?tree:current}};
   throw Error("unexpected endpoint");
  };return {api,writes};
 }
 const receipt={user:{id:73139402,login:"cloudflare-workers-and-pages[bot]",type:"Bot"},author_association:"NONE",performed_via_github_app:{id:85455,slug:"cloudflare-workers-and-pages",owner:{login:"cloudflare"}},body:"## 🚀 Deploying Preview to Cloudflare 🚀\n<!-- Preview URL -->\n### Preview URL: https://preview-tractorvs-site.onuronkol2.workers.dev (commit "+commit.slice(0,7)+")\n<!-- Preview Deployments -->\n<a href=\"https://dash.cloudflare.com/?to=/preview\">View logs</a>"};
 const preview=mock({commentRows:[receipt]});assert.equal(await reconcileExpiredMachineCandidate({api:preview.api,number:42,baseSha:current,now}),true);assert.equal(preview.writes.length,1);
 for(const rows of [[receipt,{}],[{...receipt,user:{...receipt.user,id:1}}],[{...receipt,performed_via_github_app:null}],[{...receipt,body:receipt.body.replace(commit.slice(0,7),"0000000")}],[{...receipt,body:receipt.body.replace("https://dash.cloudflare.com/","https://evil.example/?next=https://dash.cloudflare.com/")}],[{...receipt,body:receipt.body.replace("https://dash.cloudflare.com/","https://dash.cloudflare.com.evil.example/")}],[{...receipt,body:receipt.body.replace("https://preview-tractorvs-site.onuronkol2.workers.dev","https://preview-tractorvs-site.onuronkol2.workers.dev.evil.example")}],Array.from({length:100},()=>receipt)]){
  const m=mock({commentRows:rows});assert.equal(await reconcileExpiredMachineCandidate({api:m.api,number:42,baseSha:current,now}),false);assert.equal(m.writes.length,0);
 }
 const staleBase={...pr.base,sha:baseSha};
 const stale=mock({override:{base:staleBase}});assert.equal(await reconcileExpiredMachineCandidate({api:stale.api,number:42,baseSha:current,now}),true);assert.deepEqual(stale.writes,[{path:"/pulls/42",method:"PATCH",data:{state:"closed"}}]);
 for(const options of [{override:{base:staleBase},ancestryMismatch:true},{override:{base:staleBase},baseChanged:true},{override:{base:{...pr.base,sha:tree}}},{override:{base:staleBase,user:{login:"onuronkol2-collab"}}},{override:{base:staleBase},comment:true},{override:{base:staleBase},review:true}]){
  const m=mock(options);assert.equal(await reconcileExpiredMachineCandidate({api:m.api,number:42,baseSha:current,now}),false);assert.equal(m.writes.length,0);
 }
 const good=mock();assert.equal(await reconcileExpiredMachineCandidate({api:good.api,number:42,baseSha:current,now}),true);
 assert.deepEqual(good.writes,[{path:"/pulls/42",method:"PATCH",data:{state:"closed"}}]);
 for(const options of [{override:{user:{login:"owner"}}},{override:{draft:true}},{override:{created_at:recent}},{override:{updated_at:recent}},{override:{requested_reviewers:[{}]}},{override:{labels:[{}]}},{comment:true},{review:true},{changed:true}]){
  const m=mock(options);assert.equal(await reconcileExpiredMachineCandidate({api:m.api,number:42,baseSha:current,now}),false);assert.equal(m.writes.length,0);
 }
 for(const options of [{override:{body:"changed"}},{wrongBlob:true},{moved:true}]){const m=mock(options);await assert.rejects(reconcileExpiredMachineCandidate({api:m.api,number:42,baseSha:current,now}));assert.equal(m.writes.length,0);}
});
