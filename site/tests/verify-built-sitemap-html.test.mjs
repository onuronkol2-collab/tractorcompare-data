import test from "node:test";
import assert from "node:assert/strict";
import {inspectSitemapHtml} from "../scripts/verify-built-sitemap-html.mjs";
const origin="https://tractorvs.com";
const en=origin+"/guides/test/",tr=origin+"/tr/guides/test/";
const pages=new Set([en,tr]);
const base='<link rel="canonical" href="'+en+'"><link rel="alternate" hreflang="en" href="'+en+'"><link rel="alternate" hreflang="tr" href="'+tr+'"><link rel="alternate" hreflang="x-default" href="'+en+'">';
const doc=(head=base,lang="en")=>'<html lang="'+lang+'"><head>'+head+'</head><body><main><h1>Guide</h1></main></body></html>';
test("canonical sitemap HTML permits valid pages and ignores inert directives",()=>{
 assert.deepEqual(inspectSitemapHtml(doc(),en,pages),[]);
 assert.deepEqual(inspectSitemapHtml(doc(base+'<!-- <meta name="robots" content="noindex"> --><meta name="description" content="none">'),en,pages),[]);
});
test("blocks accidental noindex, googlebot none, and soft redirect on submitted URLs",()=>{
 for(const tag of ['<meta name="robots" content="noindex">','<meta content="none" name="googlebot">'])
  assert.ok(inspectSitemapHtml(doc(base+tag),en,pages).includes("index-blocked"));
 assert.ok(inspectSitemapHtml(doc(base+'<meta http-equiv="refresh" content="0; url=/">'),en,pages).includes("meta-refresh"));
});
test("blocks wrong/duplicate canonical, nonexistent or missing reciprocal locale, and wrong language",()=>{
 assert.ok(inspectSitemapHtml(doc(base+'<link rel="canonical" href="'+tr+'">'),en,pages).includes("wrong-or-duplicate-canonical"));
 assert.ok(inspectSitemapHtml(doc(base.replace('href="'+en+'"','href="'+tr+'"')),en,pages).includes("wrong-or-duplicate-canonical"));
 assert.ok(inspectSitemapHtml(doc(base),en,new Set([en])).includes("hreflang-tr"));
 assert.ok(inspectSitemapHtml(doc(base.replace('<link rel="alternate" hreflang="tr" href="'+tr+'">','')),en,pages).includes("hreflang-tr"));
 assert.ok(inspectSitemapHtml(doc(base,"de"),en,pages).includes("wrong-html-language"));
 assert.ok(inspectSitemapHtml(doc(base.replace('hreflang="x-default"','hreflang="de"')),en,pages).includes("wrong-x-default"));
});
