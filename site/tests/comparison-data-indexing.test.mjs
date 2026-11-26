import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {comparisonSampleId,comparisonDataProblems} from "../scripts/comparison-data-indexing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("comparison data stays public for rendering, but is explicitly noindexed",()=>{
 const id="609cbd59-a8f5-4859-8147-70097ec38946";
 assert.equal(comparisonSampleId('<select id="tc-left"><option value="'+id+'" selected>Model</option></select>'),id);
 assert.equal(comparisonSampleId('<select id="tc-left"><option value="../bad">bad</option></select>'),null);
 const response=(value,status=200,mime="application/json")=>new Response("[]",{status,headers:{"content-type":mime,...(value?{"x-robots-tag":value}:{})}});
 assert.deepEqual(comparisonDataProblems(response("noindex"),"[]"),[]);
 assert.ok(comparisonDataProblems(response(null),"[]").includes("missing-noindex"));
 assert.ok(comparisonDataProblems(response("noindex",404),"[]").includes("http-404"));
 assert.ok(comparisonDataProblems(response("noindex",200,"text/html"),"{}").includes("wrong-mime"));
 assert.ok(comparisonDataProblems(response("noindex"),"{}").includes("invalid-shape"));
 assert.match(read("public/_headers"),/^\/comparison-data\/\*\s*\n\s*X-Robots-Tag: noindex\s*$/m);
});
test("discovery preserves clean links and limits visitor-state links",()=>{
 const detail=read("src/components/TractorDetail.astro");
 assert.equal((detail.match(/href=\{compareUrl\} rel="nofollow"/g)||[]).length,2);
 assert.match(detail,/\?tractor=.*rel="nofollow"/);
 assert.match(read("src/components/HomeExperience.astro"),/\?q=.*rel="nofollow"/);
 assert.match(read("src/components/LocaleSuggestion.astro"),/id="locale-suggestion-link" href="\/" rel="nofollow"/);
 const compare=read("src/components/TractorComparison.astro");
 assert.match(compare,/if\(!firstRender\|\|params\.has\("left"\)\|\|params\.has\("right"\)\|\|params\.has\("view"\)\)syncSelection\(left,right\);/);
 assert.match(read("src/layouts/SiteLayout.astro"),/link\.relList\.toggle\("nofollow",Boolean\(destination\.search\)\)/);
});
