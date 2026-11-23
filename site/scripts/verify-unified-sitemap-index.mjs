/**
 * Fail-closed master sitemap gate: one submitted sitemap-index.xml must expose
 * every published sitemap document, including moderated forum and images.
 * Runs on built artifacts, so configuration-only checks cannot give false green.
 * No network and no production/database writes.
 */
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";

function insist(condition,message){if(!condition)throw Error("[TractorVS MASTER SITEMAP BLOCKED] "+message)}
const originDefault="https://tractorvs.com";
export function verifyUnifiedSitemapIndex({dist=resolve(fileURLToPath(new URL("../dist",import.meta.url))),origin=originDefault}={}){
 insist(/^https:\/\/[^/]+$/.test(origin),"Invalid absolute production site origin");
 const get=(filename)=>{
  insist(/^(?:sitemap-index|sitemap-[0-9]+|image-sitemap|forum-sitemap|robots)\.(?:xml|txt)$/.test(filename),"Unexpected sitemap file");
  const path=join(dist,filename);
  insist(existsSync(path),"Missing generated file "+filename);
  return readFileSync(path,"utf8");
 };
 const index=get("sitemap-index.xml");
 insist(/<sitemapindex(?:\s|>)/.test(index),"Missing sitemapindex XML root");
 const actual=[...index.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
 insist(actual.length>=3,"Master sitemap index has fewer than three children");
 insist(new Set(actual).size===actual.length,"Duplicate sitemap index children");
 const normalChildren=readdirSync(dist)
  .filter(filename=>/^sitemap-[0-9]+\.xml$/.test(filename)).sort();
 insist(normalChildren.length>0,"No Astro-generated HTML child sitemap files");
 const expected=[...normalChildren.map(x=>origin+"/"+x),origin+"/forum-sitemap.xml",origin+"/image-sitemap.xml"];
 insist(actual.length===expected.length,"Master sitemap child count differs from generated document count");
 for(const url of expected) insist(actual.includes(url),"Master index missing "+url);
 for(const url of actual)insist(expected.includes(url),"Master index points to unexpected "+url);
 const robots=get("robots.txt");
 for(const path of ["sitemap-index.xml","forum-sitemap.xml","image-sitemap.xml"])
  insist(robots.includes("Sitemap: "+origin+"/"+path),"robots.txt missing "+path);
 let totalHTML=0;
 const htmlURLs=new Set();
 for(const filename of normalChildren){
  const xml=get(filename);
  insist(/<urlset(?:\s|>)/.test(xml),"Invalid HTML urlset "+filename);
  const pages=[...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
  insist(pages.length>0,"Empty HTML child "+filename);
  totalHTML+=pages.length;
  for(const u of pages) {
    insist(u.startsWith(origin+"/"),"Offsite canonical page "+u);
    insist(!htmlURLs.has(u),"Duplicate HTML page "+u);
    htmlURLs.add(u);
  }
 }
 // Home and editorial landing pages are discovery entrypoints, not optional
 // catalogue accessories. Fail production if even one published language is
 // silently omitted from the single master sitemap (especially TR/FR articles).
 for(const lang of ["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"]){
  for(const [suffix,type] of [["","home"],["articles/","editorial hub"],["tractors/","catalog"]]){
   insist(htmlURLs.has(origin+"/"+lang+suffix),
    "Missing indexed "+type+" locale "+(lang||"en"));
  }
 }
 const image=get("image-sitemap.xml");
 const forum=get("forum-sitemap.xml");
 for(const [type,xml] of [["image",image],["forum",forum]]){
  insist(/<urlset(?:\s|>)/.test(xml),"Missing/invalid "+type+" XML child");
 }
 const pageUrls=(xml)=>[...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)]
  .map(m=>m[1].replaceAll("&amp;","&"));
 // Forum is intentionally excluded from the generic HTML sitemap. The forum
 // XML must contain only actually built, indexable and canonical forum pages.
 const forumURLs=pageUrls(forum);
 const approvedForum=new Set();
 for(const u of forumURLs){
  let parsed;
  try{parsed=new URL(u)}catch{insist(false,"Invalid moderated forum URL "+u)}
  insist(parsed.origin===origin && !parsed.search && !parsed.hash &&
    /^\/(?:(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?forum\/(?:[a-z0-9-]+\/)?$/.test(parsed.pathname),
    "Noncanonical/offsite URL in moderated forum sitemap: "+u);
  insist(!approvedForum.has(u),"Duplicate approved forum page: "+u);
  approvedForum.add(u);
  const file=join(dist,parsed.pathname.slice(1),"index.html");
  insist(existsSync(file),"Moderated forum sitemap page was not built: "+u);
  const html=readFileSync(file,"utf8");
  insist(html.includes('rel="canonical" href="'+u+'"'),
    "Moderated forum sitemap page lacks self-canonical: "+u);
  insist(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),
    "Noindex forum page found in public sitemap: "+u);
 }
 const imageURLs=pageUrls(image);
 const seenImagePages=new Set();
 let approvedForumImages=0;
 for(const u of imageURLs){
  insist(!seenImagePages.has(u),"Duplicate page in image sitemap: "+u);
  seenImagePages.add(u);
  insist(htmlURLs.has(u)||approvedForum.has(u),
    "Image page absent from published HTML and approved forum sitemap: "+u);
  if(!htmlURLs.has(u))approvedForumImages++;
 }
 return {index_children:actual.length,html_children:normalChildren.length,html_pages:totalHTML,
  catalog_locales:10,image_map_present:true,forum_map_present:true,forum_urls:forumURLs.length,
  image_page_references:imageURLs.length,approved_forum_image_pages:approvedForumImages};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const report=verifyUnifiedSitemapIndex({origin:process.env.SITE_URL||originDefault});
  console.log("TRACTORVS_MASTER_SITEMAP "+JSON.stringify(report));
 }catch(error){console.error(String(error));process.exitCode=1}
}
