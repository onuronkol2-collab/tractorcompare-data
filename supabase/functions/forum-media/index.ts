// TractorVS public image gateway. Only independently approved images belonging
// to already published moderated posts may be served. The storage bucket stays
// PRIVATE. The service-role credential is read only from Edge environment;
// never exposed to client code, logs, cache keys or public HTML.
const projectUrl=String(Deno.env.get("SUPABASE_URL")||"").replace(/\/$/,"");
const serviceKey=String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"");
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hiddenHeaders={
 "Access-Control-Allow-Origin":"https://tractorvs.com",
 "Access-Control-Allow-Methods":"GET, HEAD, OPTIONS",
 "Cache-Control":"no-store",
 "X-Content-Type-Options":"nosniff",
 "Cross-Origin-Resource-Policy":"cross-origin",
 "Referrer-Policy":"strict-origin-when-cross-origin"
};
const missing=()=>new Response("Image unavailable",{status:404,headers:hiddenHeaders});
const failed=()=>new Response("Image temporarily unavailable",{status:503,headers:hiddenHeaders});
function apiHeaders(){
 return {apikey:serviceKey,Authorization:"Bearer "+serviceKey,Accept:"application/json"};
}
async function readRows(path:string):Promise<unknown[]>{
 const r=await fetch(projectUrl+"/rest/v1/"+path,{
  headers:apiHeaders(),cache:"no-store",signal:AbortSignal.timeout(8000)
 });
 if(!r.ok)throw new Error("Database read unavailable");
 const rows=await r.json();
 if(!Array.isArray(rows))throw new Error("Invalid database response");
 return rows;
}
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:hiddenHeaders});
 if(request.method!=="GET"&&request.method!=="HEAD")
  return new Response("Method not allowed",{status:405,headers:hiddenHeaders});
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(projectUrl)||!serviceKey)
  return failed();
 const url=new URL(request.url);
 const id=url.searchParams.get("id")||"";
 if(!uuid.test(id)||url.searchParams.size!==1)return missing();
 try{
  const matches=await readRows("tc_forum_media?select=id,status,storage_path,topic_id,reply_id&id=eq."+id+"&limit=1");
  if(matches.length!==1)return missing();
  const m=matches[0] as {id:string;status:string;storage_path:string;topic_id:string|null;reply_id:string|null};
  if(m.id!==id||m.status!=="published"||(m.topic_id===null)===(m.reply_id===null))return missing();
  if(!new RegExp("^[0-9a-f-]{36}/"+id+"\\.webp$","i").test(m.storage_path))return missing();
  let topicId=m.topic_id;
  if(m.reply_id){
   const reply=await readRows("tc_forum_replies?select=id,status,topic_id&id=eq."+m.reply_id+"&limit=1");
   const r=reply[0] as {id:string;status:string;topic_id:string}|undefined;
   if(!r||r.id!==m.reply_id||r.status!=="published")return missing();
   topicId=r.topic_id;
  }
  if(!topicId||!uuid.test(topicId))return missing();
  const parents=await readRows("tc_forum_topics?select=id,status&id=eq."+topicId+"&limit=1");
  const p=parents[0] as {id:string;status:string}|undefined;
  if(!p||p.id!==topicId||p.status!=="published")return missing();
  if(request.method==="HEAD"){
   return new Response(null,{status:200,headers:{
    ...hiddenHeaders,"Content-Type":"image/webp",
    "Cache-Control":"public,max-age=60,s-maxage=60",
    "X-Robots-Tag":"index, follow"
   }});
  }
  const path=m.storage_path.split("/").map(encodeURIComponent).join("/");
  const data=await fetch(projectUrl+"/storage/v1/object/authenticated/tc-forum-media/"+path,{
   headers:apiHeaders(),signal:AbortSignal.timeout(10000),cache:"no-store"
  });
  if(!data.ok)return missing();
  const blob=await data.arrayBuffer();
  if(blob.byteLength<12||blob.byteLength>400000)return missing();
  // Uploaded MIME metadata can be forged by a malicious client. Independently
  // verify RIFF....WEBP signature before serving the bytes to public users.
  const signature=new Uint8Array(blob,0,12);
  if(signature[0]!==0x52||signature[1]!==0x49||signature[2]!==0x46||signature[3]!==0x46||
     signature[8]!==0x57||signature[9]!==0x45||signature[10]!==0x42||signature[11]!==0x50)
    return missing();
  // Browser re-encoding and the strict storage upload MIME restriction are
  // independent checks; never trust storage's Content-Type on the response.
  return new Response(blob,{status:200,headers:{
   "Content-Type":"image/webp","Content-Length":String(blob.byteLength),
   "Content-Disposition":'inline; filename="forum-'+id+'.webp"',
   "Access-Control-Allow-Origin":"*",
   "Cache-Control":"public,max-age=60,s-maxage=60",
   "X-Content-Type-Options":"nosniff",
   "Cross-Origin-Resource-Policy":"cross-origin",
   "X-Robots-Tag":"index, follow",
   "Vary":"Accept-Encoding"
  }});
 }catch{
  // Do not leak paths, tokens, authors, private content or service errors.
  return failed();
 }
});
