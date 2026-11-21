// GitHub Actions -> private Supabase forum translation queue processor.
// Bounded, idempotent. No service role, private text or raw Gemini output in CI.
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {appendFileSync} from "node:fs";
import {assertAnonJwt} from "./tractor-research-batch.mjs";
const URL="https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-forum-translate";
const ACCEPTED=new Set(["ready","needs_review","partial","retry","failed","superseded","queue_empty"]);
export function validateReceipt(x){
 if(!x||x.success!==true||!ACCEPTED.has(x.status)||
  !Number.isSafeInteger(x.processed)||x.processed<0||x.processed>1)
  throw Error("Forum translation worker receipt invalid.");
 if(x.processed===1&&!["ready","needs_review","partial"].includes(x.status))
  throw Error("Unexpected completed translation state.");
 if(["ready","needs_review","partial"].includes(x.status)&&
  !["en","zh","hi","pt-br","fr","de","ru","ja","es"].includes(x.locale))
  throw Error("Unexpected translated locale.");
 return {status:x.status,processed:x.processed,
  ...(x.locale?{locale:x.locale}:{})};
}
export async function runTranslationQueue({jwt,secret,fetchFn=fetch,max=3}){
 if(!jwt||!secret)throw Error("Missing translation GitHub Actions secrets.");
 assertAnonJwt(jwt);
 if(!Number.isInteger(max)||max<1||max>3)throw Error("Max 3 jobs per run.");
 const headers={"content-type":"application/json","apikey":jwt,
  "Authorization":"Bearer "+jwt,"x-queue-secret":secret};
 const receipts=[];
 for(let i=0;i<max;i++){
  const res=await fetchFn(URL,{method:"POST",headers,body:JSON.stringify({action:"process_topic"}),
   signal:AbortSignal.timeout(230000)});
  if(!res.ok)throw Error("Private forum translation worker HTTP "+res.status);
  const parsed=await res.json();
  const receipt=validateReceipt(parsed);
  receipts.push(receipt);
  // Each retry/failed receipt has already backed off its own job in the private DB.
  // Continue to the next due job (bounded by max=3) rather than letting one
  // overloaded language prevent other consented topics from progressing.
  // A retry still fails the GitHub process job so no error is hidden.
  if(receipt.status==="queue_empty")break;
 }
 return receipts;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const result=await runTranslationQueue({
   jwt:process.env.TRACTORVS_SUPABASE_ANON_JWT,
   secret:process.env.TRACTORVS_QUEUE_SECRET
  });
  console.log("Forum translation batch "+JSON.stringify(result));
  const summary="# Forum opt-in translation worker\n\n"+
   result.map(r=>"- "+r.status+(r.locale?" ("+r.locale+")":"")).join("\n")+
   "\n\nOnly consented public topics are processed. Needs-review content is not public.\n";
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
  if(result.some(x=>x.status==="failed"||x.status==="retry"))process.exitCode=1;
 }catch(err){
  console.error("Forum translation queue failed safely: "+String(err?.message||"unknown").slice(0,140));
  process.exitCode=1;
 }
}
