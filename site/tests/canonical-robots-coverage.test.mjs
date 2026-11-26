import test from "node:test";
import assert from "node:assert/strict";
import {blockedCanonicalPaths} from "../scripts/canonical-robots-coverage.mjs";
const routes=["/","/tr/tractors/","/de/tractors/model/","/fr/articles/","/ja/"];
const check=(robots,expected)=>assert.deepEqual(blockedCanonicalPaths(robots,routes),expected);
test("Googlebot groups override wildcard and merge repeated groups",()=>{
 check("User-agent: *\nDisallow: /\nUser-agent: Googlebot\nAllow: /\n",[]);
 check("User-agent: *\nAllow: /\nUser-agent: Googlebot\nDisallow: /de/\nUser-agent: googlebot/1.2\nDisallow: /fr/\n",["/de/tractors/model/","/fr/articles/"]);
 check("User-agent: *\nAllow: /\nUser-agent: Googlebot-News\nDisallow: /\n",[]);
});
test("specific allow and equal rule ties win; case and anchors preserved",()=>{
 check("User-agent: *\nDisallow: /\nAllow: /$\nAllow: /tr/\nAllow: /de/\nDisallow: /de/tractors/model/\nAllow: /de/tractors/model/\n",["/fr/articles/","/ja/"]);
 check("User-agent: *\nDisallow: /FR/\n",[]);
 check("User-agent: *\nDisallow: /*/tractors/*model/$\n",["/de/tractors/model/"]);
 check("User-agent: *\nDisallow: /%74r/\n",["/tr/tractors/"]);
});
test("empty rules, comments and intervening sitemap records",()=>{
 check("User-agent: Otherbot\nSitemap: https://tractorvs.com/sitemap-index.xml\nUser-agent: Googlebot\nDisallow: /ja/ # comment\nDisallow:\n",["/ja/"]);
 check("User-agent: *\nDisallow: /language/\nDisallow: /comparison-data/\n",[]);
 assert.throws(()=>blockedCanonicalPaths(" ".repeat(500001),routes),/size/);
});
