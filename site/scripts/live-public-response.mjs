// Read-only public response checks. No arbitrary remote target or redirect.
import {readOpeningTagAttribute} from "./seo-html-attributes.mjs";
export const PRODUCTION_ORIGIN="https://tractorvs.com";
export const PUBLIC_LOCALES=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const localePrefix=lang=>lang==="en"?"":"/"+lang;
export const CATALOG_PATHS=PUBLIC_LOCALES.map(lang=>localePrefix(lang)+"/tractors/");
export const HOME_PATHS=PUBLIC_LOCALES.map(lang=>localePrefix(lang)+"/");
const attr=(tag,key)=>readOpeningTagAttribute(tag,key);
export function inspectPublicPage({path,status,finalPath,contentType,body,headerRobots,production=true}){
 const errors=[];
 if(status!==200)errors.push("http-status:"+status);
 if(finalPath!==path)errors.push("unexpected-final-path");
 if(typeof body!=="string"||!body.length)errors.push("empty-body");
 if(typeof body==="string"&&body.length>4_000_000)errors.push("body-exceeds-audit-limit");
 const html=typeof body==="string"?body:"";
 if(path==="/robots.txt"){
  if(!/^text\/plain(?:;|$)/i.test(contentType||""))errors.push("robots-mime");
  if(production&&!html.includes("Sitemap: "+PRODUCTION_ORIGIN+"/sitemap-index.xml"))errors.push("missing-robots-sitemap");
  if(production&&/^Disallow:\s*\/\s*$/im.test(html))errors.push("robots-block-all");
 }else if(path==="/sitemap-index.xml"){
  if(!/^(?:application|text)\/xml(?:;|$)/i.test(contentType||""))errors.push("sitemap-mime");
  if(!/<sitemapindex(?:\s|>)/.test(html))errors.push("invalid-sitemap-root");
 }else{
  if(!/^text\/html(?:;|$)/i.test(contentType||""))errors.push("html-mime");
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]);
  const canon=links.filter(tag=>(attr(tag,"rel")||"").toLowerCase()==="canonical").map(tag=>attr(tag,"href"));
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  if(production){
   if(canon.length!==1||canon[0]!==PRODUCTION_ORIGIN+path)errors.push("canonical-mismatch");
   if(/\bnoindex\b/i.test(headerRobots||"")||metas.some(t=>(attr(t,"name")||"").toLowerCase()==="robots"&&/\bnoindex\b/i.test(attr(t,"content")||"")))errors.push("noindex");
  }
  if(!/<h1(?:\s|>)/i.test(html))errors.push("missing-h1");
  if(!/<main(?:\s|>)/i.test(html))errors.push("missing-main");
 }
 return errors;
}
export function modelSlugs(body,path){
 if(!CATALOG_PATHS.includes(path))return [];
 const slugs=new Set();
 for(const match of body.matchAll(/<a\b[^>]*>/gi)){
  const href=attr(match[0],"href");
  if(typeof href!=="string"||!href.startsWith(path))continue;
  const slug=href.slice(path.length);
  if(/^[a-z0-9-]+-[a-f0-9]{8}\/$/.test(slug))slugs.add(slug);
 }
 return [...slugs].sort();
}
export function inspectCatalogParity(byPath){
 const en=byPath.get("/tractors/")||[];
 return CATALOG_PATHS.flatMap(path=>{
  const actual=byPath.get(path)||[];
  return !en.length||actual.length!==en.length||actual.some((x,i)=>x!==en[i])?[{path,expected:en.length,actual:actual.length}]:[];
 });
}
