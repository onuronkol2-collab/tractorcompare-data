import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateEnvironment,validatePayload,sitemapTimestamp,publicationPilotFailure} from "../../scripts/tractorvs-integrated-publication-pilot.mjs";
const base="a".repeat(40),repo="onuronkol2-collab/tractorcompare-data";
const env={GITHUB_REPOSITORY:repo,GITHUB_REF:"refs/heads/main",GITHUB_SHA:base,GITHUB_EVENT_NAME:"workflow_dispatch"};
test("integrated pilot rejects non-main, wrong repo and unauthorized events",()=>{
 validateEnvironment(env,"publish");validateEnvironment({...env,GITHUB_EVENT_NAME:"pull_request_target"},"verify");
 for(const x of [{GITHUB_REF:"refs/heads/other"},{GITHUB_REPOSITORY:"other/repo"},{GITHUB_SHA:"bad"},{GITHUB_EVENT_NAME:"schedule"}])assert.throws(()=>validateEnvironment({...env,...x},"publish"));
 assert.throws(()=>validateEnvironment({...env,GITHUB_EVENT_NAME:"pull_request_target"},"publish"));
 validateEnvironment({...env,GITHUB_EVENT_NAME:"schedule",PILOT_AUTOMATIC:"true",CUTOVER_ENABLED:"true"},"publish");
 assert.throws(()=>validateEnvironment({...env,GITHUB_EVENT_NAME:"schedule",PILOT_AUTOMATIC:"true",CUTOVER_ENABLED:"false"},"publish"));
});
test("integrated candidate artifacts bind exact kind, main and permitted paths",()=>{
 const files=[{path:"site/src/data/public-catalog-sync.json",content:JSON.stringify({fingerprint:"b".repeat(64),scope:"aaufxtcvnzgavtlintiv",source:"anon_public_view"})}];
 const payload={kind:"catalog",baseSha:base,files};
 assert.equal(validatePayload(payload,"catalog",base).kind,"catalog");
 assert.throws(()=>validatePayload(payload,"forum",base));assert.throws(()=>validatePayload(payload,"catalog","b".repeat(40)));
 assert.throws(()=>validatePayload({...payload,files:[...files,{path:".github/workflows/x.yml",content:"{}"}]},"catalog",base));
});
test("sitemap timestamp preserves one transition timestamp and rejects mixed values",()=>{
 const previous={pages:{a:{digest:"1",modified:null}}},history={pages:{a:{digest:"2",modified:"2026-11-27T15:00:00.000Z"}}};
 assert.equal(sitemapTimestamp(previous,history),"2026-11-27T15:00:00.000Z");
 assert.throws(()=>sitemapTimestamp(previous,{pages:{...history.pages,b:{digest:"3",modified:"2026-11-27T15:01:00.000Z"}}}));
});
test("manual candidate secret isolated from build and verification remains advisory",()=>{
 const w=readFileSync(new URL("../../.github/workflows/tractorvs-integrated-publication-pilot.yml",import.meta.url),"utf8");
 const v=readFileSync(new URL("../../.github/workflows/tractorvs-publication-independent-evidence.yml",import.meta.url),"utf8");
 const [prepare,publish]=w.split("  create-candidate:");
 assert.doesNotMatch(prepare,/APP_PRIVATE_KEY|secure-publisher|schedule:/);
 assert.match(publish,/environment: secure-publisher/);assert.match(publish,/needs.prepare.outputs.changed == 'true'/);
 assert.doesNotMatch(publish,/npm ci|contents: write/);
 assert.doesNotMatch(v,/APP_PRIVATE_KEY|contents: write|pull-requests: write/);
 assert.match(v,/ref: \$\{\{ github.sha \}\}/);
});

test("pilot failure diagnostics retain fail-closed classification without exposing exception data",()=>{
 assert.deepEqual(publicationPilotFailure("publish",Error("Outstanding candidate requires reconciliation")),{phase:"publish",code:"candidate_reconciliation_required"});
 assert.deepEqual(publicationPilotFailure("publish",Error("Main moved: rebuild candidate evidence")),{phase:"publish",code:"base_moved"});
 assert.deepEqual(publicationPilotFailure("publish",Error("Candidate API HTTP 403 at POST /private/path?token=SECRET")),{phase:"publish",code:"github_http_403"});
 assert.deepEqual(publicationPilotFailure("verify",Error("GitHub request failed HTTP 422")),{phase:"verify",code:"github_http_422"});
 for(const error of [Error("PRIVATE_KEY=SECRET"),Error("GitHub request failed HTTP 403 SECRET"),"token=SECRET",null]){
  assert.deepEqual(publicationPilotFailure("SECRET",error),{phase:"unknown",code:"unclassified_failure"});
 }
});
