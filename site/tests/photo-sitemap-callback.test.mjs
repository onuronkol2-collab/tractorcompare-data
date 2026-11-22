import test from "node:test";
import assert from "node:assert/strict";
import {fetchIndexedSitemapPages,sitemapLocs} from "../scripts/photo-sitemap-fetch.mjs";
const ORIGIN="https://tractorvs.com";
const indexOf=urls=>'<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  +urls.map(url=>"<sitemap><loc>"+url+"</loc></sitemap>").join("")+"</sitemapindex>";
const urlset=urls=>'<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  +urls.map(url=>"<url><loc>"+url+"</loc></url>").join("")+"</urlset>";

test("all sitemap children are fetched as XML, never JSON because of map index",async()=>{
  const urls=[ORIGIN+"/sitemap-0.xml",ORIGIN+"/forum-sitemap.xml",ORIGIN+"/image-sitemap.xml"];
  const payload=new Map(urls.map((url,i)=>[url,urlset([ORIGIN+"/"+i+"/"])]));
  const called=[];
  async function fetchXml(url,asJson=false){
    assert.equal(asJson,false,"XML request must not be parsed as JSON");
    assert.ok(payload.has(url));called.push(url);return payload.get(url);
  }
  assert.deepEqual(await fetchIndexedSitemapPages(indexOf(urls),fetchXml,{origin:ORIGIN}),
    [ORIGIN+"/0/",ORIGIN+"/1/",ORIGIN+"/2/"]);
  assert.deepEqual(called,urls);
});
test("non-sitemap, empty and non-text responses fail closed",async()=>{
  const url=ORIGIN+"/sitemap-0.xml";
  await assert.rejects(fetchIndexedSitemapPages("<sitemapindex/>",async()=>"",{origin:ORIGIN}),/child count/);
  await assert.rejects(fetchIndexedSitemapPages(indexOf([url]),async()=>({}),{origin:ORIGIN}),/XML <urlset>/);
  await assert.rejects(fetchIndexedSitemapPages(indexOf([url]),async()=>"<html>oops</html>",{origin:ORIGIN}),/XML <urlset>/);
  await assert.rejects(fetchIndexedSitemapPages(indexOf([url]),async()=>urlset([]),{origin:ORIGIN}),/no public pages/);
});
test("off-domain and noncanonical sitemap children and pages are rejected",async()=>{
  const urls=["https://not-tractorvs.example/sitemap.xml",ORIGIN+"/sitemap-0.xml?secret=1",
    "http://tractorvs.com/sitemap.xml"];
  for(const url of urls)
    await assert.rejects(fetchIndexedSitemapPages(indexOf([url]),async()=>urlset([ORIGIN+"/"]),{origin:ORIGIN}),/noncanonical or off-origin/);
  await assert.rejects(fetchIndexedSitemapPages(indexOf([ORIGIN+"/sitemap-0.xml"]),
    async()=>urlset(["https://untrusted.example/tractors/test/"]),{origin:ORIGIN}),/noncanonical or off-origin/);
});
test("duplicate index children, wrong document type, and XML escaped entities",async()=>{
  const child=ORIGIN+"/sitemap-0.xml";
  await assert.rejects(fetchIndexedSitemapPages(indexOf([child,child]),async()=>urlset([ORIGIN+"/"]),{origin:ORIGIN}),/Duplicate/);
  await assert.rejects(fetchIndexedSitemapPages("<html><loc>hi</loc></html>",async()=>urlset([ORIGIN+"/"]),{origin:ORIGIN}),/sitemapindex/);
  assert.deepEqual(sitemapLocs("<urlset><loc>https://example.org/a?x=1&amp;y=2</loc></urlset>"),
    ["https://example.org/a?x=1&y=2"]);
});
