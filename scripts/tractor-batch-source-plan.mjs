/** Offline worklist for conversation-triggered research. No network or publishing.
 * Private input/output: draft identities are never printed to CI logs or public artifacts.
 * Source associations are leads, not evidence; existing release gates stay mandatory.
 */
import {writeFileSync,realpathSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,dirname,relative,isAbsolute} from "node:path";
import {fileURLToPath} from "node:url";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const readinessWeight={HUMAN_RELEASE_REVIEW:3,INSUFFICIENT_EVIDENCE:2,NO_VERIFIED_EVIDENCE:1,EXACT_VARIANT_MARKET_NEEDED:1,OFFICIAL_DOCUMENT_NEEDED:1,CONFLICT_REVIEW:1};
const clean=(value,max)=>typeof value==="string"&&value.trim().length>0&&value.length<=max?value.trim():null;
function urlKey(raw){
 if(typeof raw!=="string"||raw.length>1500)return null;
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes(".")||/^(?:\d+\.)+\d+$/.test(u.hostname)||/\.(?:local|localhost|internal)$/.test(u.hostname))return null;
  u.hash=""; // Keep query parameters: versioned documents are distinct.
  return u.href;
 }catch{return null;}
}
export function planResearch({rows,history=[],now,limit=12}={}){
 if(!Array.isArray(rows)||rows.length>10000||!Array.isArray(history)||history.length>10000||!Number.isInteger(limit)||limit<1||limit>100)throw Error("Unsafe planning bounds");
 const clock=Date.parse(now);
 if(!Number.isFinite(clock))throw Error("Explicit snapshot time required");
 const covered=new Map(),cooldown=new Map();
 for(const h of history){
  const url=urlKey(h?.source_url);
  if(!url)throw Error("Invalid history source");
  if(h.status==="cooldown"){
   const until=Date.parse(h.retry_after);
   if(!Number.isFinite(until))throw Error("Invalid cooldown");
   cooldown.set(url,Math.max(cooldown.get(url)||0,until));
  }else if(h.status==="reviewed"||h.status==="rejected"){
   if(!UUID.test(h.tractor_id||"")||!HASH.test(h.document_sha256||"")||!clean(h.reason,500))throw Error("History requires specific model, document hash and review reason");
   covered.set(JSON.stringify([url,h.tractor_id.toLowerCase(),h.document_sha256.toLowerCase()]),true);
  }else throw Error("Invalid history state");
 }
 const models=new Map(),groups=new Map(),skipped=new Set(),cooled=new Set(),links=new Set(),linksVersion=new Map(),linkedIds=new Set();
 for(const r of rows){
  if(!r||!["draft","published","archived"].includes(r.status))throw Error("Invalid catalogue status");
  if(r.status!=="draft")continue;
  if(!UUID.test(r.tractor_id||"")||!clean(r.brand,100)||!clean(r.model,160)||!Object.hasOwn(readinessWeight,r.readiness))throw Error("Incomplete draft identity");
  const id=r.tractor_id.toLowerCase(),identity=JSON.stringify([r.brand,r.model,r.variant??null,r.market??null,r.model_year??null,r.readiness]);
  if(models.has(id)&&models.get(id).identity!==identity)throw Error("Conflicting draft identity");
  models.set(id,{id,brand:r.brand,model:r.model,variant:r.variant??null,market:r.market??null,model_year:r.model_year??null,readiness:r.readiness,identity});
  const url=urlKey(r.source_url);
  if(!url)continue;
  const link=JSON.stringify([url,id]);
  if(links.has(link)){
   // Repeated rows are specification associations, not extra models.
   // Identical URL with inconsistent document version is unsafe.
   const existing=linksVersion.get(link);
   if(existing!==(r.document_sha256??null))throw Error("Conflicting source version");
   continue;
  }
  links.add(link);linkedIds.add(id);linksVersion.set(link,r.document_sha256??null);
  if(r.document_sha256!=null&&!HASH.test(r.document_sha256))throw Error("Invalid source hash");
  if((cooldown.get(url)||0)>clock){cooled.add(link);continue;}
  if(r.document_sha256&&covered.has(JSON.stringify([url,id,r.document_sha256.toLowerCase()]))){skipped.add(link);continue;}
  if(!groups.has(url))groups.set(url,new Set());
  groups.get(url).add(id);
 }
 // Marginal coverage: each model is counted only once across selected documents.
 const assigned=new Set(),selected=[];
 while(selected.length<limit&&groups.size){
  const ranked=[...groups].map(([url,ids])=>{
   const fresh=[...ids].filter(id=>!assigned.has(id));
   return {url,ids:[...ids],fresh,weight:fresh.reduce((n,id)=>n+readinessWeight[models.get(id).readiness],0)};
  }).filter(g=>g.fresh.length).sort((a,b)=>b.fresh.length-a.fresh.length||b.weight-a.weight||(a.url<b.url?-1:a.url>b.url?1:0));
  if(!ranked.length)break;
  const best=ranked[0];groups.delete(best.url);
  for(const id of best.fresh)assigned.add(id);
  selected.push({source_url:best.url,distinct_targets:best.ids.length,new_targets:best.fresh.length,targets:best.fresh.map(id=>{const {identity,...model}=models.get(id);return model;})});
 }
 const withoutUsableSource=[...models.values()].filter(m=>!linkedIds.has(m.id));
 const discovery=new Map();
 for(const {identity,...model} of withoutUsableSource){
  if(!discovery.has(model.brand))discovery.set(model.brand,[]);
  discovery.get(model.brand).push(model);
 }
 return {version:1,snapshot_time:new Date(clock).toISOString(),review_only:true,allowed_to_publish:false,summary:{draft_models:models.size,source_links:links.size,selected_documents:selected.length,distinct_planned_models:assigned.size,already_reviewed_links:skipped.size,cooldown_links:cooled.size,no_link_models:withoutUsableSource.length,unplanned_models:models.size-assigned.size,publication_count:0,paid_calls:0},selected_documents:selected,brand_discovery:[...discovery].map(([brand,targets])=>({brand,targets})).sort((a,b)=>b.targets.length-a.targets.length||a.brand.localeCompare(b.brand))};
}
async function main(){
 const output=process.argv[2];
 if(!output||!isAbsolute(output))throw Error("Use a private absolute output path in the OS temporary directory");
 const parent=realpathSync(dirname(output)),root=realpathSync(tmpdir()),rel=relative(root,parent);
 if(rel.startsWith("..")||isAbsolute(rel))throw Error("Output outside private temporary location");
 let input="";
 for await(const chunk of process.stdin){input+=chunk.toString();if(Buffer.byteLength(input)>8_000_000)throw Error("Input exceeds bound");}
 const result=planResearch(JSON.parse(input));
 writeFileSync(resolve(parent,output.split(/[\\/]/).at(-1)),JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 console.log(JSON.stringify(result.summary));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error("Private planning failed; no publication performed.");process.exitCode=1;});
