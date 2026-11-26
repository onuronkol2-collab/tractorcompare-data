import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=name=>readFileSync(new URL("../../.github/workflows/"+name,import.meta.url),"utf8");
const cases=[["live-website-audit.yml","full-seo"],["mobile-performance-audit.yml","mobile-performance"]];
for(const [name,command] of cases){
 test(name+" allows only fixed owner commands on the dedicated open issue",()=>{
  const s=read(name);
  assert.match(s,/^  issue_comment:\n    types: \[created\]/m);
  assert.match(s,/^  workflow_dispatch:/m);
  assert.match(s,/^  schedule:/m);
  assert.match(s,/^  pull_request:/m);
  const block=s.match(/^    if: >-\n([\s\S]*?)^    concurrency:/m)?.[1];
  assert.ok(block,"missing job-level authorization before runner allocation");
  const guards=[
   "github.event_name == 'issue_comment' &&",
   "github.repository == 'onuronkol2-collab/tractorcompare-data' &&",
   "github.ref == 'refs/heads/main' &&",
   "github.event.action == 'created' &&",
   "github.event.issue.number == 747 &&",
   "github.event.issue.state == 'open' &&",
   "!github.event.issue.pull_request &&",
   "github.event.comment.author_association == 'OWNER' &&",
   "github.event.comment.user.type == 'User' &&",
   "github.event.comment.user.id == 356616554 &&",
   "github.event.sender.id == 356616554 &&",
   "(github.event.comment.body == '/tractorvs-audit "+command+"' ||",
   "github.event.comment.body == '/tractorvs-audit all'))"
  ];
  const normalized=block.split("\n").map(x=>x.trim()).filter(Boolean);
  const ordinary=["github.event_name == 'pull_request' ||","github.event_name == 'workflow_dispatch' ||","github.event_name == 'schedule' ||"];
  if(name==="live-website-audit.yml")ordinary.push("github.event_name == 'push' ||");
  assert.deepEqual(normalized,[...ordinary,...guards.map((g,i)=>i===0?"("+g:g)]);
  assert.equal((s.match(/github\.event\.comment\.body/g)||[]).length,2);
  assert.doesNotMatch(s,/\bsecrets\.|permissions:[\s\S]*?^  [a-z-]+: write/m);
  assert.match(s,/persist-credentials: false/);
  assert.match(s,/cancel-in-progress: false/);
  assert.doesNotMatch(s,/^  issue_comment:\n    types:.*(?:edited|deleted)/m);
 });
 test(name+" binds requested live audits to a coherent trusted production release",()=>{
  const s=read(name);
  assert.match(s,/id: audit_release/);
  assert.equal((s.match(/TRACTORVS_REQUIRE_WORKERS_BUILD: "true"/g)||[]).length,name==="live-website-audit.yml"?3:2);
  assert.match(s,/node site\/scripts\/live-release-readiness\.mjs "\$GITHUB_SHA" \/ \/tr\/tractors\/ \/fr\/articles\//);
  assert.match(s,/RELEASE_SHA: \$\{\{ steps\.audit_release\.outputs\.release_sha \}\}/);
  assert.match(s,/grep -Fx "release_sha=\$RELEASE_SHA" "\$GITHUB_OUTPUT"/);
  assert.ok(s.indexOf("Verify requested audit release")<s.indexOf("Confirm same served release"));
  if(name==="live-website-audit.yml"){
   assert.match(s,/TRACTORVS_SEO_AUDIT_MODE: .*github\.event_name == 'issue_comment'/);
   assert.match(s,/steps\.audit_release\.outcome == 'success' && steps\.audit_lastmod\.outcome == 'success'/);
  }
 });
}
