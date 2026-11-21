import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 allowedOemUrl,validModelMention,scrubMarkup,readOemDocument,robotsAllowed,
 MAX_HTML_BYTES,MAX_PDF_BYTES,MAX_PER_RUN,aggregateResults,
 MAX_DRAFT_IDS_PER_LOOKUP,draftIdBatches,safeCollectorQueryFailure
} from "../supabase/functions/tractor-oem-free-collector/policy.mjs";
import {validateReceipt,runFreeCollector} from "./tractor-oem-free-dispatch.mjs";

test("allow only exact OEM-owned HTTPs hosts; reject SSRF-shaped URLs",()=>{
 assert.equal(MAX_PER_RUN,3);
 assert.ok(allowedOemUrl("https://www.antoniocarraro.it/en/catalogue/tigre-3800-f#tab","Antonio Carraro")
  .endsWith("/en/catalogue/tigre-3800-f"));
 for(const url of [
  "http://www.antoniocarraro.it/en/catalogue",
  "https://myuser:secret@www.antoniocarraro.it/hello",
  "https://www.antoniocarraro.it.attacker.invalid/model",
  "https://untrusted.antoniocarraro.it/model",
  "https://localhost/tractor","https://127.0.0.1/model",
  "https://www.antoniocarraro.it:8443/model",
  "https://www.antoniocarraro.it@127.0.0.1/model"
 ])assert.equal(allowedOemUrl(url,"Antonio Carraro"),null,url);
 assert.equal(allowedOemUrl("https://www.antoniocarraro.it/model","Kubota"),null);
});

test("model identity is only a discovery hint and exact numeric boundaries matter",()=>{
 assert.equal(validModelMention("TIGRE 3800 F engine 1331 cc","TIGRE 3800 F"),true);
 assert.equal(validModelMention("TIGRE 3800 F engine 1642 cc","TIGRE 3800 F"),true);
 assert.equal(validModelMention("TIGRE 3800 F","TIGRE 3800"),false);
 assert.equal(validModelMention("Mach 2 R Kubota","MACH 2 R"),true);
 assert.ok(!scrubMarkup('<script>secret-token</script><style>hidden</style><h1>TIGRE 3800 F</h1>')
   .includes("secret-token"));
});

test("robots blocks disallowed paths, honours 404 and fails closed on errors",async()=>{
 const source="https://www.antoniocarraro.it/en/catalogue/mach-2-r";
 const client=async()=>new Response("User-agent: *\nDisallow: /admin/\nAllow: /en/catalogue/\n",{status:200});
 assert.equal(await robotsAllowed(source,{fetchFn:client}),true);
 assert.equal(await robotsAllowed("https://www.antoniocarraro.it/admin/private",{fetchFn:client}),false);
 const forbid=async()=>new Response("User-agent: *\nDisallow: /",{status:200});
 assert.equal(await robotsAllowed(source,{fetchFn:forbid}),false);
 assert.equal(await robotsAllowed(source,{fetchFn:async()=>new Response("",{status:404})}),true);
 assert.equal(await robotsAllowed(source,{fetchFn:async()=>new Response("",{status:403})}),false);
 assert.equal(await robotsAllowed(source,{fetchFn:async()=>{throw Error("network")}}),false);
});

test("robots never follows redirects or exceeds response-policy cap",async()=>{
 const source="https://www.antoniocarraro.it/en/catalogue/mach-2-r";
 const client=async(url,opt)=>{
  assert.match(url,/\/robots\.txt$/);
  assert.equal(opt.redirect,"manual");
  return new Response("",{status:301,headers:{Location:"http://10.0.0.1/private"}});
 };
 assert.equal(await robotsAllowed(source,{fetchFn:client}),false);
 const huge=async()=>new Response("x".repeat(65000),{status:200});
 assert.equal(await robotsAllowed(source,{fetchFn:huge}),false);
});

test("HTML and PDF read only bounded bytes and SHA-256; never follow redirects",async()=>{
 const u="https://www.antoniocarraro.it/en/catalogue/tigre-3800-f";
 let calls=0;
 const good=await readOemDocument(u,{fetchFn:async (url,opt)=>{
  calls++;assert.equal(opt.redirect,"manual");assert.equal(opt.credentials,"omit");
  return new Response("<h1>TIGRE 3800 F</h1><script>REMOVE</script>Engine 1642 cc",{
   status:200,headers:{"Content-Type":"text/html;charset=UTF-8"}
  });
 }});
 assert.equal(calls,1);
 assert.equal(good.status,"fetched_html");
 assert.match(good.excerpt,/TIGRE 3800 F/);
 assert.doesNotMatch(good.excerpt,/REMOVE/);
 assert.match(good.content_sha256,/^[a-f0-9]{64}$/);
 const pdf=await readOemDocument(u,{fetchFn:async()=>new Response(new Uint8Array([37,80,68,70]),{
  status:200,headers:{"Content-Type":"application/pdf"}
 })});
 assert.equal(pdf.status,"pdf_pending_parse");
 assert.equal(pdf.excerpt,null);
 assert.equal(pdf.content_bytes,4);
 const redirect=await readOemDocument(u,{fetchFn:async()=>new Response(null,{
  status:302,headers:{location:"https://evil.invalid"}
 })});
 assert.equal(redirect.status,"redirect_review");
 const big=await readOemDocument(u,{fetchFn:async()=>new Response("x",{
  status:200,headers:{"Content-Type":"text/html","Content-Length":String(MAX_HTML_BYTES+1)}
 })});
 assert.equal(big.status,"too_large");
 const hugePdf=await readOemDocument(u,{fetchFn:async()=>new Response("x",{
  status:200,headers:{"Content-Type":"application/pdf","Content-Length":String(MAX_PDF_BYTES+1)}
 })});
 assert.equal(hugePdf.status,"too_large");
});

test("scheduler must never accept a receipt that modifies published technical data",async()=>{
 const token=Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url")+"."+
  Buffer.from(JSON.stringify({role:"anon"})).toString("base64url")+".not-real-signature";
 const receipt={success:true,processed:2,eligible_drafts:187,trusted_urls:75,
  cache_hits:5,deferred_sources:68,states:{fetched_html:1,robots_blocked:1},
  paid_ai_calls:0,published:0,specifications_modified:0};
 assert.equal(validateReceipt(receipt).processed,2);
 for(const bad of [{...receipt,published:1},{...receipt,paid_ai_calls:1},
  {...receipt,processed:10},{...receipt,specifications_modified:1}]){
  assert.throws(()=>validateReceipt(bad),/safety/);
 }
 const ok=await runFreeCollector({jwt:token,queueSecret:"private test",
  fetchFn:async (url,opt)=>{
   assert.match(url,/\/tractor-oem-free-collector$/);
   assert.equal(opt.headers["x-queue-secret"],"private test");
   assert.equal(JSON.parse(opt.body).action,"collect");
   return new Response(JSON.stringify(receipt),{status:200});
  }});
 assert.equal(ok.published,0);
 assert.equal(ok.paid_ai_calls,0);
});
test("source collector cannot change model, spec or research queue states",()=>{
 const edge=readFileSync(new URL("../supabase/functions/tractor-oem-free-collector/index.ts",import.meta.url),"utf8");
 const schema=readFileSync(new URL("../supabase/migrations/20261121124500_tractorvs_oem_document_cache.sql",import.meta.url),"utf8");
 assert.match(edge,/TC_QUEUE_SECRET/);
 assert.match(edge,/allowedOemUrl/);
 assert.match(edge,/robotsAllowed/);
 assert.match(edge,/status","draft"/);
 assert.match(edge,/MAX_PER_RUN/);
 assert.match(schema,/ENABLE ROW LEVEL SECURITY/);
 assert.match(schema,/REVOKE ALL ON public\.tc_oem_document_cache FROM PUBLIC,anon,authenticated/);
 assert.match(schema,/GRANT SELECT,INSERT,UPDATE ON public\.tc_oem_document_cache TO service_role/);
 assert.doesNotMatch(edge,/\.(?:update|insert|upsert|delete)\([^)]*\)\s*\.from\(["'](?:tractors|tractor_specs|tractor_research_queue)["']/);
 assert.doesNotMatch(edge,/\bGEMINI_API_KEY\b|\bopenai\b/i);
 const res=aggregateResults([{status:"fetched_html"},{status:"pdf_pending_parse"}]);
 assert.equal(res.paid_ai_calls,0);assert.equal(res.published,0);
});

test("additional original manufacturer hosts remain exact and brand-scoped",()=>{
 const accepted=[
  ["SAME","https://www.same-tractors.com/en-gb/tractors"],
  ["Iseki","https://www.iseki.co.jp/global/english/products/tractor/"],
  ["Lamborghini Trattori","https://www.lamborghini-tractors.com/en-eu/tractors/full-range"],
  ["Mahindra","https://www.mahindratractor.com/tractors"],
  ["Steyr","https://www.steyr-traktoren.com/en/agriculture/products/tractors"],
  ["Zetor","https://www.zetor.com/file/ZET2024_Leaflet_PORTFOLIO_EN.pdf"],
  ["Fendt","https://dam.agcocorp.com/content/dam/multisite/fendt/brochures/one.pdf"],
  ["Case IH","https://assets.cnhindustrial.com/caseih/NAFTA/tractors/brochure.pdf"]
 ];
 for(const [brand,url] of accepted)assert.equal(allowedOemUrl(url,brand),url,brand);
 for(const [brand,url] of [
  ["Fendt","https://dam.agcocorp.com/content/dam/multisite/massey-ferguson/brochure.pdf"],
  ["Case IH","https://assets.cnhindustrial.com/newholland/tractors/brochure.pdf"],
  ["Kioti","https://www.kioti.eu.evil.invalid/"],
  ["Belarus","https://www.agromeh.com/products/belarus"]
 ])assert.equal(allowedOemUrl(url,brand),null,brand);
});

test("406 queued UUIDs use bounded, lossless PostgREST draft-only batches",()=>{
 const ids=Array.from({length:406},(_,i)=>
  "00000000-0000-4000-8000-"+i.toString(16).padStart(12,"0"));
 const original=ids.slice();
 const groups=draftIdBatches(ids);
 assert.equal(MAX_DRAFT_IDS_PER_LOOKUP,50);
 assert.equal(groups.length,9);
 assert.ok(groups.every(group=>group.length>=1&&group.length<=50));
 assert.deepEqual(groups.flat(),ids);
 assert.deepEqual(ids,original);
 assert.deepEqual(draftIdBatches([]),[]);
 assert.throws(()=>draftIdBatches(null),/invalid_draft_id_list/);
 // A 406-UUID URL filter is ~15KB; each serialized batch stays small.
 assert.ok(groups.every(group=>group.join(",").length<2100));
 const edge=readFileSync(new URL("../supabase/functions/tractor-oem-free-collector/index.ts",import.meta.url),"utf8");
 assert.match(edge,/for\(const batch of draftIdBatches\(ids\)\)/);
 assert.match(edge,/\.in\("id",batch\)/);
 assert.match(edge,/\.eq\("status","draft"\)/);
 assert.match(edge,/if\(tractors\.length>250\)throw Error\("draft_scan_cap"\)/);
 assert.doesNotMatch(edge,/\.in\("id",ids\)/);
});

test("private OEM failure diagnostics cannot log draft identifiers or secret values",()=>{
 const error={code:"PGRST100",message:"PRIVATE DRAFT NAME secret-token https://internal.invalid",
  details:"secret-key",hint:"private-url"};
 assert.deepEqual(safeCollectorQueryFailure("draft_read",414,error),
  {stage:"draft_read",http:414,code:"PGRST100"});
 assert.deepEqual(safeCollectorQueryFailure("draft_read",504,{code:"57014"}),
  {stage:"draft_read",http:504,code:"57014"});
 assert.deepEqual(safeCollectorQueryFailure("private-uuid",0,{code:"private-token"}),
  {stage:"unknown",http:0,code:"unknown"});
 const serialized=JSON.stringify(safeCollectorQueryFailure("draft_read",403,error));
 for(const dangerous of ["PRIVATE","secret","internal.invalid","private-url","PRIVATE DRAFT NAME"])
  assert.ok(!serialized.includes(dangerous),dangerous);
 const edge=readFileSync(new URL("../supabase/functions/tractor-oem-free-collector/index.ts",import.meta.url),"utf8");
 assert.match(edge,/safeCollectorQueryFailure\(scope,status,error\)/);
 assert.doesNotMatch(edge,/console\.error\([^\n]*(?:error\.message|error\.details|source_url|queueSecret)/);
});
