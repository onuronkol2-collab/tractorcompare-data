import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALES} from "../src/lib/locales.ts";
import {HOME} from "../src/lib/home-ui.ts";
import {UI} from "../src/lib/ui.ts";
import {countryAwareCatalogUrl} from "../src/lib/catalog-country-url.mjs";

test("all ten homepage and compare snippets are distinct, localized and meaningful",()=>{
 for(const key of ["seoTitle","seoDesc"]){
  assert.equal(HOME[key].length,LOCALES.length);
  assert.equal(new Set(HOME[key]).size,LOCALES.length);
  assert.ok(HOME[key].every(text=>text.trim().length>8));
 }
 assert.equal(UI.compareDesc.length,LOCALES.length);
 assert.equal(new Set(UI.compareDesc).size,LOCALES.length);
 assert.ok(UI.compareDesc.every(text=>text.trim().length>20));
 for(const [index,path] of [[0,"index.astro"],[1,"tr/index.astro"]]){
  const source=readFileSync(new URL("../src/pages/"+path,import.meta.url),"utf8");
  assert.ok(source.includes('seoTitle="'+HOME.seoTitle[index]+' | TractorVS"'));
  assert.ok(source.includes('seoDescription="'+HOME.seoDesc[index]+'"'));
 }
});

test("catalogue pricing preference permits ten locale paths on web previews",()=>{
 for(const lang of LOCALES){
  const route=(lang==="en"?"/":"/"+lang+"/")+"tractors/";
  const url=countryAwareCatalogUrl("https://preview.example"+route+"?q=2075#brand", "TR", ["TR"]);
  assert.equal(url,route+"?q=2075&country=TR#brand");
 }
});

test("catalogue pricing URLs cannot become network-path navigation or other routes",()=>{
 for(const href of ["https://tractorvs.com//evil.example/", "https://tractorvs.com/%2f%2fevil.example/", "https://tractorvs.com/tractors/example/", "https://tractorvs.com/fr/compare/", "https://tractorvs.com/en/tractors/", "https://user:pass@tractorvs.com/tractors/", "file:///tractors/", "javascript:alert(1)"]){
  assert.throws(()=>countryAwareCatalogUrl(href,"TR",["TR"]),/Unsupported catalogue URL/);
 }
});
