import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync(new URL("../src/styles/global.css",import.meta.url),"utf8");
const layout=readFileSync(new URL("../src/layouts/SiteLayout.astro",import.meta.url),"utf8");
const section=css.split("/* 2026-11-22 — Evidence-based readable content pass.")[1]??"";

test("legibility is a non-forum, main-content change with no invented SSR text",()=>{
 assert.ok(section.length>2200,"legibility pass must remain present");
 assert.match(layout,/<main id="main"/);
 assert.doesNotMatch(section,/\.community-shell|\.forum-thread|\.forum-composer/);
 assert.doesNotMatch(section,/!important/);
 assert.doesNotMatch(section,/content:\s*["']/);
 assert.doesNotMatch(section,/display:\s*none|visibility:\s*hidden/i);
});
test("essential research labels and linked evidence are readable",()=>{
 for(const selector of [
  ".section-summary",".feature-card > p:last-of-type",".model-spec-heading > p",
  ".model-spec-top h4",".model-spec-note",".model-spec-card blockquote",
  ".model-spec-source a",".model-spec-source small",".tractor-card-footer",
  ".catalog-facet-fields label",".catalog-brand-directory a",".tc-condition-caution",
  ".tc-result-main small"
 ])assert.ok(section.includes(selector),selector);
 assert.match(section,/#main \.model-spec-source a[\s\S]*?font-size:\s*14px/);
 assert.match(section,/#main :is\(\.model-spec-source small,[\s\S]*?font-size:\s*13px/);
 assert.match(section,/#main :is\(\.tc-workspace-intro p,[\s\S]*?font-size:\s*15px/);
});
test("mobile text and narrow translated values remain reflowable",()=>{
 assert.match(section,/@media \(max-width: 720px\)/);
 assert.match(section,/overflow-wrap:\s*anywhere/);
 assert.match(section,/min-width:\s*0/);
 assert.match(section,/font-size:\s*16px/);
});


test("technical learning, picture credits and linked manufacturer sources stay readable",()=>{
 for(const key of [".learn-cover figcaption",".tractor-photo-short-credit small",
   ".glossary-sources li a span",".parts-source-note p",".home-featured-variant"])
  assert.ok(section.includes(key),key);
 const guide=readFileSync(new URL("../src/components/TractorSelectionGuide.astro",import.meta.url),"utf8");
 assert.match(guide,/\.guide-steps \.guide-inline-sources\{font-size:14px/);
 assert.doesNotMatch(guide,/\.guide-inline-sources\{font-size:12px!important/);
});
