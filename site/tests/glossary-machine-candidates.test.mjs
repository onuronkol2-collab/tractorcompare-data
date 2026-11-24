import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const source=JSON.parse(read("../docs/translation-review/glossary-remaining-bulk-draft.json"));
const packet=JSON.parse(read("../docs/translation-review/glossary-google-sheets-candidates-20261124.json"));
test("machine candidate snapshot is source bound, complete in shape and explicitly not approved",()=>{
 const blob=read("../src/lib/tractor-glossary.ts");
 assert.equal(packet.sourceBlobSha,createHash("sha1").update("blob "+Buffer.byteLength(blob)+"\0").update(blob).digest("hex"));
 assert.equal(packet.sourceBlobSha,source.sourceBlobSha);
 assert.equal(packet.state,"raw-machine-candidates-not-editorially-reviewed");
 assert.equal(packet.notForPublication,true);
 assert.equal(packet.reviewed,false);
 assert.deepEqual(packet.jobs.map(j=>j.locale),["pt-br","zh","hi","ru","ja"]);
 assert.deepEqual(packet.jobs.map(j=>j.providerLocale),["pt","zh-CN","hi","ru","ja"]);
 const counts=[];
 for(const job of packet.jobs){
  assert.equal(job.entries.length,source.rows.length);
  let received=0,flagged=0,completeEntries=0;
  for(const [i,e] of job.entries.entries()){
   assert.equal(e.id,source.rows[i].id);
   assert.equal(e.name,source.rows[i].names[job.locale]);
   assert.deepEqual(Object.keys(e.fields),["definition","example","caution"]);
   let ready=0;
   for(const f of Object.values(e.fields)){
    if(f.state==="unavailable"){assert.equal(f.value,null);continue;}
    assert.equal(f.state,"machine-candidate");
    assert.ok(typeof f.value==="string"&&f.value.trim()&&!/^#|^Loading|^Yükleniyor/i.test(f.value));
    assert.ok(Array.isArray(f.flags));
    if(job.locale==="pt-br")assert.ok(f.flags.includes("Brazilian Portuguese review required; provider locale pt"));
    received++;ready++;if(f.flags.length)flagged++;
   }
   if(ready===3)completeEntries++;
  }
  counts.push({locale:job.locale,received,flagged,completeEntries});
 }
 assert.deepEqual(packet.counts,counts);
 assert.equal(counts.reduce((n,x)=>n+x.received,0),1230);
 assert.ok(counts.every(x=>x.completeEntries===82));
});

test("editorial corrections preserve the raw snapshot, source identity and technical tokens",()=>{
 const rawText=read("../docs/translation-review/glossary-google-sheets-candidates-20261124.json");
 const patch=JSON.parse(read("../docs/translation-review/glossary-machine-candidate-corrections-20261124.json"));
 assert.equal(patch.rawCandidateBlobSha,createHash("sha1").update("blob "+Buffer.byteLength(rawText)+"\0").update(rawText).digest("hex"));
 assert.equal(patch.sourceBlobSha,source.sourceBlobSha);
 assert.equal(patch.state,"editorial-corrections-await-independent-review");
 assert.equal(patch.reviewed,false);
 assert.equal(patch.notForPublication,true);
 const keys=new Set();
 const codes=["13.6-28","14.9-28","12F/12R","24F/24R","4WD","2WD","Stage V","Stage IIIA","DPF","SCR","DEF","ROPS","FOPS","HST","CVT","DCT","ISOBUS","OECD","dB(A)","kW","L/min","Ah"];
 const nums=s=>[...s.normalize("NFKC").matchAll(/\d+(?:[., \u00a0\u202f]\d+)*/g)].map(m=>m[0].replace(/[., \u00a0\u202f]/g,""));
 for(const c of patch.corrections){
  const key=[c.locale,c.id,c.field].join("/");
  assert.ok(!keys.has(key));keys.add(key);
  assert.equal(c.source,source.rows.find(x=>x.id===c.id).source[c.field]);
  assert.equal(c.original,packet.jobs.find(x=>x.locale===c.locale).entries.find(x=>x.id===c.id).fields[c.field].value);
  assert.ok(c.revised.trim()&&c.revised!==c.original);
  for(const code of codes)if(c.source.includes(code))assert.ok(c.revised.includes(code),key+" "+code);
  for(const n of new Set(nums(c.source)))assert.ok(nums(c.revised).includes(n),key+" "+n);
 }
 assert.equal(keys.size,109);
 for(const j of packet.jobs)for(const e of j.entries)for(const [k,v] of Object.entries(e.fields))if(v.flags.some(x=>x.startsWith("check-")))assert.ok(keys.has([j.locale,e.id,k].join("/")));
});
