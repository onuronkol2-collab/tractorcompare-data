import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
const mode=process.argv[2];
assert.ok(mode==="indexable"||mode==="noindex","mode must be indexable or noindex");
const root="site/dist/";
const paths={
  en:"guides/tractor-technical-terms/index.html",
  tr:"tr/guides/tractor-technical-terms/index.html"
};
for(const [lang,file] of Object.entries(paths)){
 const html=readFileSync(root+file,"utf8");
 assert.match(html,new RegExp(`<html[^>]+lang="${lang}"`),`${lang} lang`);
 const count=(html.match(/class="glossary-card"/g)||[]).length;
 assert.equal(count,89,`${lang} SSR must render 89 substantive term cards`);
 assert.match(html,/https:\/\/www\.oecd\.org\/en\/topics\/tractors\.html/);
 assert.match(html,/https:\/\/tractortestlab\.unl\.edu\//);
 assert.match(html,/\/images\/tractors\/[^"]+\.jpg/,"only approved first-party photos are in markup");
 assert.match(html,lang==="tr"?/Traktör parçaları ve teknik terimleri/:/Tractor parts and technical terms/);
 if(mode==="indexable"){
  assert.match(html,/content="index,follow,max-image-preview:large"/);
  assert.match(html,/rel="canonical"/);
  assert.match(html,/hreflang="en"/);
  assert.match(html,/hreflang="tr"/);
  assert.doesNotMatch(html,/hreflang="fr"/,"do not link nonexistent glossary translations");
  assert.match(html,new RegExp("https://tractorvs.example/"+(lang==="tr"?"tr/":"")+"guides/tractor-technical-terms/"));
 } else {
  assert.match(html,/content="noindex,nofollow"/);
 }
}
if(mode==="indexable"){
 const files=readdirSync(root).filter(f=>/^sitemap-\d+\.xml$/.test(f));
 assert.ok(files.length>0,"SEO build should emit sitemap URL sets");
 const xml=files.map(f=>readFileSync(root+f,"utf8")).join("\n");
 for(const path of Object.values(paths)){
  const url="https://tractorvs.example/"+path.replace(/index\.html$/,"");
  assert.ok(xml.includes(url),`missing glossary in sitemap: ${url}`);
 }
}
console.log(`TractorVS glossary: 89 SSR terms, two original locales, ${mode} SEO checks passed`);
