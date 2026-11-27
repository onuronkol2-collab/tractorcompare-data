import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync,createVerify} from "node:crypto";
import {readFileSync} from "node:fs";
import {REPO,APP_ID,appJwt,runReadonlyPilot} from "../../scripts/tractorvs-secure-publisher-pilot.mjs";
const {privateKey,publicKey}=generateKeyPairSync("rsa",{modulusLength:2048,privateKeyEncoding:{format:"pem",type:"pkcs8"},publicKeyEncoding:{format:"pem",type:"spki"}});
const env={GITHUB_REPOSITORY:REPO,GITHUB_REF:"refs/heads/main",GITHUB_EVENT_NAME:"workflow_dispatch",APP_ID,APP_PRIVATE_KEY:privateKey};
const now=Date.parse("2026-11-27T09:00:00.000Z");
test("app JWT has a valid signature and bounded lifetime",()=>{
 const [h,p,s]=appJwt(privateKey,APP_ID,now).split(".");
 assert.deepEqual(JSON.parse(Buffer.from(h,"base64url")), {alg:"RS256",typ:"JWT"});
 const body=JSON.parse(Buffer.from(p,"base64url"));
 assert.equal(body.iss,APP_ID);assert.equal(body.exp-body.iat,540);
 assert.ok(createVerify("RSA-SHA256").update(h+"."+p).end().verify(publicKey,Buffer.from(s,"base64url")));
});
const fixture=(options={})=>{
 const calls=[],masks=[],token="synthetic-installation-token";
 const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
 const fetchFn=async(url,opt)=>{
  const p=new URL(url).pathname;calls.push({p,method:opt.method,body:opt.body?JSON.parse(opt.body):null});
  if(p==="/app")return response({id:Number(APP_ID),slug:"tractorvs-secure-publisher"});
  if(p==="/repos/"+REPO+"/installation")return response({app_id:Number(APP_ID),id:42,repository_selection:"selected",permissions:{contents:"write",pull_requests:"write",metadata:"read"},...(options.installation??{})});
  if(p==="/app/installations/42/access_tokens")return response({token,permissions:{contents:options.writeToken?"write":"read",pull_requests:"read",metadata:"read"}},201);
  if(p==="/installation/repositories")return response({total_count:options.extraRepo?2:1,repositories:[{full_name:REPO}]});
  if(p==="/repos/"+REPO+"/branches/main")return response({commit:{sha:"a".repeat(40)}},options.failRead?403:200);
  if(p==="/installation/token")return response(null,options.failRevoke?403:204);
  throw Error("Unexpected endpoint");
 };
 return {calls,masks,fetchFn,mask:v=>masks.push(v)};
};
test("pilot requests only read access to this repository and revokes the token",async()=>{
 const m=fixture();const r=await runReadonlyPilot({env,now,...m});
 assert.deepEqual(r,{appId:Number(APP_ID),appSlug:"tractorvs-secure-publisher",installationId:42,main:"a".repeat(40)});
 assert.deepEqual(m.calls.filter(x=>x.method!=="GET"),[{p:"/app/installations/42/access_tokens",method:"POST",body:{repositories:["tractorcompare-data"],permissions:{contents:"read",pull_requests:"read"}}},{p:"/installation/token",method:"DELETE",body:null}]);
 assert.equal(m.masks.length,2);assert.equal(m.masks[1],"synthetic-installation-token");
});
test("rejects foreign context, unexpected permissions and excess scope; revokes on every post-grant failure",async()=>{
 for(const patch of [{GITHUB_REF:"refs/heads/feature"},{GITHUB_EVENT_NAME:"pull_request_target"},{APP_ID:"1"},{APP_PRIVATE_KEY:""}]){
  const m=fixture();await assert.rejects(runReadonlyPilot({env:{...env,...patch},now,...m}));assert.equal(m.calls.length,0);
 }
 const wrong=fixture({installation:{permissions:{contents:"write",pull_requests:"write",metadata:"read",actions:"write"}}});
 await assert.rejects(runReadonlyPilot({env,now,...wrong}));assert.ok(wrong.calls.every(x=>x.method==="GET"));
 for(const options of [{writeToken:true},{extraRepo:true},{failRead:true},{failRevoke:true}]){
  const m=fixture(options);await assert.rejects(runReadonlyPilot({env,now,...m}));
  assert.equal(m.calls.at(-1).p,"/installation/token");assert.equal(m.calls.at(-1).method,"DELETE");
 }
});
test("credential pilot has no scheduled, PR, or write-permission workflow trigger",()=>{
 const w=readFileSync(new URL("../../.github/workflows/tractorvs-secure-publisher-pilot.yml",import.meta.url),"utf8");
 assert.ok(w.includes("on:\n  workflow_dispatch:\npermissions: {}"));
 assert.ok(w.includes("environment: secure-publisher"));
 assert.ok(w.includes("github.ref == 'refs/heads/main'"));
 assert.ok(w.includes("persist-credentials: false"));
 assert.doesNotMatch(w,/contents:\s*write|pull-requests:\s*write|schedule:|pull_request_target:/);
});
