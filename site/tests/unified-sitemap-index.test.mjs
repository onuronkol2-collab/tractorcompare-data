import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,rmSync,unlinkSync,readFileSync,mkdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {verifyUnifiedSitemapIndex} from "../scripts/verify-unified-sitemap-index.mjs";

const origin="https://tractorvs.com";
const locales=["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"];
const mapURLs=[
 origin+"/sitemap-0.xml",
 origin+"/forum-sitemap.xml",
 origin+"/image-sitemap.xml",
];
const xmlURLSet=urls=>'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
 urls.map(url=>"<url><loc>"+url+"</loc></url>").join("")+"</urlset>";
const index=entries=>'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
 entries.map(url=>"<sitemap><loc>"+url+"</loc></sitemap>").join("")+"</sitemapindex>";
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),"tractorvs-master-sitemap-"));
 const files={
  "sitemap-index.xml": index(mapURLs),
  "sitemap-0.xml": xmlURLSet(locales.flatMap(lang=>[
   origin+"/"+lang,origin+"/"+lang+"articles/",origin+"/"+lang+"tractors/"
  ])),
  "image-sitemap.xml":xmlURLSet([origin+"/tr/tractors/"]),
  "forum-sitemap.xml":xmlURLSet([origin+"/tr/forum/",origin+"/tr/forum/approved-topic/"]),
  "robots.txt":"User-agent: *\nAllow: /\n"+["sitemap-index.xml","forum-sitemap.xml","image-sitemap.xml"].map(x=>"Sitemap: "+origin+"/"+x).join("\n"),
 };
 for(const [name,body] of Object.entries(files))writeFileSync(join(dir,name),body);
 const forumDirs=["tr/forum","tr/forum/approved-topic"];
 for(const path of forumDirs){
  mkdirSync(join(dir,path),{recursive:true});
  const url=origin+"/"+path+"/";
  writeFileSync(join(dir,path,"index.html"),
   '<html><head><link rel="canonical" href="'+url+'"><meta name="robots" content="index,follow"></head><body><main>Approved public forum</main></body></html>');
 }
 return {dir,files,put:(name,value)=>writeFileSync(join(dir,name),value)};
}
test("one root sitemap index includes 10 home, article and catalog locales plus image and approved forum",()=>{
 const f=fixture();
 try {
  const report=verifyUnifiedSitemapIndex({dist:f.dir,origin});
  assert.equal(report.index_children,3);
  assert.equal(report.html_children,1);
  assert.equal(report.catalog_locales,10);
  assert.equal(report.forum_urls,2);
  assert.equal(report.html_pages,30);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("missing forum/image in master index is always a hard production failure",()=>{
 const f=fixture();
 try{
  for(const missing of ["forum-sitemap.xml","image-sitemap.xml"]){
   f.put("sitemap-index.xml",index(mapURLs.filter(url=>!url.endsWith("/"+missing))));
   assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/MASTER SITEMAP BLOCKED/);
  }
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("missing generated child, missing locale and wrong host fail closed",()=>{
 const f=fixture();
 try {
  unlinkSync(join(f.dir,"image-sitemap.xml"));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/Missing generated file/);
  f.put("image-sitemap.xml",f.files["image-sitemap.xml"]);
  f.put("sitemap-0.xml",xmlURLSet(locales.flatMap(lang=>[
   origin+"/"+lang,origin+"/"+lang+"articles/",origin+"/"+lang+"tractors/"
  ]).filter(url=>url!==origin+"/ja/tractors/")));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/Missing indexed catalog locale/);
  f.put("sitemap-0.xml",f.files["sitemap-0.xml"]);
  f.put("sitemap-index.xml",index(mapURLs.map(url=>url.replace(origin,"https://wrong.example"))));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/missing/);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("missing published homepage or editorial hub in any locale blocks the release",()=>{
 const f=fixture();
 try{
  const full=locales.flatMap(lang=>[
   origin+"/"+lang,origin+"/"+lang+"articles/",origin+"/"+lang+"tractors/"
  ]);
  for(const lang of locales){
   for(const [suffix,label] of [["","home"],["articles/","editorial hub"]]){
    const omitted=origin+"/"+lang+suffix;
    f.put("sitemap-0.xml",xmlURLSet(full.filter(url=>url!==omitted)));
    assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),
     new RegExp("Missing indexed "+label+" locale "+(lang||"en")),
     "missing sitemap entry must stop deployment: "+omitted);
   }
  }
  f.put("sitemap-0.xml",f.files["sitemap-0.xml"]);
  assert.equal(verifyUnifiedSitemapIndex({dist:f.dir,origin}).html_pages,30);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("approved forum photo pages must have canonical published HTML and may be image sitemap references",()=>{
 const f=fixture();
 try{
  f.put("image-sitemap.xml",xmlURLSet([origin+"/tr/forum/approved-topic/"]));
  const report=verifyUnifiedSitemapIndex({dist:f.dir,origin});
  assert.equal(report.approved_forum_image_pages,1);
  assert.equal(report.image_page_references,1);
  f.put("image-sitemap.xml",xmlURLSet([origin+"/tr/forum/private-draft/"]));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/absent from published HTML and approved forum/);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("draft/offsite/noindex forum pages are blocked before production deploy",()=>{
 const f=fixture();
 try{
  f.put("forum-sitemap.xml",xmlURLSet([origin+"/tr/forum/private-draft/"]));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/was not built/);
  f.put("forum-sitemap.xml",xmlURLSet(["https://example.net/tr/forum/approved-topic/"]));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/Noncanonical\/offsite/);
  f.put("forum-sitemap.xml",f.files["forum-sitemap.xml"]);
  const page=join(f.dir,"tr/forum/approved-topic/index.html");
  f.put("tr/forum/approved-topic/index.html",readFileSync(page,"utf8").replace("index,follow","noindex,follow"));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/Noindex forum page/);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("duplicate image sitemap page references fail closed before production",()=>{
 const f=fixture();
 try{
  f.put("image-sitemap.xml",xmlURLSet([origin+"/tr/tractors/",origin+"/tr/tractors/"]));
  assert.throws(()=>verifyUnifiedSitemapIndex({dist:f.dir,origin}),/Duplicate page in image sitemap/);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("no approved forum topics produces a valid empty forum child, never drafts",()=>{
 const f=fixture();
 try{
  f.put("forum-sitemap.xml",xmlURLSet([]));
  assert.equal(verifyUnifiedSitemapIndex({dist:f.dir,origin}).forum_urls,0);
 }finally{rmSync(f.dir,{recursive:true,force:true})}
});
test("Astro native customSitemaps configuration and production release gate remain wired",()=>{
 const config=readFileSync(new URL("../astro.config.mjs",import.meta.url),"utf8");
 const gate=readFileSync(new URL("../scripts/production-release-gate.mjs",import.meta.url),"utf8");
 assert.match(config,/customSitemaps\s*:/);
 for(const name of ["forum-sitemap.xml","image-sitemap.xml"])assert.ok(config.includes(name));
 assert.match(gate,/verifyUnifiedSitemapIndex\(\{dist,origin\}\)/);
 assert.match(config,/forum\(\?:/); // Existing forum exclusion is intentional
});
