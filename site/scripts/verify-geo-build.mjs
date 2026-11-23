import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {verifyCrawlerGuide} from "./verify-crawler-guide.mjs";
const mode=process.argv[2];
assert.ok(mode==="indexable"||mode==="noindex");
const root="site/dist";
const get=(p)=>readFileSync(join(root,p),"utf8");
verifyCrawlerGuide("site/public/llms.txt", join(root, "llms.txt"));
for(const home of ["index.html","tr/index.html"]){
 const html=get(home);
 assert.match(html,/"@type":"Organization"/,home+" must identify publisher");
 assert.match(html,/"@type":"WebSite"/,home+" must identify site");
 assert.match(html,new RegExp('"@id":"https:\\/\\/tractorvs\\.'+(mode==="indexable"?"example":"com")+'\\/#organization"'),home+" publisher ID must be stable");
 assert.doesNotMatch(html,/"@type":"SearchAction"/, "Google deprecated Sitelinks Search Box");
 if(mode==="noindex")assert.match(html,/noindex,nofollow/);
 else assert.match(html,/index,follow,max-image-preview:large/);
}
const robots=get("robots.txt");
if(mode==="indexable"){
 assert.match(robots,/User-agent: OAI-SearchBot\nAllow: \//);
 assert.match(robots,/Sitemap: https:\/\/tractorvs\.example\/sitemap-index\.xml/);
}else{
 assert.match(robots,/Disallow: \//);
 assert.doesNotMatch(robots,/User-agent: OAI-SearchBot\nAllow: \//);
}
const template=readFileSync("site/src/components/TractorDetail.astro","utf8");
assert.match(template,/modelEvidenceAnswers\(safeEvidenceTractor,lang\)/);
assert.match(template,/specifications:tractor\.specifications\.filter\(spec=>!isUnresolvedComparisonSpec\(tractor,spec\)\)/);
assert.match(template,/model-answer-card/);
const modelLogic=readFileSync("site/src/lib/model-evidence-answers.ts","utf8");
assert.match(modelLogic,/spec\.verified_at/);
assert.match(modelLogic,/spec\.evidence_text/);
console.log("TractorVS GEO verified: optional AI navigation, public crawler policy, publisher identity, source-first model answers ("+mode+")");
