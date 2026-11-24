import test from "node:test";
import assert from "node:assert/strict";
import {planResearch} from "../../scripts/tractor-batch-source-plan.mjs";
const now="2026-11-24T15:00:00Z",sha="a".repeat(64),changed="b".repeat(64);
const id=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const row=(n,url,other={})=>({tractor_id:id(n),brand:"Example",model:"M"+n,status:"draft",readiness:"HUMAN_RELEASE_REVIEW",source_url:url,...other});
const A="https://manufacturer.example/series.pdf",B="https://manufacturer.example/other.pdf",C="https://manufacturer.example/third.pdf";
test("shared source is selected first; overlapping sources do not inflate planned coverage",()=>{
 const r=planResearch({now,limit:2,rows:[row(1,A),row(1,A),row(2,A),row(3,A),row(1,B),row(2,B),row(4,C)]});
 assert.equal(r.summary.source_links,6);assert.equal(r.summary.distinct_planned_models,4);assert.deepEqual(r.selected_documents.map(x=>x.source_url),[A,C]);assert.equal(r.allowed_to_publish,false);
});
test("only same model and document hash skip previous review; changed source is reconsidered",()=>{
 const h={source_url:A,tractor_id:id(1),document_sha256:sha,status:"reviewed",reason:"Exact source reviewed"};
 const r=planResearch({now,rows:[row(1,A,{document_sha256:sha}),row(2,A,{document_sha256:sha}),row(3,B,{document_sha256:changed}),row(4,C)],history:[h,{...h,source_url:B,tractor_id:id(3)}]});
 assert.equal(r.summary.already_reviewed_links,1);assert.equal(r.summary.distinct_planned_models,3);
});
test("provider cooldown holds only affected URL; other sources and brand discovery proceed",()=>{
 const r=planResearch({now,rows:[row(1,A),row(2,B),row(3,null),row(4,null,{brand:"Other"}),row(5,C,{status:"published"}),row(6,"http://unsafe.example")],history:[{source_url:A,status:"cooldown",retry_after:"2026-11-25T00:00:00Z"}]});
 assert.equal(r.summary.cooldown_links,1);assert.equal(r.summary.draft_models,5);assert.equal(r.summary.no_link_models,3);assert.equal(r.summary.distinct_planned_models,1);assert.equal(r.brand_discovery[0].targets.length,2);
});
test("identity conflicts, version collisions, malformed history and excessive limits fail closed",()=>{
 assert.throws(()=>planResearch({now,rows:[row(1,A),row(1,B,{model:"wrong"})]}),/identity/);
 assert.throws(()=>planResearch({now,rows:[row(1,A,{document_sha256:sha}),row(1,A,{document_sha256:changed})]}),/version/);
 assert.throws(()=>planResearch({now,rows:[],history:[{source_url:A,status:"reviewed",tractor_id:id(1)}]}),/hash/);
 assert.throws(()=>planResearch({now,rows:[],limit:101}),/bounds/);
});
test("versioned URL queries remain distinct and fragment duplicates collapse",()=>{
 const r=planResearch({now,rows:[row(1,A+"?v=1#page=2"),row(1,A+"?v=1#page=4"),row(2,A+"?v=2")]});
 assert.equal(r.summary.source_links,2);assert.equal(r.summary.selected_documents,2);
});
