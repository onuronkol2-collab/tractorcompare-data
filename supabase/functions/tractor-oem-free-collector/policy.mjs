// TractorVS OEM source transport. Zero AI/paid calls, no auto-publication.
// Shared by the private Supabase worker and Node's unit tests.
export const MAX_PER_RUN=3;

const SAFE_QUERY_STAGES=new Set(["queue_read","draft_read","brand_read","spec_read","source_read","cache_read","cache_write"]);
// Only fixed stage names, HTTP status and a conservative SQL/PostgREST code
// may reach CI logs. NEVER print exception messages, URLs, UUIDs or headers.
export function safeCollectorQueryFailure(scope,httpStatus,error){
 const stage=SAFE_QUERY_STAGES.has(scope)?scope:"unknown";
 const http=Number.isSafeInteger(httpStatus)&&httpStatus>=400&&httpStatus<=599?httpStatus:0;
 const raw=typeof error?.code==="string"?error.code:"";
 const code=/^[A-Z0-9_]{3,16}$/.test(raw)?raw:"unknown";
 return {stage,http,code};
}
export const MAX_DRAFT_IDS_PER_LOOKUP=50;
// PostgREST .in('id', ids) serializes each UUID into the request URL.
// Keep source-only private draft lookups bounded below intermediary URI limits.
export function draftIdBatches(ids){
 if(!Array.isArray(ids))throw Error("invalid_draft_id_list");
 const result=[];
 for(let offset=0;offset<ids.length;offset+=MAX_DRAFT_IDS_PER_LOOKUP)
  result.push(ids.slice(offset,offset+MAX_DRAFT_IDS_PER_LOOKUP));
 return result;
}

export const MAX_HTML_BYTES=256000;
export const MAX_PDF_BYTES=800000;
export const CACHE_HOURS=24*14;
export const OEM_HOSTS=Object.freeze({
 "Antonio Carraro":["antoniocarraro.it","www.antoniocarraro.it"],"ArmaTrac":["armatrac.com","www.armatrac.com"],
 "Başak Traktör":["basaktraktor.com.tr","www.basaktraktor.com.tr"],"Kubota":["ktt.kubota-eu.com"],
 "Sonalika":["sonalika.com","www.sonalika.com"],"Agrale":["agrale.com.br","www.agrale.com.br","pdf.agrale.com.br"],
 "CLAAS":["claas.com","www.claas.com"],"John Deere":["deere.com","www.deere.com","deere.co.uk","www.deere.co.uk"],
 "Case IH":["caseih.com","www.caseih.com","caseih.com.tr","www.caseih.com.tr","assets.cnhindustrial.com"],
 "Fendt":["dam.agcocorp.com"],
 "Iseki":["www.iseki.co.jp"],
 "Kioti":["www.kioti.eu"],
 "Lamborghini Trattori":["www.lamborghini-tractors.com"],
 "Landini":["www.landini.it"],
 "LS Tractor":["www.lstractor.com"],
 "Mahindra":["www.mahindratractor.com"],
 "Massey Ferguson":["www.masseyferguson.com"],
 "McCormick":["mccormick-tractors.com"],
 "New Holland":["www.newholland.com.tr"],
 "SAME":["www.same-tractors.com"],
 "Steyr":["www.steyr-traktoren.com"],
 "Swaraj":["www.swarajtractors.com"],
 "Versatile":["www.versatile-ag.com"],
 "Zetor":["www.zetor.com"]
});
const clean=x=>String(x??"").normalize("NFKC").trim();
export function allowedOemUrl(raw,brand){
 const roots=OEM_HOSTS[brand];
 if(!roots||typeof raw!=="string"||raw.length>1600)return null;
 let u;
 try{u=new URL(raw)}catch{return null}
 if(u.protocol!=="https:"||u.username||u.password||u.port||u.hostname.includes("%"))return null;
 const host=u.hostname.toLowerCase().replace(/\.$/,"");
 if(host==="localhost"||host.endsWith(".localhost")||
   /^[0-9.]+$/.test(host)||host.includes(":"))return null;
 if(!roots.includes(host))return null;
 // Parent-company DAMs contain other brands; trust only matching brand path.
 if(brand==="Fendt"&&host==="dam.agcocorp.com"&&
   !u.pathname.toLowerCase().startsWith("/content/dam/multisite/fendt/"))return null;
 if(brand==="Case IH"&&host==="assets.cnhindustrial.com"&&
   !u.pathname.toLowerCase().startsWith("/caseih/"))return null;
 if(u.pathname.length>900||u.search.length>300)return null;
 u.hash="";
 return u.toString();
}
export function validModelMention(text,model){
 const target=clean(model);
 if(!target||target.length>100)return false;
 const escape=x=>x.replace(/[.*+?^{}()|[\]\\$]/g,"\\$&");
 const query=target.split(/\s+/).map(escape).join("\\s+");
 const matcher=new RegExp("(?:^|[^\\p{L}\\p{N}])"+query+"(?=$|[^\\p{L}\\p{N}])","iu");
 const cleanText=clean(text);
 const match=matcher.exec(cleanText);
 if(!match)return false;
 // A short alphanumeric suffix may be another tractor variant,
 // e.g. TIGRE 3800 F must not imply an exact TIGRE 3800 match.
 const after=cleanText.slice(match.index+match[0].length).trimStart();
 if(/^(?:[A-Z]{1,3}|[0-9]{1,3})(?:\\s|$)/i.test(after))return false;
 return true;
}
export function scrubMarkup(html){
 let str=String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
  .replace(/<!--[\s\S]*?-->/g," ")
  .replace(/<[^>]*>/g," ");
 str=str.replace(/&(nbsp|amp|lt|gt|quot|#39);/gi,(m,p)=>({
  nbsp:" ",amp:"&",lt:"<",gt:">",quot:'"',"#39":"'"
 })[p.toLowerCase()]||m);
 return str.replace(/\s+/g," ").trim();
}
// Conservative robots.txt evaluation. Unknown/unreachable robots: do NOT crawl.
// Respect exact UA or wildcard rules; unsupported giant robots files are blocked.
// Crawl-delay is handled by single-host-per-run scheduling (at least 2 hours).
export async function robotsAllowed(url,{fetchFn=fetch,timeoutMs=8000,cache=new Map()}={}){
 const u=new URL(url),root=u.origin, robotsUrl=root+"/robots.txt";
 let record=cache.get(root);
 if(!record){
  try{
   const res=await fetchFn(robotsUrl,{method:"GET",redirect:"manual",
    credentials:"omit",headers:{"Accept":"text/plain"},
    signal:AbortSignal.timeout(timeoutMs)});
   if(res.status===404)record={ok:true,body:""};
   else if(res.status!==200)record={ok:false,body:""};
   else{
    const length=Number(res.headers.get("content-length"));
    if(Number.isFinite(length)&&length>64000)record={ok:false,body:""};
    else{
     const body=await res.text();
     record=body.length>64000?{ok:false,body:""}:{ok:true,body};
    }
   }
  }catch{record={ok:false,body:""}}
  cache.set(root,record);
 }
 if(!record.ok)return false;
 if(!record.body)return true;
 const groups=[];
 let group=null,hasRules=false;
 for(const raw of record.body.replace(/\r/g,"").split("\n")){
  const line=raw.split("#",1)[0].trim();
  if(!line)continue;
  const idx=line.indexOf(":");
  if(idx<0)continue;
  const name=line.slice(0,idx).trim().toLowerCase(),value=line.slice(idx+1).trim();
  if(name==="user-agent"){
   if(!group||hasRules){group={agents:[],rules:[]};groups.push(group);hasRules=false}
   group.agents.push(value.toLowerCase());
   continue;
  }
  if(!group)continue;
  hasRules=true;
  if(name==="allow"||name==="disallow")group.rules.push({name,path:value});
  if(name==="crawl-delay"&&group.agents.some(a=>a==="*"||a==="tractorvsresearchbot")){
   const delay=Number(value);
   if(!Number.isFinite(delay)||delay>7200)return false;
  }
 }
 const explicit=groups.filter(g=>g.agents.includes("tractorvsresearchbot"));
 const applicable=explicit.length?explicit:groups.filter(g=>g.agents.includes("*"));
 const path=u.pathname+u.search;
 let best=null;
 for(const g of applicable)for(const rule of g.rules){
  if(!rule.path)continue; // empty Disallow means allowed
  const anchored=rule.path.endsWith("$");
  const core=anchored?rule.path.slice(0,-1):rule.path;
  const escaped=core.replace(/[.+?^{}()|[\]\\$]/g,"\\$&").replace(/\*/g,".*");
  let match=false;
  try{match=new RegExp("^"+escaped+(anchored?"$":"")).test(path)}catch{return false}
  if(!match)continue;
  const rank=rule.path.replace(/\*/g,"").length;
  if(!best||rank>best.rank||(rank===best.rank&&rule.name==="allow"))
   best={rank,name:rule.name};
 }
 return !best||best.name==="allow";
}
export async function readOemDocument(url,{fetchFn=fetch,timeoutMs=12000}={}){
 let response;
 try{
  response=await fetchFn(url,{
   method:"GET",redirect:"manual",credentials:"omit",
   headers:{"Accept":"text/html,application/pdf;q=0.8,text/plain;q=0.5"},
   signal:AbortSignal.timeout(timeoutMs)
  });
 }catch{
  return {status:"fetch_error",http_status:null,media_type:null,
   content_bytes:null,content_sha256:null,excerpt:null};
 }
 const status=response.status;
 const ct=String(response.headers.get("content-type")||"").toLowerCase().split(";")[0].trim();
 const state=(kind)=>({status:kind,http_status:status,media_type:ct||null,
  content_bytes:null,content_sha256:null,excerpt:null});
 if(status>=300&&status<400)return state("redirect_review");
 if(status!==200)return state("http_error");
 const pdf=ct==="application/pdf";
 if(!pdf&&!["text/html","text/plain"].includes(ct))return state("unsupported_type");
 const limit=pdf?MAX_PDF_BYTES:MAX_HTML_BYTES;
 const length=Number(response.headers.get("content-length"));
 if(Number.isFinite(length)&&length>limit)return state("too_large");
 if(!response.body)return state("fetch_error");
 let parts=[],size=0;
 const reader=response.body.getReader();
 try{
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>limit){
    await reader.cancel().catch(()=>{});
    return state("too_large");
   }
   parts.push(value);
  }
 }catch{return state("fetch_error")}
 const buffer=new Uint8Array(size);
 let offset=0;
 for(const part of parts){buffer.set(part,offset);offset+=part.byteLength}
 const digest=await crypto.subtle.digest("SHA-256",buffer);
 const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 const decoded=pdf?"":scrubMarkup(new TextDecoder("utf-8",{fatal:false}).decode(buffer));
 return {status:pdf?"pdf_pending_parse":"fetched_html",http_status:status,media_type:ct,
  content_bytes:size,content_sha256:sha,excerpt:pdf?null:decoded.slice(0,1400)};
}
export function aggregateResults(items){
 const states={};
 for(const item of items)states[item.status]=(states[item.status]||0)+1;
 return {processed:items.length,states,paid_ai_calls:0,published:0,specifications_modified:0};
}
