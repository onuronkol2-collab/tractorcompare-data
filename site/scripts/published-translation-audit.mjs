// Read-only translation regression probe over all 10 published model URLs.
// It deliberately reports technical headings, NOT source evidence or raw specs.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
const DIST=process.env.TRANSLATION_DIST_ROOT?.trim() ? resolve(process.env.TRANSLATION_DIST_ROOT) : null;
const BASE="https://tractorvs.com";
const locales=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
const unescape=s=>s.replace(/&(?:amp|quot|lt|gt|#(?:x[0-9a-f]+|\d+));/gi,entity=>{
  const code=entity.slice(1,-1);
  if(code==="amp")return "&";if(code==="quot")return '"';
  if(code==="lt")return "<";if(code==="gt")return ">";
  if(code.startsWith("#x"))return String.fromCodePoint(parseInt(code.slice(2),16));
  if(code.startsWith("#"))return String.fromCodePoint(parseInt(code.slice(1),10));
  return entity;
}).replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
async function get(path){
  if(DIST){
    const url=new URL(path,BASE);
    if(url.origin!==BASE||url.search||url.hash)throw Error("Noncanonical audit resource "+path);
    const rel=url.pathname.endsWith("/")?url.pathname.slice(1)+"index.html":url.pathname.slice(1);
    const filename=resolve(DIST,rel);
    if(!filename.startsWith(DIST+"/")||!existsSync(filename))throw Error("Built page/sitemap missing: "+path);
    return readFileSync(filename,"utf8");
  }
  let last;
  for(let i=0;i<4;i++){
    try{
      const response=await fetch(new URL(path,BASE),{signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw Error("HTTP "+response.status+" "+path);
      return await response.text();
    }catch(e){last=e;if(i<3)await new Promise(r=>setTimeout(r,350*(i+1)));}
  }
  throw last;
}
const locs=xml=>[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
const list=locs(await get("/sitemap-index.xml"));
if(!list.length)throw Error("No sitemap children");
const urls=[];
for(const site of list)urls.push(...locs(await get(site)));
const byLocale=new Map(locales.map(x=>[x,new Map()]));
for(const url of urls){
  const u=new URL(url);const m=u.pathname.match(/^\/(?:(tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/([^/]+)\/$/);
  if(m)byLocale.get(m[1]||"en").set(m[2],url);
}
const labelMap=new Map();
const errors=[];
const normalizeHeading=str=>unescape(str).replace(/[’‘]/g,"'").trim();
const rows=new Map();
for(let i=0;i<locales.length;i++){
  const locale=locales[i];
  const urlsBySlug=byLocale.get(locale);
  for(const [slug,url] of urlsBySlug.entries()){
    const html=await get(url);
    const labels=[...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)].map(m=>normalizeHeading(m[1]));
    rows.set(locale+"|"+slug,labels);
    if(!labels.length)errors.push("No labels "+url);
  }
}
const english=byLocale.get("en");
for(const [slug] of english.entries()){
  const enLabels=rows.get("en|"+slug)||[];
  for(const locale of locales.slice(1)){
    const translated=rows.get(locale+"|"+slug)||[];
    if(translated.length!==enLabels.length){
      errors.push("Label count mismatch "+locale+" "+slug+" en="+enLabels.length+" translated="+translated.length);
      continue;
    }
    for(let i=0;i<enLabels.length;i++){
      const e=enLabels[i],v=translated[i];
      if(!e || !v || !/[a-z]/i.test(e))continue;
      const key=locale+"|"+e;
      const entry=labelMap.get(key)||{locale,english:e,count:0,slugs:[]};
      if(v===e){entry.count++;if(entry.slugs.length<3)entry.slugs.push(slug);}
      labelMap.set(key,entry);
    }
  }
}
const suspects=[...labelMap.values()].filter(x=>x.count>0)
  .sort((a,b)=>b.count-a.count||a.locale.localeCompare(b.locale)||a.english.localeCompare(b.english));
for(const locale of locales.slice(1)){
  const list=suspects.filter(s=>s.locale===locale);
  console.log("LANGUAGE_FALLBACK "+JSON.stringify({locale,headings:list.length,occurrences:list.reduce((s,a)=>s+a.count,0),top:list.slice(0,120)}));
}
const missingHeadingCounts=Object.fromEntries(locales.slice(1).map(l=>[l,suspects.filter(x=>x.locale===l).length]));
const occurrenceCounts=Object.fromEntries(locales.slice(1).map(l=>[l,suspects.filter(x=>x.locale===l).reduce((sum,x)=>sum+x.count,0)]));
const modelCounts=Object.fromEntries(locales.map(l=>[l,byLocale.get(l).size]));
const summary={mode:DIST?"built_preview":"public_live",publishedURLs:urls.length,modelCounts,missingHeadingCounts,occurrenceCounts,fetchErrors:errors};
console.log("LANGUAGE_AUDIT_SUMMARY "+JSON.stringify(summary));
// A reusable public-label quality report, never a claim that crawling/SEO ranking is assured.
if(process.env.TRANSLATION_REPORT_PATH?.trim()){
  const filename=resolve(process.env.TRANSLATION_REPORT_PATH.trim());
  mkdirSync(dirname(filename),{recursive:true});
  writeFileSync(filename,JSON.stringify({summary,remaining:suspects},null,2)+"\n");
}
const minModels=Number(process.env.TRANSLATION_MIN_MODELS||"0");
if(minModels>0&&locales.some(l=>modelCounts[l]<minModels)){
  console.error("TRANSLATION_AUDIT_FAIL_TOO_FEW_MODELS "+JSON.stringify({minModels,modelCounts}));
  process.exitCode=1;
}
if(process.env.TRANSLATION_MAX_TR_OCCURRENCES!==undefined){
  const limit=Number(process.env.TRANSLATION_MAX_TR_OCCURRENCES);
  if(!Number.isInteger(limit)||limit<0)throw Error("Invalid Turkish label threshold");
  if(occurrenceCounts.tr>limit){
    console.error("TRANSLATION_AUDIT_FAIL_TURKISH "+JSON.stringify({expectedMax:limit,actual:occurrenceCounts.tr}));
    process.exitCode=1;
  }
}
// Locale-specific strict gates are enabled only after a complete built-page
// scan has demonstrated zero identical-to-English source headings.
if(process.env.TRANSLATION_ZERO_LOCALES?.trim()){
  const zeroLocales=process.env.TRANSLATION_ZERO_LOCALES.split(",").map(x=>x.trim()).filter(Boolean);
  for(const locale of zeroLocales){
    if(locale==="en"||!locales.includes(locale))throw Error("Invalid zero-fallback locale "+locale);
    if(occurrenceCounts[locale]>0){
      console.error("TRANSLATION_AUDIT_ZERO_LOCALE_REGRESSION "+JSON.stringify({locale,remaining:occurrenceCounts[locale]}));
      process.exitCode=1;
    }
  }
}
if(errors.length)process.exitCode=1;
if(process.env.TRANSLATION_STRICT==="true" && suspects.length>0)process.exitCode=1;
