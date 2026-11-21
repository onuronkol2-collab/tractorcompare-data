// TractorVS OEM source transport. Zero AI/paid calls, no auto-publication.
// Shared by the private Supabase worker and Node's unit tests.
export const MAX_PER_RUN=3;
export const MAX_HTML_BYTES=256000;
export const MAX_PDF_BYTES=800000;
export const CACHE_HOURS=24*14;
export const OEM_HOSTS=Object.freeze({
 "Antonio Carraro":["antoniocarraro.it"],"ArmaTrac":["armatrac.com"],
 "Başak Traktör":["basaktraktor.com.tr"],"Kubota":["ktt.kubota-eu.com"],
 "Sonalika":["sonalika.com"],"Agrale":["agrale.com.br"],
 "CLAAS":["claas.com"],"John Deere":["deere.com","deere.co.uk"],
 "Case IH":["caseih.com","caseih.com.tr"]
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
 if(!roots.some(root=>host===root||host.endsWith("."+root)))return null;
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
 return matcher.test(clean(text));
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
