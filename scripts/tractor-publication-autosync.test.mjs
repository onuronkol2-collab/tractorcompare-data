import test from "node:test";
import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import {
  REPO,SNAPSHOT_PATH,validateScope,validateAnon,fingerprintPublicView,
  runPublicationSync,guardMassUnpublish,
} from "./tractor-publication-autosync.mjs";

const jwt="e30."+Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".sig";
const base={repo:REPO,ref:"refs/heads/main",jwt,token:"fake-gh-token",
  now:new Date("2026-11-20T17:00:00.000Z")};
const rows=[
 {tractor_id:"a",model_name:"Tractor A",spec_id:"s1",spec_value:"100",source_url:"https://example.com",verified_at:"2026-11-20"},
 {tractor_id:"a",model_name:"Tractor A",spec_id:"s2",spec_value:"200",source_url:"https://example.com",verified_at:null},
 {tractor_id:"b",model_name:"Tractor B",spec_id:"s3",spec_value:"300",source_url:"https://example.com",verified_at:"2026-11-20"},
];
function fakeApi({ prior=null, oversized=false, failAuth=false }={}){
  const calls=[];
  const fetchFn=async(url,init={})=>{
    const kind=url.includes("/rest/v1/tractorvs_public_specs")?"supabase":
      url.includes("/contents/"+SNAPSHOT_PATH)?"github":"unexpected";
    calls.push(kind+":"+(init.method||"GET"));
    if(kind==="supabase"){
      assert.equal(init.headers.apikey,jwt);
      assert.equal(init.headers.Authorization,"Bearer "+jwt);
      assert.equal(init.headers.Prefer,"count=exact");
      assert.match(url,/order=tractor_id.asc/);
      if(failAuth)return new Response("{}",{status:401});
      const parsed=new URL(url);
      const off=Number(parsed.searchParams.get("offset"));
      const records=oversized?[]:rows.slice(off,off+500);
      const total=oversized?16000:rows.length;
      const last=oversized?0:off+records.length-1;
      return new Response(JSON.stringify(records),{
        status:206,headers:{"content-range":off+"-"+last+"/"+total},
      });
    }
    if(kind==="github"&&(init.method||"GET")==="GET"){
      if(prior==null)return new Response("{}",{status:404});
      return new Response(JSON.stringify({
        sha:"existing-blob",encoding:"base64",
        content:Buffer.from(JSON.stringify(prior)).toString("base64"),
      }),{status:200});
    }
    if(kind==="github"&&init.method==="PUT"){
      assert.equal(init.headers.Authorization,"Bearer fake-gh-token");
      const payload=JSON.parse(init.body);
      assert.equal(payload.branch,"main");
      assert.equal(payload.message.startsWith("chore(site): sync public catalogue revision"),true);
      const snapshot=JSON.parse(Buffer.from(payload.content,"base64").toString("utf8"));
      assert.equal(snapshot.published_models,2);
      assert.equal(snapshot.public_rows,3);
      assert.equal(snapshot.source,"anon_public_view");
      assert.ok(snapshot.generated_at.startsWith("2026-"));
      if(prior)assert.equal(payload.sha,"existing-blob");
      else assert.equal(payload.sha,undefined);
      return new Response(JSON.stringify({commit:{sha:"new-gh-commit"}}),{status:201});
    }
    throw Error("Unexpected network call "+url);
  };
  return {calls,fetchFn};
}
test("only trusted main branch may sync; secret keys and non-anon JWTs rejected",()=>{
  assert.doesNotThrow(()=>validateScope(REPO,"refs/heads/main"));
  assert.throws(()=>validateScope("someone/fork","refs/heads/main"),/only authorized/);
  assert.throws(()=>validateScope(REPO,"refs/heads/pr"),/only authorized/);
  assert.doesNotThrow(()=>validateAnon(jwt));
  assert.throws(()=>validateAnon("sb_secret_test"),/legacy anon/);
  assert.throws(()=>validateAnon("e30."+Buffer.from(JSON.stringify({role:"service_role"})).toString("base64url")+".x"),/forbidden/);
});
test("public-only fingerprint is deterministic and includes every published spec",async()=>{
  const mock=fakeApi();
  const a=await fingerprintPublicView({jwt,fetchFn:mock.fetchFn});
  const b=await fingerprintPublicView({jwt,fetchFn:mock.fetchFn});
  assert.equal(a.fingerprint,b.fingerprint);
  assert.equal(a.published_models,2);
  assert.equal(a.public_rows,3);
  assert.deepEqual(mock.calls,["supabase:GET","supabase:GET"]);
});
test("first scheduled scan only commits a tiny public revision marker",async()=>{
  const mock=fakeApi();
  const res=await runPublicationSync({...base,fetchFn:mock.fetchFn});
  assert.equal(res.committed,true);
  assert.equal(res.reason,"main_site_revision_committed");
  assert.deepEqual(mock.calls,["supabase:GET","github:GET","github:PUT"]);
});
test("same dataset never creates a new commit or rebuild loop",async()=>{
  const probe=await fingerprintPublicView({jwt,fetchFn:fakeApi().fetchFn});
  const mock=fakeApi({prior:{fingerprint:probe.fingerprint}});
  const res=await runPublicationSync({...base,fetchFn:mock.fetchFn});
  assert.equal(res.committed,false);
  assert.equal(res.reason,"public_catalogue_unchanged");
  assert.deepEqual(mock.calls,["supabase:GET","github:GET"]);
});
test("dry run checks public evidence revision but never writes to GitHub",async()=>{
  const mock=fakeApi();
  const res=await runPublicationSync({...base,dryRun:true,fetchFn:mock.fetchFn});
  assert.equal(res.changed,true);
  assert.equal(res.committed,false);
  assert.deepEqual(mock.calls,["supabase:GET","github:GET"]);
});
test("invalid credentials, incomplete counts, branch errors stop before mutation",async()=>{
  const fail=fakeApi({failAuth:true});
  await assert.rejects(runPublicationSync({...base,fetchFn:fail.fetchFn}),/HTTP 401/);
  assert.deepEqual(fail.calls,["supabase:GET"]);
  const tooLarge=fakeApi({oversized:true});
  await assert.rejects(runPublicationSync({...base,fetchFn:tooLarge.fetchFn}),/unexpectedly large/);
  assert.deepEqual(tooLarge.calls,["supabase:GET"]);
  let calls=0;
  await assert.rejects(runPublicationSync({...base,ref:"refs/heads/review",fetchFn:async()=>{calls++;throw Error("network should never run")}}),/only authorized/);
  assert.equal(calls,0);
});
test("fingerprint pagination handles 500+ row public views without skipping",async()=>{
  const page=Array.from({length:501},(_,i)=>({
    tractor_id:i<250?"first":"second",model_name:"Model "+(i<250?"1":"2"),spec_id:"s"+i,spec_value:String(i),
  }));
  const mock=async(url,init)=>{
    const parsed=new URL(url),offset=Number(parsed.searchParams.get("offset"));
    const data=page.slice(offset,offset+500);
    assert.equal(init.headers.Prefer,"count=exact");
    return new Response(JSON.stringify(data),{status:206,headers:{"content-range":offset+"-"+(offset+data.length-1)+"/501"}});
  };
  const result=await fingerprintPublicView({jwt,fetchFn:mock});
  assert.equal(result.public_rows,501);
  assert.equal(result.published_models,2);
});
test("mass-unpublish guard blocks unintended static site rollbacks",async()=>{
 assert.doesNotThrow(()=>guardMassUnpublish({published_models:172},{published_models:164}));
 assert.throws(()=>guardMassUnpublish({published_models:172},{published_models:163}),
  /Published catalogue regression blocked/);
 const mock=fakeApi({prior:{fingerprint:"old",published_models:200,source:"anon_public_view"}});
 await assert.rejects(runPublicationSync({...base,fetchFn:mock.fetchFn}),/regression blocked/);
 assert.deepEqual(mock.calls,["supabase:GET","github:GET"],
   "A regression must not create a GitHub release commit");
});


test("reviewed publication checkpoint pushes immediately trigger anon-only catalog sync on trusted main",()=>{
  const workflow=readFileSync(new URL("../.github/workflows/tractorvs-publication-autosync.yml",import.meta.url),"utf8");
  const push=workflow.slice(workflow.indexOf("  push:"),workflow.indexOf("  pull_request:"));
  assert.ok(push.includes("branches: [main]"));
  assert.ok(push.includes('      - "site/docs/publication-checkpoints/**"'));
  assert.ok(workflow.includes('cron: "17,47 * * * *"'));
  assert.ok(workflow.includes("github.event_name != 'pull_request'"));
  assert.ok(workflow.includes("github.repository == 'onuronkol2-collab/tractorcompare-data'"));
  assert.ok(workflow.includes("github.ref == 'refs/heads/main'"));
  assert.ok(workflow.includes("TRACTORVS_SUPABASE_ANON_JWT"));
  assert.doesNotMatch(workflow,/SUPABASE_SERVICE_ROLE|GEMINI_API_KEY|TRACTORVS_QUEUE_SECRET/);
});
