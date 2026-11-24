import {test} from "node:test";
import assert from "node:assert/strict";
import {parseProductionSitemapInventory,selectProductionSeoPages,REVIEWED_PAIR_PATHS,reviewedPairSitemapCoverage,resolveProductionSeoMode,verifyProductionSeoCoverage} from "../scripts/production-sitemap-inventory.mjs";
const BASE="https://tractorvs.com";
const langs=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const fileNames=["sitemap-0.xml","forum-sitemap.xml","image-sitemap.xml"];
const page=path=>BASE+path;
const urlset=(urls,withImages=false)=>'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+urls.map(u=>'<url><loc>'+u+'</loc>'+(withImages?'<image:image><image:loc>'+BASE+'/assets/photo.jpg</image:loc></image:image>':'')+'</url>').join("")+'</urlset>';
function fixture(){
 const html=[page("/"),...langs.flatMap(lang=>{
  const dir="/"+(lang==="en"?"":lang+"/")+"tractors/";
  return [page(dir),page(dir+"alpha-model/"),page(dir+"beta-model/")];
 })];
 const forum=[page("/tr/forum/"),page("/tr/forum/approved-research/")];
 const image=[html[2],html[5],forum[1]];
 const childUrls=fileNames.map(f=>page("/"+f));
 const index='<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+childUrls.map(u=>'<sitemap><loc>'+u+'</loc></sitemap>').join("")+'</sitemapindex>';
 const children=Object.fromEntries([[childUrls[0],urlset(html)],[childUrls[1],urlset(forum)],[childUrls[2],urlset(image,true)]]);
 return {indexXml:index,children,html,forum,image,childUrls};
}
test("normal overlapping images and approved forum image pages never count as duplicate SEO pages",()=>{
 const f=fixture();const result=parseProductionSitemapInventory(f);
 assert.equal(result.indexChildren,3);assert.equal(result.htmlPages.size,31);
 assert.equal(result.forumPages.size,2);
 assert.equal(result.imagePages.size,3);
 assert.equal(result.pages.size,33);
 assert.equal(result.modelCount,20);
 assert.equal(result.modelsPerLocale,2);
 assert.equal(result.imagePagesAlreadyInHtml,2);
 assert.equal(result.imagePagesInForumOnly,1);
});
test("duplicate pages inside a child, missing child, unknown child and unlisted images fail closed",()=>{
 const f=fixture();
 f.children[f.childUrls[0]]=urlset([...f.html,f.html[0]]);
 assert.throws(()=>parseProductionSitemapInventory(f),/Duplicate html page/);
 const missing=fixture();
 delete missing.children[missing.childUrls[2]];
 assert.throws(()=>parseProductionSitemapInventory(missing),/Missing fetched child/);
 const unlisted=fixture();
 unlisted.children[unlisted.childUrls[2]]=urlset([page("/private/forum-photo/")]);
 assert.throws(()=>parseProductionSitemapInventory(unlisted),/unapproved or unlisted/);
 const alien=fixture();
 alien.indexXml=alien.indexXml.replace("image-sitemap.xml","private-sitemap.xml");
 assert.throws(()=>parseProductionSitemapInventory(alien),/Unexpected sitemap child/);
});
test("hidden/unapproved, duplicated or offsite forum URLs must not enter the SEO crawl",()=>{
 const f=fixture();
 f.children[f.childUrls[1]]=urlset([page("/hidden-other/")]);
 assert.throws(()=>parseProductionSitemapInventory(f),/Non-forum URL/);
 const offsite=fixture();
 offsite.children[offsite.childUrls[1]]=urlset(["https://external.example/tr/forum/approved-research/"]);
 assert.throws(()=>parseProductionSitemapInventory(offsite),/Noncanonical\/offsite/);
 const overlap=fixture();
 overlap.children[overlap.childUrls[1]]=urlset([overlap.html[0]]);
 assert.throws(()=>parseProductionSitemapInventory(overlap),/Non-forum URL/);
});
test("partial locale coverage and swapped model slug are both rejected",()=>{
 const f=fixture();
 f.children[f.childUrls[0]]=urlset(f.html.filter(x=>x!==page("/de/tractors/beta-model/")));
 assert.throws(()=>parseProductionSitemapInventory(f),/Localized model slug parity failed: de/);
 const changed=fixture();
 changed.children[changed.childUrls[0]]=urlset(changed.html.map(x=>x===page("/ja/tractors/beta-model/")?page("/ja/tractors/not-beta-model/"):x));
 assert.throws(()=>parseProductionSitemapInventory(changed),/Localized model slug parity failed: ja/);
});
test("daily audit checks all editorial and forum pages, cycles model samples; weekly checks entire unique sitemap",()=>{
 const f=fixture(),inventory=parseProductionSitemapInventory(f);
 const first=selectProductionSeoPages(inventory,{mode:"daily",day:0,samplePerLocale:1});
 const second=selectProductionSeoPages(inventory,{mode:"daily",day:1,samplePerLocale:1});
 assert.equal(first.length,23); // one homepage, 10 catalog landings, two forum, ten model samples
 assert.equal(second.length,23);
 assert.ok(first.includes(page("/tr/forum/approved-research/")));
 assert.ok(second.includes(page("/tr/forum/approved-research/")));
 assert.ok(first.includes(page("/tr/tractors/")));
 assert.ok(first.includes(page("/tr/tractors/alpha-model/")));
 assert.ok(second.includes(page("/tr/tractors/beta-model/")));
 const full=selectProductionSeoPages(inventory,{mode:"full"});
 assert.equal(full.length,33);
 assert.equal(new Set(full).size,33);
});

test("reviewed Deutz GS EN/TR URLs must exist in fetched HTML sitemap (not images or forum)",()=>{
 assert.deepEqual(REVIEWED_PAIR_PATHS,[
  "/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/",
  "/tr/compare/deutz-fahr-5090-d-gs-vs-5100-d-gs/",
 ]);
 const f=fixture(), URLs=REVIEWED_PAIR_PATHS.map(page);
 const before=reviewedPairSitemapCoverage(parseProductionSitemapInventory(f));
 assert.equal(before.expected,2);
 assert.equal(before.listed,0);
 assert.deepEqual(before.missing,URLs);
 // An unrelated image child entry must NOT count as a canonical HTML page.
 const imageOnly=fixture();
 imageOnly.children[imageOnly.childUrls[2]]=urlset([page("/")]);
 assert.deepEqual(reviewedPairSitemapCoverage(parseProductionSitemapInventory(imageOnly)).missing,URLs);
 // The HTML child contains both actual published URLs: no false alarm.
 f.children[f.childUrls[0]]=urlset([...f.html,...URLs]);
 const live=reviewedPairSitemapCoverage(parseProductionSitemapInventory(f));
 assert.equal(live.listed,2);
 assert.deepEqual(live.missing,[]);
 assert.equal(live.source,"fetched_master_index_and_html_children");
 // Even one missing language-specific article must remain a hard audit error.
 f.children[f.childUrls[0]]=urlset([...f.html,URLs[0]]);
 const oneMissing=reviewedPairSitemapCoverage(parseProductionSitemapInventory(f));
 assert.equal(oneMissing.listed,1);
 assert.deepEqual(oneMissing.missing,[URLs[1]]);
 // No unreviewed language path is in the exact published set.
 assert.ok(!REVIEWED_PAIR_PATHS.some(x=>/^\/(?:de|fr|zh|es|ja|ru|hi|pt-br)\//.test(x)));
 assert.throws(()=>reviewedPairSitemapCoverage(null),/Missing parsed HTML sitemap inventory/);
});


test("explicit full audit cannot silently degrade to a daily sample",()=>{
 assert.equal(resolveProductionSeoMode(undefined),"daily");
 assert.equal(resolveProductionSeoMode("daily"),"daily");
 assert.equal(resolveProductionSeoMode("full"),"full");
 for(const mode of ["","FULL","weekly",null])assert.throws(()=>resolveProductionSeoMode(mode),/Invalid SEO audit mode/);
});
test("full and daily coverage require actual exact page inspection, not just a green run",()=>{
 const inventory=parseProductionSitemapInventory(fixture());
 const full=selectProductionSeoPages(inventory,{mode:"full"});
 const daily=selectProductionSeoPages(inventory,{mode:"daily",day:0,samplePerLocale:1});
 assert.deepEqual(verifyProductionSeoCoverage(inventory,full,full,"full"),{plannedPages:33,checkedPages:33,totalIndexablePages:33,fullCoverage:true});
 assert.equal(verifyProductionSeoCoverage(inventory,daily,daily,"daily").fullCoverage,false);
 assert.throws(()=>verifyProductionSeoCoverage(inventory,daily,daily,"full"),/Full SEO plan/);
 assert.throws(()=>verifyProductionSeoCoverage(inventory,full,full.slice(1),"full"),/Incomplete/);
 assert.throws(()=>verifyProductionSeoCoverage(inventory,full,[...full.slice(1),full[1]],"full"),/duplicate/);
 assert.throws(()=>verifyProductionSeoCoverage(inventory,daily,[...daily.slice(1),page("/not-inspected/")],"daily"),/Incomplete/);
});
