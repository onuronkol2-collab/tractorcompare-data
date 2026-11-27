import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync} from "node:crypto";
import {readFileSync} from "node:fs";
import {runWritePilot} from "../../scripts/tractorvs-secure-publisher-write-pilot.mjs";
import {REPO,APP_ID} from "../../scripts/tractorvs-secure-publisher-pilot.mjs";
const {privateKey}=generateKeyPairSync("rsa",{modulusLength:2048,privateKeyEncoding:{format:"pem",type:"pkcs8"},publicKeyEncoding:{format:"pem",type:"spki"}});
const base="a".repeat(40),tree="b".repeat(40),newTree="c".repeat(40),head="d".repeat(40),branch="ops/secure-publisher-pilot/42",path="site/docs/secure-publisher-pilot-42.md";
const env={GITHUB_REPOSITORY:REPO,GITHUB_REF:"refs/heads/main",GITHUB_EVENT_NAME:"workflow_dispatch",APP_ID,APP_PRIVATE_KEY:privateKey,GITHUB_SHA:base,GITHUB_RUN_ID:"42"};
function mock(o={}){
 const calls=[];let reads=0;
 const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
 const fetchFn=async(url,opt)=>{
  const u=new URL(url),p=u.pathname.replace("/repos/"+REPO,""),m=opt.method,b=opt.body?JSON.parse(opt.body):null;calls.push({p,m,b});
  if(p==="/app")return response({id:Number(APP_ID),slug:"tractorvs-secure-publisher"});
  if(p==="/installation")return response({id:1,app_id:Number(APP_ID),repository_selection:"selected",permissions:{contents:"write",pull_requests:"write",metadata:"read"}});
  if(p==="/app/installations/1/access_tokens")return response({token:"synthetic-token",permissions:{contents:"write",pull_requests:"write",metadata:o.extra?"write":"read"}},201);
  if(p==="/installation/repositories")return response({total_count:1,repositories:[{full_name:REPO}]});
  if(p==="/git/ref/heads/main")return response({object:{sha:++reads===o.staleAt?head:base}});
  if(p==="/git/ref/heads/"+branch)return response({},o.duplicate?200:404);
  if(p==="/contents/"+path)return response({},404);
  if(p==="/git/commits/"+base)return response({sha:base,tree:{sha:tree}});
  if(p==="/git/trees")return response({sha:newTree},201);
  if(p==="/git/commits")return response({sha:head},201);
  if(p==="/git/refs")return response({ref:"refs/heads/"+branch,object:{sha:head}},201);
  if(p==="/compare/"+base+"..."+head)return response({status:"ahead",ahead_by:1,behind_by:0,files:[{filename:o.badDiff?"AGENTS.md":path,status:"added"}]});
  if(p==="/pulls")return response({number:9,state:"open",draft:true,head:{sha:head,ref:branch,repo:{full_name:REPO}},base:{sha:base,ref:"main",repo:{full_name:REPO}},user:{login:o.badBot?"someone":"tractorvs-secure-publisher[bot]"}},201);
  if(p==="/installation/token")return response(null,o.badRevoke?403:204);
  throw Error("Unexpected endpoint");
 };return {calls,fetchFn};
}
test("write pilot creates only isolated docs draft and revokes token",async()=>{
 const m=mock();assert.deepEqual(await runWritePilot({env,...m}),{number:9,head,branch,base});
 const writes=m.calls.filter(x=>x.m!=="GET");assert.deepEqual(writes.map(x=>x.p),["/app/installations/1/access_tokens","/git/trees","/git/commits","/git/refs","/pulls","/installation/token"]);
 assert.equal(writes[1].b.tree.length,1);assert.equal(writes[1].b.tree[0].path,path);assert.deepEqual(writes[2].b.parents,[base]);
 assert.equal(writes[3].b.ref,"refs/heads/"+branch);assert.equal(writes[4].b.draft,true);assert.equal(writes[4].b.head,branch);assert.equal(writes[5].m,"DELETE");
});
test("rejects stale main, duplicate ref, extra scope, bad diff or identity and revokes",async()=>{
 for(const o of [{staleAt:1},{staleAt:2},{staleAt:3},{duplicate:true},{extra:true},{badDiff:true},{badBot:true},{badRevoke:true}]){
  const m=mock(o);await assert.rejects(runWritePilot({env,...m}));assert.equal(m.calls.at(-1).p,"/installation/token");
  if(!o.badBot&&!o.badRevoke)assert.ok(!m.calls.some(c=>c.p==="/pulls"));
 }
 const m=mock();await assert.rejects(runWritePilot({env:{...env,GITHUB_REF:"refs/heads/other"},...m}));assert.equal(m.calls.length,0);
});
test("write pilot is explicit trusted main dispatch, no GITHUB_TOKEN write or automatic event",()=>{
 const w=readFileSync(new URL("../../.github/workflows/tractorvs-secure-publisher-write-pilot.yml",import.meta.url),"utf8");
 assert.ok(w.includes("on:\n  workflow_dispatch:\npermissions: {}"));assert.ok(w.includes("environment: secure-publisher"));assert.ok(w.includes("github.ref == 'refs/heads/main'"));assert.doesNotMatch(w,/contents:\s*write|pull-requests:\s*write|schedule:|pull_request_target:/);
});
