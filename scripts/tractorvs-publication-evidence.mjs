// Staging only: trusted callers must fetch GitHub metadata and independent
// public-source/render evidence. No merge, status, repository or DB writes.
import {createHash} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import {candidatePlan,REPO} from "./tractorvs-publication-candidate.mjs";
import {fingerprintPublicViewWithBoundedRetry,guardMassUnpublish} from "./tractor-publication-autosync.mjs";
import {fingerprintPublicForum} from "./tractor-forum-publication-autosync.mjs";
import {deriveHistory,DIGEST_ALGORITHM,ORIGIN} from "./tractor-sitemap-history.mjs";
const bot="tractorvs-secure-publisher[bot]";
const sha=v=>typeof v==="string"&&/^[a-f0-9]{40}$/.test(v);
const hex=v=>typeof v==="string"&&/^[a-f0-9]{64}$/.test(v);
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const count=n=>Number.isSafeInteger(n)&&n>=0;
const blob=content=>createHash("sha1").update("blob "+Buffer.byteLength(content)+"\0").update(content).digest("hex");
const stamp=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const equal=(a,b)=>isDeepStrictEqual(a,b);
export function validateCandidateIdentity({pr,commit,changedFiles,files,main,kind}){
 check(sha(main)&&pr?.state==="open"&&!pr.draft&&pr.user?.login===bot&&pr.head?.repo?.full_name===REPO&&pr.base?.repo?.full_name===REPO&&pr.base?.ref==="main"&&pr.base?.sha===main&&sha(pr.head?.sha),"Untrusted or stale candidate");
 check(commit?.sha===pr.head.sha&&commit.parents?.length===1&&commit.parents[0].sha===main,"Candidate must have exact current main parent");
 const plan=candidatePlan({kind,baseSha:main,files});
 check(pr.head.ref===plan.branch&&Array.isArray(changedFiles)&&changedFiles.length===plan.files.length&&pr.changed_files===plan.files.length,"Candidate ref or file inventory mismatch");
 for(const f of plan.files){
  const matches=changedFiles.filter(x=>x.filename===f.path);
  check(matches.length===1&&matches[0].status==="modified"&&matches[0].sha===blob(f.content),"Candidate blob/path mismatch");
 }
 return plan;
}
const ageOk=(time,now,maxAgeMs)=>stamp(time)&&Number.isFinite(now)&&Date.parse(time)<=now+1000&&now-Date.parse(time)<=maxAgeMs;
function validSnapshot(kind,record){
 if(!record||!hex(record.fingerprint)||record.scope!=="aaufxtcvnzgavtlintiv")return false;
 if(kind==="catalog")return record.source==="anon_public_view"&&count(record.published_models)&&record.published_models>0&&count(record.public_rows)&&record.public_rows>=record.published_models;
 return record.source==="anon_public_forum_views"&&["public_topics","indexable_topics","public_replies","public_images","public_rows"].every(k=>count(record[k]))&&record.indexable_topics<=record.public_topics&&record.public_rows===record.public_topics+record.public_replies+record.public_images;
}
export function verifyPublicSnapshot({kind,previous,submitted,observed,now=Date.now(),maxAgeMs=20*60*1000}){
 check(kind==="catalog"||kind==="forum","Unsupported public snapshot kind");
 check(Number.isSafeInteger(maxAgeMs)&&maxAgeMs>0&&maxAgeMs<=20*60*1000,"Invalid freshness window");
 check(validSnapshot(kind,previous)&&validSnapshot(kind,submitted)&&validSnapshot(kind,observed),"Malformed snapshot");
 check(ageOk(submitted.generated_at,now,maxAgeMs)&&stamp(previous.generated_at)&&Date.parse(submitted.generated_at)>Date.parse(previous.generated_at),"Stale or non-monotonic candidate");
 check(previous.fingerprint!==submitted.fingerprint,"Unchanged public fingerprint");
 const {generated_at,...actual}=submitted;
 check(equal(actual,observed),"Independent public fingerprint/count mismatch");
 if(kind==="catalog")guardMassUnpublish(previous,submitted);
 // Never add a minimum forum count: moderation removals must remain possible.
 return {kind,removal:kind==="forum"&&(submitted.public_topics<previous.public_topics||submitted.public_replies<previous.public_replies||submitted.public_images<previous.public_images)};
}
export async function verifyFreshPublicSnapshot({kind,previous,submitted,jwt,fetchFn=fetch,now=Date.now()}){
 check(kind==="catalog"||kind==="forum","Unsupported public snapshot kind");
 const read=kind==="catalog"?fingerprintPublicViewWithBoundedRetry:fingerprintPublicForum;
 const first=await read({jwt,fetchFn}),second=await read({jwt,fetchFn});
 check(equal(first,second),"Public view changed during independent verification");
 return verifyPublicSnapshot({kind,previous,submitted,observed:second,now});
}
export function verifySitemapTransition({previous,history,lastmod,renderedPages,generatedAt,now=Date.now()}){
 check(previous?.digestAlgorithm===DIGEST_ALGORITHM&&history?.digestAlgorithm===DIGEST_ALGORITHM,"Legacy or unexpected algorithm; separate review");
 check(ageOk(generatedAt,now,20*60*1000),"Stale sitemap evidence");
 check(Array.isArray(renderedPages)&&renderedPages.length>=100,"Incomplete trusted render evidence");
 const seen=new Set();
 for(const item of renderedPages){
  check(Array.isArray(item)&&item.length===2&&typeof item[0]==="string"&&hex(item[1]),"Malformed trusted render");
  const url=new URL(item[0]);check(url.origin===ORIGIN&&!url.search&&!url.hash&&!seen.has(item[0]),"Foreign or duplicate sitemap URL");seen.add(item[0]);
 }
 // Re-derive from trusted BASE, not submitted history. No one-time bulk exceptions.
 const expected=deriveHistory({pages:renderedPages,previous,now:new Date(generatedAt)});
 check(equal(expected.history,history)&&equal(expected.lastmod,lastmod),"Sitemap transition differs from independent render");
 check(!equal(previous,history),"No genuine history change");
 return expected.summary;
}
