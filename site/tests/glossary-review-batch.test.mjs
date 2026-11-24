import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makePacket,validateReturn} from "../scripts/prepare-glossary-review-batch.mjs";
const doc=JSON.parse(readFileSync(new URL("../docs/translation-review/glossary-remaining-bulk-draft.json",import.meta.url),"utf8"));
test("one bounded export covers all 656 missing glossary entries and 1968 prose fields",()=>{
 const p=makePacket(doc);
 assert.equal(p.jobs.length,8);
 assert.equal(p.jobs.flatMap(j=>j.entries).length,656);
 assert.equal(p.jobs.flatMap(j=>j.entries).flatMap(e=>e.requestedFields).length,1968);
 assert.equal(p.notForPublication,true);
 assert.equal(makePacket(doc).packetSha256,p.packetSha256);
 assert.throws(()=>makePacket(doc,["de","de"]));
 assert.throws(()=>makePacket(doc,["xx"]));
 assert.notEqual(makePacket(doc,["de"]).packetSha256,p.packetSha256);
});
test("intake is source-bound and rejects missing, duplicate, English and placeholder content",()=>{
 // Synthetic data exercises shape only. It does not assert translation accuracy.
 const p=makePacket(doc,["de"]);
 const result={schema:1,packetSha256:p.packetSha256,sourceBlobSha:p.sourceBlobSha,
 state:"draft-needs-independent-editorial-review",notForPublication:true,reviewed:false,
 jobs:p.jobs.map(j=>({locale:j.locale,entries:j.entries.map(e=>({id:e.id,definition:"Deutscher Prüfsatz.",example:"Nur synthetischer Beispielsatz.",caution:"Synthetischer Warnhinweis."}))}))};
 const accepted=validateReturn(p,result);
 assert.equal(accepted.completedFields,246);
 assert.equal(accepted.publicationApproved,false);
 assert.equal(accepted.semanticNumberUnitSafetyReview,"pending");
 const mutations=[
  r=>r.packetSha256="bad",r=>r.sourceBlobSha="bad",r=>r.reviewed=true,
  r=>r.notForPublication=false,r=>r.jobs.pop(),r=>r.jobs[0].entries.pop(),
  r=>r.jobs[0].entries[1].id=r.jobs[0].entries[0].id,
  r=>r.jobs[0].entries[0].definition=p.jobs[0].entries[0].source.definition,
  r=>r.jobs[0].entries[0].definition="TODO",
  r=>r.jobs[0].entries[0].definition="<p>Text</p>",
  r=>r.jobs[0].entries[0].example=""
 ];
 for(const mutate of mutations){const copy=structuredClone(result);mutate(copy);assert.throws(()=>validateReturn(p,copy));}
});
