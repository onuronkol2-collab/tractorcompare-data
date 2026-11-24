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
});
