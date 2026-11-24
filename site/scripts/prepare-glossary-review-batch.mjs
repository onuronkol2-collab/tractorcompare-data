// Offline, free-first bulk exchange. No network, provider calls, route writes,
// or editorial approval. stdout is a review packet, never a publishable page.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {pathToFileURL} from "node:url";
const here=import.meta.url;
const read=p=>readFileSync(new URL(p,here),"utf8");
const verifier=fileURLToPath(new URL("./verify-article-review-drafts.mjs",here));
const fields=["definition","example","caution"];
const hash=s=>createHash("sha256").update(s).digest("hex");
export function makePacket(doc,selected=doc.languages){
 assert.ok(Array.isArray(selected)&&selected.length>0&&selected.length<=8);
 assert.equal(new Set(selected).size,selected.length,"Duplicate language");
 assert.ok(selected.every(l=>doc.languages.includes(l)),"Unknown language");
 const jobs=selected.map(locale=>({locale,entries:doc.rows.map(row=>({
  id:row.id,category:row.category,source:row.source,termDraft:row.names[locale],
  requestedFields:fields
 }))}));
 const core={schema:1,sourceBlobSha:doc.sourceBlobSha,jobs};
 return {...core,packetSha256:hash(JSON.stringify(core)),state:"draft-needs-independent-editorial-review",notForPublication:true};
}
export function validateReturn(packet,returned){
 assert.equal(returned.schema,1);
 assert.equal(returned.packetSha256,packet.packetSha256,"Stale or different packet");
 assert.equal(returned.sourceBlobSha,packet.sourceBlobSha,"Different source revision");
 assert.equal(returned.state,"draft-needs-independent-editorial-review");
 assert.equal(returned.notForPublication,true);
 assert.equal(returned.reviewed,false);
 assert.ok(Array.isArray(returned.jobs));
 assert.equal(returned.jobs.length,packet.jobs.length,"Missing or extra language");
 const byLocale=new Map();
 for(const j of returned.jobs){
  assert.ok(!byLocale.has(j.locale),"Duplicate locale");byLocale.set(j.locale,j);
 }
 let completedFields=0;
 for(const job of packet.jobs){
  const got=byLocale.get(job.locale);assert.ok(got,"Missing locale "+job.locale);
  assert.ok(Array.isArray(got.entries));assert.equal(got.entries.length,job.entries.length,"Incomplete locale "+job.locale);
  const seen=new Map();
  for(const entry of got.entries){assert.ok(!seen.has(entry.id),"Duplicate ID");seen.set(entry.id,entry)}
  for(const original of job.entries){
   const entry=seen.get(original.id);assert.ok(entry,"Missing "+original.id);
   assert.deepEqual(Object.keys(entry).sort(),["caution","definition","example","id"]);
   for(const field of fields){
    const value=entry[field],source=original.source[field];
    assert.ok(typeof value==="string"&&value.trim()&&value.trim()===value&&value.length<=Math.max(800,source.length*5),"Missing or malformed "+job.locale+"/"+original.id+"/"+field);
    assert.notEqual(value,source,"English fallback");
    assert.ok(!/\b(?:TODO|TBD|PLACEHOLDER)\b/i.test(value),"Placeholder");
    assert.ok(!/<\/?[a-z][^>]*>/i.test(value),"HTML not allowed");
    completedFields++;
   }
  }
 }
 return {languages:packet.jobs.length,entries:packet.jobs.reduce((n,j)=>n+j.entries.length,0),completedFields,structuralIntake:"passed",semanticNumberUnitSafetyReview:"pending",independentReview:"pending",publicationApproved:false};
}
function main(){
 execFileSync(process.execPath,[verifier],{stdio:["ignore","ignore","inherit"]});
 const doc=JSON.parse(read("../docs/translation-review/glossary-remaining-bulk-draft.json"));
 const args=process.argv.slice(2);
 const mode=args.shift()||"export";
 if(mode==="export"){
  const selected=args.length?args:doc.languages;
  console.log(JSON.stringify(makePacket(doc,selected),null,2));return;
 }
 if(mode==="check-return"){
  const input=args.shift();assert.ok(input,"Provide a returned JSON path");
  const selected=args.length?args:doc.languages;
  const raw=readFileSync(input);assert.ok(raw.length<=4*1024*1024,"Return exceeds 4 MiB");
  console.log(JSON.stringify(validateReturn(makePacket(doc,selected),JSON.parse(raw.toString("utf8")))));return;
 }
 throw Error("Usage: export [locale ...] | check-return FILE [locale ...]");
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===here)main();
