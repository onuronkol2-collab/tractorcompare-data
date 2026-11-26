import test from "node:test";
import assert from "node:assert/strict";
import {readOpeningTagAttribute as attr,googleIndexingBlockedByMeta,indexBlockingResponseHeader} from "../scripts/seo-html-attributes.mjs";

test("real live forum description with Turkish apostrophe is not truncated",()=>{
 const html='<meta name="description" content="Avrupa'+"'"+
  'da Same 13,7 puanla ilk sıraya yerleşirken Deutz-Fahr ve CLAAS onu takip etti.">';
 const description=attr(html,"content");
 assert.equal(description,
  "Avrupa'da Same 13,7 puanla ilk sıraya yerleşirken Deutz-Fahr ve CLAAS onu takip etti.");
 assert.equal(description.length,85);
 assert.equal(attr(html,"name"),"description");
});

test("attributes read exact double- and single-quoted values containing the opposite quote",()=>{
 assert.equal(attr('<meta content="Tractor &quot;quality&quot; and D\'Or" name="description">',"content"),
  "Tractor &quot;quality&quot; and D'Or");
 assert.equal(attr("<meta content='Seller said \"hello\"' name='description'>","content"),
  'Seller said "hello"');
 assert.equal(attr("<html lang='pt-BR'>","lang"),"pt-BR");
 assert.equal(attr('<link rel=canonical href=https://tractorvs.com/tractors/>',"href"),
  "https://tractorvs.com/tractors/");
});

test("attribute names must be real, not substrings inside other quoted values",()=>{
 const tag='<meta title="do not read content=\'injected\'" data-content="fake" name="description" content="Real value">';
 assert.equal(attr(tag,"content"),"Real value");
 assert.equal(attr(tag,"data-content"),"fake");
 assert.equal(attr('<img src="/tractor.jpg" data-alt="wrong">',"alt"),null);
 assert.equal(attr('<img alt src="/tractor.jpg">',"alt"),null);
 assert.equal(attr('<meta name="robots" content="noindex,follow">',"content"),"noindex,follow");
 assert.equal(attr('<link rel="canonical" href="https://tractorvs.com/tr/">',"href"),
  "https://tractorvs.com/tr/");
 assert.equal(attr(tag,"nonexistent"),null);
});

test("parser does not mistake URL syntax and spaces in a quoted value for new attrs",()=>{
 const tag='<link rel="alternate" hreflang="tr" href="https://tractorvs.com/tr/tractors/?q=foo&lang=en" title="Actual title here">';
 assert.equal(attr(tag,"href"),"https://tractorvs.com/tr/tractors/?q=foo&lang=en");
 assert.equal(attr(tag,"hreflang"),"tr");
 assert.equal(attr(tag,"rel"),"alternate");
});

test("published pages reject restrictive Google-specific meta and none shorthand",()=>{
 for(const tag of [
  '<meta name="googlebot" content="noindex,follow">',
  '<meta content="NONE" name="ROBOTS">',
  '<meta name="GoogleBot" content="index, NONE">',
  '<meta name="robots" content="index,follow,noindex">'
 ])assert.equal(googleIndexingBlockedByMeta([tag]),true,tag);
 assert.equal(googleIndexingBlockedByMeta(['<meta name="robots" content="index,follow">','<meta name="googlebot" content="none">']),true);
 for(const tag of [
  '<meta name="bingbot" content="noindex">',
  '<meta name="googlebot-news" content="noindex">',
  '<meta name="robots" content="index,follow,max-snippet:0">',
  '<meta name="description" content="none noindex">'
 ])assert.equal(googleIndexingBlockedByMeta([tag]),false,tag);
});
test("response header catches none as well as noindex",()=>{
 for(const value of ["none","NOINDEX, follow","googlebot: none","googlebot: noindex"])assert.equal(indexBlockingResponseHeader(value),true);
 for(const value of [null,"index, follow","max-snippet: 0","noindexing"])assert.equal(indexBlockingResponseHeader(value),false);
});
