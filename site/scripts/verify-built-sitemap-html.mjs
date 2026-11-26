/** Full static sitemap release gate: only genuine indexable canonical HTML
 * is submitted. Do not inspect or remove legitimate excluded URLs.
 * Shares the live sitemap inventory and discovery graph implementations. */
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {readIndexingHead} from "./indexing-head.mjs";
import {blockedCanonicalPaths} from "./canonical-robots-coverage.mjs";
import {parseProductionSitemapInventory} from "./production-sitemap-inventory.mjs";
import {scanHeadTags} from "./verify-sitewide-meta-descriptions.mjs";
import {readOpeningTagAttribute as attr,googleIndexingBlockedByMeta} from "./seo-html-attributes.mjs";
import {inspectLocaleAnnotations,PUBLIC_LOCALE_TAGS} from "./verify-published-site-inventory.mjs";
import {extractCanonicalAnchors,summarizeCanonicalGraph} from "./production-internal-link-graph.mjs";
const ORIGIN="https://tractorvs.com";
const fail=msg=>{throw Error("[TractorVS SITEMAP HTML BLOCKED] "+msg)};
export function inspectSitemapHtml(html,url,pages){
 const errors=[];
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
 if(!head)return ["missing-head"];
 const {links,metas}=scanHeadTags(head);
 const a=inspectLocaleAnnotations(links);
 if(a.errors.length)errors.push(...a.errors);
 if(a.canonical.length!==1||a.canonical[0]!==url)errors.push("wrong-or-duplicate-canonical");
 if(googleIndexingBlockedByMeta(metas))errors.push("index-blocked");
 if(metas.some(tag=>(attr(tag,"http-equiv")||"").trim().toLowerCase()==="refresh"))
  errors.push("meta-refresh");
 const pathname=new URL(url).pathname;
 const match=pathname.match(/^\/(tr|zh|hi|pt-br|fr|de|ru|ja|es)(?=\/)/);
 const lang=match?.[1]||"en";
 const base=match?pathname.slice(match[0].length):pathname;
 const htmlTag=html.match(/<html\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/i)?.[0]||"";
 if(attr(htmlTag,"lang")!==PUBLIC_LOCALE_TAGS[lang])errors.push("wrong-html-language");
 for(const [locale,code] of Object.entries(PUBLIC_LOCALE_TAGS)){
  const expected=ORIGIN+(locale==="en"?"":"/"+locale)+base;
  const actual=a.alternates.get(code.toLowerCase());
  if(pages.has(expected)?actual!==expected:actual!==undefined)errors.push("hreflang-"+code);
 }
 const english=ORIGIN+base;
 if(pages.has(english)?a.alternates.get("x-default")!==english:a.alternates.has("x-default"))
  errors.push("wrong-x-default");
 return errors;
}
// Reverse inventory: no silently omitted public directory-format routes.
// Verification HTML files and 404.html are not generated directory routes.
export function inspectUnlistedBuiltPage(html,url,pages){
 if(pages.has(url))return [];
 const h=readIndexingHead(html);
 if(h.noindex)return [];
 if(!h.hasHead||h.canonical.length!==1||!h.canonical[0])return ["unlisted-missing-canonical"];
 if(h.canonical[0]===url)return ["unlisted-indexable-canonical"];
 if(!pages.has(h.canonical[0]))return ["unlisted-invalid-canonical-target"];
 if(h.refresh)return ["unlisted-meta-refresh-review"];
 return [];
}
function verifyReverseInventory(dist,pages){
 let excluded=0;
 function visit(dir,segments=[]){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   const file=join(dir,entry.name);
   if(entry.isDirectory())visit(file,[...segments,entry.name]);
   else if(entry.isFile()&&entry.name==="index.html"){
    if(segments.some(s=>! /^[A-Za-z0-9._~-]+$/.test(s)||s==="."||s===".."))
     fail("unsupported generated route");
    const url=ORIGIN+"/"+(segments.length?segments.join("/")+"/":"");
    if(pages.has(url))continue;
    const errors=inspectUnlistedBuiltPage(readFileSync(file,"utf8"),url,pages);
    if(errors.length)fail(url+" "+errors.join(", "));
    excluded++;
   }
  }
 }
 visit(dist);
 return excluded;
}
export function verifyBuiltSitemapHtml(dist){
 const indexXml=readFileSync(join(dist,"sitemap-index.xml"),"utf8");
 const children=new Map(readdirSync(dist).filter(n=>/^(?:sitemap-\d+|forum-sitemap|image-sitemap)\.xml$/.test(n))
  .map(n=>[ORIGIN+"/"+n,readFileSync(join(dist,n),"utf8")]));
 const inventory=parseProductionSitemapInventory({indexXml,children});
 const blocked=blockedCanonicalPaths(readFileSync(join(dist,"robots.txt"),"utf8"),[...inventory.pages].map(url=>new URL(url).pathname));
 if(blocked.length)fail("Googlebot-blocked sitemap paths: "+blocked.slice(0,10).join(", "));
 const excluded=verifyReverseInventory(dist,inventory.pages);
 const observed=new Map();
 for(const url of inventory.pages){
  const path=new URL(url).pathname;
  // All generated HTML routes use trailing slash and URL-safe slugs.
  // Refuse encoded separators and traversal before mapping to a local file.
  if(!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(path)||path.split("/").some(x=>x==="."||x===".."))
   fail("unsupported sitemap path: "+url);
  let html;
  try{html=readFileSync(join(dist,path.slice(1),"index.html"),"utf8")}
  catch{fail("sitemap destination has no generated HTML: "+url)}
  const errors=inspectSitemapHtml(html,url,inventory.pages);
  if(errors.length)fail(url+" "+errors.join(", "));
  observed.set(url,extractCanonicalAnchors(html,url,inventory.pages));
 }
 const roots=Object.keys(PUBLIC_LOCALE_TAGS).map(l=>ORIGIN+(l==="en"?"/":"/"+l+"/"));
 const graph=summarizeCanonicalGraph(inventory.pages,observed,{fullCoverage:true,roots});
 if(!graph.complete||graph.noIncomingCount!==0||graph.unreachableCount!==0)
  fail("canonical discovery graph incomplete or disconnected: "+JSON.stringify({complete:graph.complete,noIncoming:graph.noIncoming?.slice(0,10),unreachable:graph.unreachable?.slice(0,10)}));
 return {pages:inventory.pages.size,modelPages:inventory.modelCount,edges:graph.verifiedEdges,reachable:graph.reachableObserved,excludedDirectoryPages:excluded};
}
