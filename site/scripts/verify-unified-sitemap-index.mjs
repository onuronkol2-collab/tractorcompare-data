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
 for(const lang of ["","tr/","zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"]){
  insist(htmlURLs.has(origin+"/"+lang+"tractors/"),"Missing indexed catalog locale "+(lang||"en"));
 }
 const image=get("image-sitemap.xml");
 const forum=get("forum-sitemap.xml");
 for(const [type,xml] of [["image",image],["forum",forum]]){
  insist(/<urlset(?:\s|>)/.test(xml),"Missing/invalid "+type+" XML child");
 }
 // Forum is intentionally excluded from generic public pages: only the
 // independent verified sitemap may list approved public topics.
 const forumURLs=[...forum.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 for(const u of forumURLs)insist(/^https:\/\/[^<]+\/forum\//.test(u),"Non-forum URL in moderated forum sitemap");
 return {index_children:actual.length,html_children:normalChildren.length,html_pages:totalHTML,
  catalog_locales:10,image_map_present:true,forum_map_present:true,forum_urls:forumURLs.length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const report=verifyUnifiedSitemapIndex({origin:process.env.SITE_URL||originDefault});
  console.log("TRACTORVS_MASTER_SITEMAP "+JSON.stringify(report));
 }catch(error){console.error(String(error));process.exitCode=1}
}
