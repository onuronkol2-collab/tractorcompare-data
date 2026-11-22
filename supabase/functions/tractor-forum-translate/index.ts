/**
 * TractorVS forum translation safety mode — 22 November 2026.
 *
 * NO automated translation model is invoked from this function.
 * Azure Translator, Cloudflare Workers AI, Gemini and the old synthetic
 * test endpoints are retired. This server keeps ONLY authenticated
 * read-only queue counters for operational visibility.
 *
 * ChatGPT-assisted translations are prepared outside the site, checked
 * against the same-source hash and kept PRIVATE until editorial QA.
 * Never make automatic forum content publication depend on an API call.
 */
const ROOT = Deno.env.get("SUPABASE_URL") ||
  "https://aaufxtcvnzgavtlintiv.supabase.co";
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SECRET = Deno.env.get("TC_QUEUE_SECRET") || "";

function reply(status:number, data:unknown) {
 return new Response(JSON.stringify(data), {status,headers:{
  "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store"
 }});
}
function equal(a:string,b:string){
 if(!a||!b||a.length!==b.length)return false;
 let diff=0;
 for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return reply(405,{error:"POST required"});
 if(!SECRET)return reply(503,{error:"Forum control unavailable"});
 if(!equal(req.headers.get("x-queue-secret")||"",SECRET))
  return reply(401,{error:"Unauthorized"});
 let payload:unknown;
 try{payload=await req.json()}catch{return reply(400,{error:"Invalid JSON"})}
 const input=payload as {action?:unknown};
 // Independent of environment flags: not even a manually entered ONAY,
 // old token, or accidental workflow call may send model requests.
 if(input?.action!=="status")
  return reply(423,{success:false,error:"Automated forum translation permanently disabled; manual review only"});
 if(!KEY)return reply(503,{error:"Status unavailable"});
 try{
  const url=ROOT+"/rest/v1/tc_forum_translation_jobs?"+
   new URLSearchParams({select:"state,entity_kind",entity_kind:"eq.topic",limit:"1000"});
  const r=await fetch(url,{headers:{
   apikey:KEY,Authorization:"Bearer "+KEY,Accept:"application/json"
  },signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error("status unavailable");
  const rows=await r.json() as Array<{state:string}>;
  const states:Record<string,number>={};
  for(const row of rows)states[row.state]=(states[row.state]||0)+1;
  return reply(200,{success:true,states,mode:"manual_only"});
 }catch{return reply(503,{error:"Status unavailable"})}
});
