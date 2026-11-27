import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {validateCandidateIdentity,verifyPublicSnapshot,verifySitemapTransition} from "../../scripts/tractorvs-publication-evidence.mjs";
import {candidatePlan,REPO} from "../../scripts/tractorvs-publication-candidate.mjs";
import {deriveHistory,DIGEST_ALGORITHM,ORIGIN} from "../../scripts/tractor-sitemap-history.mjs";
const main="a".repeat(40),head="b".repeat(40),now=Date.parse("2026-11-27T15:00:00.000Z"),timestamp=new Date(now).toISOString(),old=new Date(now-3600000).toISOString();
const catalog={fingerprint:"c".repeat(64),scope:"aaufxtcvnzgavtlintiv",source:"anon_public_view",published_models:400,public_rows:1000};
const previous={...catalog,generated_at:old},observed={...catalog,fingerprint:"d".repeat(64),public_rows:1001},submitted={...observed,generated_at:timestamp};
const path="site/src/data/public-catalog-sync.json",content=JSON.stringify(submitted)+"\n",files=[{path,content}];
const plan=candidatePlan({kind:"catalog",baseSha:main,files});
const pr={state:"open",draft:false,user:{login:"tractorvs-secure-publisher[bot]"},head:{sha:head,ref:plan.branch,repo:{full_name:REPO}},base:{sha:main,ref:"main",repo:{full_name:REPO}},changed_files:1};
const commit={sha:head,parents:[{sha:main}]};
const changedFiles=[{filename:path,status:"modified",sha:createHash("sha1").update("blob "+Buffer.byteLength(content)+"\0").update(content).digest("hex")}];
const input={pr,commit,changedFiles,files,main,kind:"catalog"};
test("candidate identity binds App, exact main parent, branch, paths and bytes",()=>{
 assert.equal(validateCandidateIdentity(input).digest,plan.digest);
 for(const bad of [{pr:{...pr,draft:true}},{pr:{...pr,user:{login:"other"}}},{pr:{...pr,head:{...pr.head,ref:"other"}}},{commit:{...commit,parents:[{sha:head}]}},{changedFiles:[{...changedFiles[0],sha:head}]},{changedFiles:[...changedFiles,...changedFiles]},{files:[{path,content:content+" "}]}])assert.throws(()=>validateCandidateIdentity({...input,...bad}));
});
test("catalog independent hash/count and freshness plus withdrawal guard",()=>{
 const args={kind:"catalog",previous,submitted,observed,now};
 assert.equal(verifyPublicSnapshot(args).kind,"catalog");
 for(const bad of [{submitted:{...submitted,generated_at:old}},{observed:{...observed,public_rows:1002}},{submitted:{...submitted,unexpected:"x"}},{submitted:{...submitted,generated_at:new Date(now+60000).toISOString()}},{submitted:{...submitted,published_models:300},observed:{...observed,published_models:300}}])assert.throws(()=>verifyPublicSnapshot({...args,...bad}));
});
test("forum removal is permitted only for matching public evidence",()=>{
 const prev={source:"anon_public_forum_views",scope:catalog.scope,fingerprint:catalog.fingerprint,public_topics:2,indexable_topics:2,public_replies:1,public_images:1,public_rows:4,generated_at:old};
 const latest={source:prev.source,scope:prev.scope,fingerprint:observed.fingerprint,public_topics:0,indexable_topics:0,public_replies:0,public_images:0,public_rows:0};
 assert.equal(verifyPublicSnapshot({kind:"forum",previous:prev,submitted:{...latest,generated_at:timestamp},observed:latest,now}).removal,true);
});
test("sitemap rederives dates from trusted base and render, not candidate ledger",()=>{
 const pages=Array.from({length:100},(_,i)=>[ORIGIN+"/page-"+i+"/","c".repeat(64)]);
 const previous={...deriveHistory({pages,previous:{version:1,pages:{}},now:new Date(old)}).history,digestAlgorithm:DIGEST_ALGORITHM};
 const renderedPages=pages.map((p,i)=>i===0?[p[0],"d".repeat(64)]:p);
 const expected=deriveHistory({pages:renderedPages,previous,now:new Date(now)});
 const args={previous,history:expected.history,lastmod:expected.lastmod,renderedPages,generatedAt:timestamp,now};
 assert.equal(verifySitemapTransition(args).significant_changes,1);
 assert.throws(()=>verifySitemapTransition({...args,lastmod:{version:1,dates:{}}}));
 assert.throws(()=>verifySitemapTransition({...args,renderedPages:pages}));
 assert.throws(()=>verifySitemapTransition({...args,renderedPages:[...renderedPages,renderedPages[0]]}));
 assert.throws(()=>verifySitemapTransition({...args,renderedPages:renderedPages.slice(0,90)}));
});
