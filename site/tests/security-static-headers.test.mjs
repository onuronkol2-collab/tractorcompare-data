import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const headers=readFileSync(new URL("../public/_headers",import.meta.url),"utf8");
const rules=headers.split(/\n(?=\/|https:\/\/)/g);
const global=rules.find(line=>line.startsWith("/*\n"))||"";
test("all static assets have conservative browser-safe response headers",()=>{
 assert.match(global,/^\/\*\n/);
 assert.match(global,/^\s+X-Content-Type-Options: nosniff\s*$/m);
 assert.match(global,/^\s+Referrer-Policy: strict-origin-when-cross-origin\s*$/m);
 assert.equal((headers.match(/^\/\*$/gm)||[]).length,1);
 // Strict policies require a separate OAuth, media and analytics compatibility review.
 assert.doesNotMatch(global,/Content-Security-Policy:|Strict-Transport-Security:|Permissions-Policy:/);
});
test("existing indexable custom domain, preview noindex and private JSON rules are retained",()=>{
 const preview=rules.find(line=>line.startsWith("https://:version.:subdomain.workers.dev/*\n"))||"";
 const comparison=rules.find(line=>line.startsWith("/comparison-data/*\n"))||"";
 const assets=rules.find(line=>line.startsWith("/_astro/*\n"))||"";
 assert.match(preview,/X-Robots-Tag: noindex/);
 assert.match(comparison,/X-Robots-Tag: noindex/);
 assert.match(assets,/Cache-Control: public, max-age=31536000, immutable/);
 assert.doesNotMatch(global,/X-Robots-Tag: noindex/);
 assert.doesNotMatch(global,/Cache-Control:/);
});
test("actual production and workers.dev SEO routing still uses the canonical host",()=>{
 const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
 const robots=readFileSync(new URL("../src/pages/robots.txt.ts",import.meta.url),"utf8");
 assert.match(layout,/const canonicalUrl = indexingEnabled/);
 assert.match(layout,/index,follow,max-image-preview:large/);
 assert.match(robots,/User-agent: OAI-SearchBot/);
});
