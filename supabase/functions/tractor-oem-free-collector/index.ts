// TractorVS private free-first OEM document collector.
// Source-only cache: no model/spec status writes, no LLM, no publishing.
// Auth: verify_jwt=true at gateway PLUS existing TC_QUEUE_SECRET.
// Only a short excerpt and SHA-256 are persisted, never whole copyrighted docs.
import {createClient} from "npm:@supabase/supabase-js@2";
import {
 allowedOemUrl,readOemDocument,robotsAllowed,validModelMention,aggregateResults,
 MAX_PER_RUN,CACHE_HOURS,draftIdBatches,safeCollectorQueryFailure,
 MAX_DRAFT_SCAN,SPEC_LINK_PAGE_SIZE,MAX_SPEC_LINKS,selectBulkOemSources
} from "./policy.mjs";

const url=Deno.env.get("SUPABASE_URL")||"";
const key=Deno.env.get("DB_SECRET_KEY")||"";
const queueSecret=Deno.env.get("TC_QUEUE_SECRET")||"";
const db=url&&key?createClient(url,key,{
 auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
}):null;
const response=(status,body)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}
});
function equalSecret(one,two){
 if(!one||!two)return false;
 const a=new TextEncoder().encode(one),b=new TextEncoder().encode(two);
 if(a.length!==b.length)return false;
 let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 return diff===0;
}
async function checked(query,scope){
 const {data,error,status}=await query;
 if(error){
  // Fixed stage/HTTP/code only; do not print private drafts, source URLs,
  // query strings, JWTs, Supabase error.message, details or hints.
  console.error("tractor OEM private query:",JSON.stringify(
   safeCollectorQueryFailure(scope,status,error)));
  throw Error(scope);
 }
 return data||[];
}
function batches(list,n){
 const arr=[];for(let i=0;i<list.length;i+=n)arr.push(list.slice(i,i+n));
 return arr;
}
async function collect(){
 // Scan private queue without claiming/updating any queued item.
 const queued=await checked(db.from("tractor_research_queue")
  .select("tractor_id,priority,status,attempt_count,max_attempts,next_attempt_at")
  .in("status",["queued","retry"]).order("priority",{ascending:true})
  .order("created_at",{ascending:true}).limit(500),"queue_read");
 if(queued.length===500)throw Error("queue_scan_cap");
 const now=Date.now();
 const eligible=queued.filter(q=>q.tractor_id&&q.attempt_count<q.max_attempts &&
  (!q.next_attempt_at||Date.parse(q.next_attempt_at)<=now));
 const ids=[...new Set(eligible.map(q=>q.tractor_id))];
 if(!ids.length)return {eligible_drafts:0,trusted_urls:0,cache_hits:0,
  ...aggregateResults([])};
 // Never submit hundreds of UUIDs in one PostgREST GET query: long URLs
 // can fail upstream even when service-role SELECT and RLS are correct.
 // Published and archived models remain excluded by the exact draft filter.
 const tractors=[];
 for(const batch of draftIdBatches(ids)){
  const rows=await checked(db.from("tractors")
   .select("id,brand_id,model_name,status").in("id",batch)
   .eq("status","draft").limit(251),"draft_read");
  tractors.push(...rows);
  if(tractors.length>MAX_DRAFT_SCAN)throw Error("draft_scan_cap");
 }
 const drafts=new Map(tractors.map(t=>[t.id,t]));
 if(!drafts.size)return {eligible_drafts:0,trusted_urls:0,cache_hits:0,...aggregateResults([])};
 const brands=await checked(db.from("brands").select("id,name")
  .in("id",[...new Set(tractors.map(t=>t.brand_id))]).limit(120),"brand_read");
 const brandMap=new Map(brands.map(b=>[b.id,b.name]));
 // Batch UUID filters AND paginate spec links explicitly: PostgREST may cap
 // a response below a requested .limit(). A short first page of a large
 // unpaginated request is not proof of complete coverage.
 const specLinks=[];
 for(const batch of draftIdBatches([...drafts.keys()])){
  for(let offset=0;;offset+=SPEC_LINK_PAGE_SIZE){
   const page=await checked(db.from("tractor_specs").select("id,tractor_id,source_id")
    .in("tractor_id",batch).not("source_id","is",null).order("id",{ascending:true})
    .range(offset,offset+SPEC_LINK_PAGE_SIZE-1),"spec_read");
   specLinks.push(...page);
   if(specLinks.length>MAX_SPEC_LINKS)throw Error("spec_scan_cap");
   if(page.length<SPEC_LINK_PAGE_SIZE)break;
  }
 }
 const sourceIds=[...new Set(specLinks.map(x=>x.source_id).filter(Boolean))];
 if(!sourceIds.length)return {eligible_drafts:drafts.size,trusted_urls:0,cache_hits:0,...aggregateResults([])};
 if(sourceIds.length>500)throw Error("source_scan_cap");
 const sources=[];
 for(const batch of batches(sourceIds,60)){
  const data=await checked(db.from("data_sources")
   .select("id,source_url,source_type").in("id",batch),"source_read");
  sources.push(...data);
 }
 const sourceMap=new Map(sources.map(x=>[x.id,x]));
 const candidates=new Map();
 for(const link of specLinks){
  const tractor=drafts.get(link.tractor_id);
  const source=sourceMap.get(link.source_id);
  if(!tractor||!source)continue;
  const brand=brandMap.get(tractor.brand_id);
  const safe=allowedOemUrl(source.source_url,brand);
  if(!safe)continue;
  if(!candidates.has(safe))candidates.set(safe,{
   source_url:safe,source_host:new URL(safe).hostname,
   brand,associated_models:new Set(),associated_draft_ids:new Set()});
  candidates.get(safe).associated_models.add(tractor.model_name);
  candidates.get(safe).associated_draft_ids.add(tractor.id);
 }
 const list=[...candidates.values()];
 if(list.length>500)throw Error("trusted_source_scan_cap");
 const caches=[];
 for(const batch of batches(list.map(x=>x.source_url),35)){
  if(!batch.length)continue;
  caches.push(...await checked(db.from("tc_oem_document_cache")
    .select("source_url,next_check_at").in("source_url",batch),"cache_read"));
 }
 const cacheMap=new Map(caches.map(x=>[x.source_url,x]));
 // Prioritize uncached documents covering the most distinct drafts,
 // while preserving the request budget and one source per brand/host.
 const {picked,remaining}=selectBulkOemSources(list,cacheMap,now,MAX_PER_RUN);
 const updates=[],robotsCache=new Map();
 for(const entry of picked){
  const permitted=await robotsAllowed(entry.source_url,{cache:robotsCache});
  const doc=permitted?await readOemDocument(entry.source_url):
   {status:"robots_blocked",http_status:null,media_type:null,
    content_bytes:null,content_sha256:null,excerpt:null};
  // Mention is merely a discovery hint, not technical identity evidence.
  const mentions=doc.status==="fetched_html" &&
   [...entry.associated_models].some(m=>validModelMention(doc.excerpt,m));
  const ttl=doc.status==="fetch_error"||doc.status==="http_error"?24:CACHE_HOURS;
  const record={
   source_url:entry.source_url,source_host:entry.source_host,
   status:doc.status,http_status:doc.http_status,
   media_type:doc.media_type,content_sha256:doc.content_sha256,
   content_bytes:doc.content_bytes,excerpt:doc.excerpt,
   model_mention_hint:Boolean(mentions),
   observed_at:new Date().toISOString(),
   next_check_at:new Date(Date.now()+ttl*3600_000).toISOString(),
   updated_at:new Date().toISOString()
  };
  await checked(db.from("tc_oem_document_cache")
   .upsert(record,{onConflict:"source_url"}).select("id"),"cache_write");
  updates.push({status:doc.status});
 }
 return {eligible_drafts:drafts.size,trusted_urls:list.length,
  cache_hits:list.length-remaining,
  deferred_sources:Math.max(0,remaining-picked.length),
  ...aggregateResults(updates)};
}
Deno.serve(async req=>{
 if(req.method!=="POST")return response(405,{success:false,error:"method_not_allowed"});
 if(!equalSecret(req.headers.get("x-queue-secret"),queueSecret))
  return response(401,{success:false,error:"unauthorized"});
 if(!db)return response(503,{success:false,error:"collector_not_configured"});
 if(Number(req.headers.get("content-length")||0)>1024)
  return response(413,{success:false,error:"request_too_large"});
 let input;
 try{input=await req.json()}catch{return response(400,{success:false,error:"invalid_json"})}
 if(input?.action!=="collect")return response(400,{success:false,error:"unsupported_action"});
 try{return response(200,{success:true,...await collect()})}
 catch(err){
  // Known, static error codes only; no URLs/model names/credentials in logs.
  const safeCodes=["queue_read","queue_scan_cap","draft_read","draft_scan_cap",
   "brand_read","spec_read","spec_scan_cap","source_scan_cap","source_read",
   "trusted_source_scan_cap","cache_read","cache_write"];
  const code=safeCodes.includes(String(err?.message))?String(err.message):"worker_error";
  console.error("tractor OEM collector aborted:",code);
  return response(500,{success:false,error:code});
 }
});
