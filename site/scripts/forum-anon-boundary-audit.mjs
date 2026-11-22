import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
/* Read-only Supabase anon boundary check: no user tokens, writes, or private values. */
export const CHECKS=[
 {table:"tc_forum_topics",kind:"public",field:"status"},
 {table:"tc_forum_replies",kind:"public",field:"status"},
 {table:"tractorvs_image_candidates",kind:"private",field:"id"},
 {table:"tractorvs_spec_review_candidates",kind:"private",field:"id"},
 {table:"ai_research_documents",kind:"private",field:"id"},
 {table:"ai_research_findings",kind:"private",field:"id"},
 {table:"ai_research_runs",kind:"private",field:"id"},
 {table:"tractor_research_queue",kind:"private",field:"id"}
];
export function evaluateBoundaryResponse(check,status,rows,total){
 if(check.kind==="private")return {passed:status===401||status===403,reason:status===401||status===403?"protected":"exposed-or-uncertain"};
 if(status!==200||!Array.isArray(rows)||!Number.isInteger(total)||total>1000||total<0)
   return {passed:false,reason:"invalid-or-truncated-public-read"};
 const safe=rows.every(row=>row?.status==="published");
 return {passed:safe,reason:safe?"published-only":"nonpublic-record-exposed"};
}
export async function runAnonymousBoundaryAudit({origin="https://aaufxtcvnzgavtlintiv.supabase.co",anonKey,fetchFn=fetch}={}){
 if(typeof anonKey!=="string"||!anonKey.trim())throw Error("Anonymous public key unavailable");
 const base=new URL(origin);
 if(base.protocol!=="https:"||base.pathname!=="/"||base.search||base.hash||base.username||base.password)
   throw Error("Invalid audited endpoint origin");
 const results=[];
 for(const check of CHECKS){
   const endpoint=new URL("/rest/v1/"+check.table,base);
   endpoint.search=new URLSearchParams({select:check.field,limit:"1000"}).toString();
   let status=0,rows=null,total=null,reason=null;
   try{
     const response=await fetchFn(endpoint,{
       headers:{apikey:anonKey,Accept:"application/json",Prefer:"count=exact"},
       redirect:"error",cache:"no-store",signal:AbortSignal.timeout(10000)
     });
     status=response.status;
     if(check.kind==="public"&&status===200){
       rows=await response.json();
       const contentRange=response.headers.get("content-range")||"";
       const countText=contentRange.split("/").at(-1);
       if(countText&&/^\d+$/.test(countText))total=Number(countText);
     }
   }catch{reason="request-failed";}
   const verdict=reason?{passed:false,reason}:evaluateBoundaryResponse(check,status,rows,total);
   results.push({table:check.table,status,...verdict});
 }
 return {passed:results.every(x=>x.passed),results};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const report=await runAnonymousBoundaryAudit({anonKey:process.env.TRACTORVS_SUPABASE_ANON_JWT});
  for(const row of report.results)console.log("ANON_RLS_PROBE "+JSON.stringify(row));
  console.log("ANON_RLS_SUMMARY "+JSON.stringify({passed:report.passed,checked:report.results.length}));
  if(!report.passed)process.exitCode=1;
 }catch(error){console.error("ANON_RLS_ERROR "+String(error?.message||error));process.exitCode=1;}
}
