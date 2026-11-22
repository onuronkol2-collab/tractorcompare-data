import test from "node:test";
import assert from "node:assert/strict";
import {fetchIndexedSitemapPages, sitemapLocs} from "../scripts/photo-sitemap-fetch.mjs";

test("all sitemap children are fetched as XML, never JSON because of map index", async () => {
  const urls=["https://tractorvs.com/sitemap-0.xml",
    "https://tractorvs.com/forum-sitemap.xml",
    "https://tractorvs.com/image-sitemap.xml"];
  const index="<sitemapindex>"+urls.map(url => "<sitemap><loc>"+url+"</loc></sitemap>").join("")+"</sitemapindex>";
  const payload=new Map(urls.map((url, i) => [url, "<urlset><url><loc>https://tractorvs.com/"+i+"/</loc></url></urlset>"]));
  const called=[];
  async function fetchXml(url, asJson=false) {
    assert.equal(asJson,false,"XML request must not be parsed as JSON");
    assert.ok(payload.has(url));
    called.push(url);
    return payload.get(url);
  }
  const pages=await fetchIndexedSitemapPages(index,fetchXml);
  assert.deepEqual(called,urls);
  assert.deepEqual(pages,["https://tractorvs.com/0/","https://tractorvs.com/1/","https://tractorvs.com/2/"]);
});
test("missing child sitemaps fail closed",async () => {
  await assert.rejects(fetchIndexedSitemapPages("<sitemapindex/>",async()=>""),/No sitemap index children/);
});
test("invalid non-text child response fails closed",async () => {
  await assert.rejects(fetchIndexedSitemapPages("<sitemapindex><loc>https://tractorvs.com/sitemap-0.xml</loc></sitemapindex>",async()=>({})),/XML text/);
});
test("XML escaped ampersands are restored in URL locations",()=>{
  assert.deepEqual(sitemapLocs("<urlset><loc>https://example.org/a?x=1&amp;y=2</loc></urlset>"),["https://example.org/a?x=1&y=2"]);
});
