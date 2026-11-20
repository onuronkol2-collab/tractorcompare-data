/**
 * Source-aligned machine-assisted editorial translation for all 8 additional
 * TractorVS locales. Public TR+EN editorial copy remains the source of truth.
 *
 * Result files are strictly unapproved DRAFTS. A complete target locale is
 * not routable or indexable until an independent locale QA gate passes.
 */
import {createHash} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {GLOSSARY_ROWS,GLOSSARY_SECTIONS} from "../src/lib/tractor-glossary.ts";
import {TRACTOR_PART_ROWS,TRACTOR_PART_SECTIONS} from "../src/lib/tractor-parts.ts";
import {TECHNICAL_DEEP_DIVES} from "../src/lib/tractor-technical-deep-dives.ts";
import {TRACTOR_LEARNING_CASES} from "../src/lib/tractor-learning-cases.ts";

const target=process.env.EDU_TARGET_LOCALE;
const langs=["zh","hi","pt-br","fr","de","ru","ja","es"];
if(!langs.includes(target))throw Error("EDU_TARGET_LOCALE must be one of the eight new locales");
const key=process.env.TRACTORVS_QUEUE_SECRET;
const jwt=process.env.TRACTORVS_SUPABASE_ANON_JWT;
const base="https://aaufxtcvnzgavtlintiv.supabase.co/functions/v1/tractor-editorial-translate";
if(!key||!jwt||!jwt.includes("."))throw Error("Translation queue secrets missing; no action taken");
const archiveDir=resolve("site/src/lib/education-draft-translations");
const version=createHash("sha256").update(JSON.stringify({
 glossary:GLOSSARY_ROWS,glossarySections:GLOSSARY_SECTIONS,
 parts:TRACTOR_PART_ROWS,partSections:TRACTOR_PART_SECTIONS,
 articles:TECHNICAL_DEEP_DIVES, cases:TRACTOR_LEARNING_CASES
})).digest("hex");
const batches={
 glossary:GLOSSARY_ROWS.map(r=>({id:r[1],english:{name:r[3],definition:r[5],example:r[7],caution:r[9]},turkish:{name:r[2],definition:r[4],example:r[6],caution:r[8]}})),
 parts:TRACTOR_PART_ROWS.map(r=>({id:r[1],english:{name:r[3],location:r[5],purpose:r[7],example:r[9],caution:r[11]},turkish:{name:r[2],location:r[4],purpose:r[6],example:r[8],caution:r[10]}})),
 glossarySections:Object.entries(GLOSSARY_SECTIONS).map(([id,x])=>({id,english:{name:x.en[0],intro:x.en[1]},turkish:{name:x.tr[0],intro:x.tr[1]}})),
 partSections:Object.entries(TRACTOR_PART_SECTIONS).map(([id,x])=>({id,english:{name:x.en[0],intro:x.en[1]},turkish:{name:x.tr[0],intro:x.tr[1]}})),
 articleMeta:TECHNICAL_DEEP_DIVES.map(x=>({id:x.slug,english:{title:x.title.en,description:x.description.en,lead:x.lead.en},turkish:{title:x.title.tr,description:x.description.tr,lead:x.lead.tr}})),
 articleSections:TECHNICAL_DEEP_DIVES.flatMap(x=>x.sections.map(s=>({id:x.slug+"--"+s.anchor,english:{title:s.title.en,p0:s.paragraphs.en[0],p1:s.paragraphs.en[1]},turkish:{title:s.title.tr,p0:s.paragraphs.tr[0],p1:s.paragraphs.tr[1]}}))),
 cases:TRACTOR_LEARNING_CASES.map(x=>({id:x.id,english:{title:x.title.en,situation:x.situation.en,explanation:x.explanation.en,remember:x.remember.en},turkish:{title:x.title.tr,situation:x.situation.tr,explanation:x.explanation.tr,remember:x.remember.tr}}))
};
const expected={
 glossary:96,parts:57,glossarySections:7,partSections:5,articleMeta:3,articleSections:15,cases:5
};
for(const [kind,items] of Object.entries(batches))
 if(items.length!==expected[kind])throw Error("Original editorial count changed: "+kind);

const output={locale:target,sourceHash:version,state:"draft-needs-editorial-review",
 machineProvider:"Gemini",createdAt:new Date().toISOString(),data:{},validation:{
  requires:["native-language editorial review","terminology consistency","safety warning fidelity","number and unit fidelity","no English content fallbacks"],
  reviewed:false
 }};
const bad=[];
let calls=0;
const maxCalls=Number(process.env.EDU_MAX_GEMINI_CALLS||55);
if(!Number.isSafeInteger(maxCalls)||maxCalls<1||maxCalls>60)throw Error("Invalid Gemini call cap");
const deadline=Date.now()+85*60*1000;

const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function post(body){
 const response=await fetch(base,{method:"POST",headers:{
  "Authorization":"Bearer "+jwt,"apikey":jwt,
  "x-queue-secret":key,"Content-Type":"application/json"
 },body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 const j=await response.json().catch(()=>({}));
 if(!response.ok)throw Error("Translation API "+response.status+": "+String(j.error||j.reason||"unknown").slice(0,210));
 return j;
}
function checkBatch(request,received){
 if(!Array.isArray(received)||received.length!==request.length)
  throw Error("Wrong item count");
 const map=new Map(received.map(r=>[r.id,r.fields]));
 for(const row of request){
  const item=map.get(row.id);
  if(!item||typeof item!=="object")throw Error("Missing translation "+row.id);
  const keys=Object.keys(row.english);
  if(keys.some(k=>typeof item[k]!=="string"||!item[k].trim()))
   throw Error("Empty translated field: "+row.id);
  if(Object.keys(item).length!==keys.length)throw Error("Unexpected translation fields: "+row.id);
 }
 return map;
}
async function translate(items){
 if(Date.now()>deadline)throw Error("Locale translation time budget exceeded");
 if(++calls>maxCalls)throw Error("Gemini call cap exceeded for "+target);
 const started=await post({action:"start",target,records:items});
 if(!started.interaction_id)throw Error("Provider did not issue interaction ID");
 for(let n=0;n<135;n++){
  await delay(n<4?2000:3000);
  const poll=await post({action:"poll",target,records:items,interaction_id:started.interaction_id});
  if(poll.complete===true)return checkBatch(items,poll.records);
 }
 throw Error("Provider interaction timed out without output");
}
const maxBatch=Number(process.env.EDU_BATCH_SIZE||5);
if(!Number.isInteger(maxBatch)||maxBatch<1||maxBatch>7)throw Error("Bad batch size");
for(const [kind,items] of Object.entries(batches)){
 const result={};
 for(let pos=0;pos<items.length;pos+=maxBatch){
  const batch=items.slice(pos,pos+maxBatch);
  try{
   const returned=await translate(batch);
   for(const item of batch)result[item.id]=returned.get(item.id);
   console.log("Translation OK "+target+" "+kind+" "+Math.min(pos+maxBatch,items.length)+"/"+items.length);
  }catch(err){
   bad.push({kind,start:pos,ids:batch.map(x=>x.id),error:String(err).slice(0,190)});
   console.error("Translation BLOCKED "+target+" "+kind+" "+String(err).slice(0,180));
   // Do not attempt to brute-force quota or safety failures.
   break;
  }
 }
 output.data[kind]=result;
 if(bad.length)break;
}
output.summary=Object.fromEntries(Object.entries(output.data).map(([k,v])=>[k,Object.keys(v).length]));
output.errors=bad;
output.validation.complete=bad.length===0&&Object.entries(expected).every(([k,n])=>Object.keys(output.data[k]||{}).length===n);
await mkdir(archiveDir,{recursive:true});
await writeFile(resolve(archiveDir,target+".json"),JSON.stringify(output,null,2)+"\n","utf8");
console.log("TRANSLATION_DRAFT_SUMMARY "+JSON.stringify({locale:target,complete:output.validation.complete,hash:version,calls,counts:output.summary,failures:bad.length}));
if(!output.validation.complete)process.exitCode=2;
