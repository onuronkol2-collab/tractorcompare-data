const MAX_ROWS=3000,PAGE=250;

export async function fetchPublicRows({api,table,fields,headers,fetchFn=fetch}){
 const results=[];
 const seen=new Set();
 let total=null;
 for(let offset=0;offset<MAX_ROWS;offset+=PAGE){
  const url=new URL(api+"/"+table);
  url.searchParams.set("select",fields);
  url.searchParams.set("order","id.asc,locale.asc");
  url.searchParams.set("offset",String(offset));
  url.searchParams.set("limit",String(PAGE));
  const res=await fetchFn(url.toString(),{
   headers:{...headers,Prefer:"count=exact",Accept:"application/json"},
   signal:AbortSignal.timeout(25000)
  });
  if(res.status!==200&&res.status!==206)
   throw Error("Forum public view failed with HTTP "+res.status+" ("+table+")");
  const range=String(res.headers.get("content-range")||"");
  const data=await res.json();
  if(!Array.isArray(data))throw Error("Invalid forum view payload");
  // PostgREST uses */0 when the view has no rows on some releases.
  if(total===null&&data.length===0&&/^\*\/0$|^0-0\/0$/.test(range))
   return [];
  const match=range.match(/^(\d+)-(\d+)\/(\d+)$/);
  if(!match)throw Error("PostgREST exact count missing for "+table+": "+range);
  const start=Number(match[1]),end=Number(match[2]),count=Number(match[3]);
  if(count>MAX_ROWS||count<1||!Number.isSafeInteger(count))
   throw Error("Unbounded or invalid forum view count");
  if(total===null)total=count;
  // Reject oversized, empty or internally inconsistent pages before retaining
  // any row. A proxy or API regression cannot bypass the declared safe cap.
  if(data.length!==Math.min(PAGE,count-offset)||data.length<1||end>=count||
     total!==count||start!==offset||end!==offset+data.length-1)
   throw Error("Forum view changed while paginating; retry next interval.");
  if(data.some(row=>!row||typeof row.id!=="string"||!row.id.trim()||typeof row.locale!=="string"||!row.locale.trim()||row.status!=="published"))
   throw Error("Unapproved row in public forum view; abort.");
  for(const row of data){
   const key=JSON.stringify([row.id,row.locale]);
   if(seen.has(key))throw Error("Duplicate public forum language row while paginating");
   seen.add(key);
  }
  results.push(...data);
  if(results.length===count)return results;
  if(data.length!==PAGE)throw Error("Forum pagination truncated");
 }
 throw Error("Forum public view exceeds safe cap");
}
