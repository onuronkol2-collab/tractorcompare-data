// Read-only translation regression probe over all 10 published model URLs.
// It deliberately reports technical headings, NOT source evidence or raw specs.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {scanHeadTags} from "./verify-sitewide-meta-descriptions.mjs";
import {readOpeningTagAttribute as attr} from "./seo-html-attributes.mjs";
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
const indexXml=await get("/sitemap-index.xml");
if(!/<sitemapindex(?:\s|>)/.test(indexXml))throw Error("Invalid sitemap index root");
const list=locs(indexXml);
if(!list.length||list.length>30||new Set(list).size!==list.length)throw Error("Invalid sitemap child count or duplication");
const htmlSitemaps=list.filter(site=>{
  const u=new URL(site);
  if(u.origin!==BASE||u.search||u.hash||!/^\/(?:sitemap-[0-9]+|forum-sitemap|image-sitemap)\.xml$/.test(u.pathname))
    throw Error("Unexpected sitemap child: "+site);
  return /^\/sitemap-[0-9]+\.xml$/.test(u.pathname);
});
if(!htmlSitemaps.length)throw Error("No canonical HTML sitemap");
const urls=[];
const seenUrls=new Set();
for(const site of htmlSitemaps){
  const xml=await get(site);
  if(!/<urlset(?:\s|>)/.test(xml))throw Error("Invalid HTML sitemap root "+site);
  for(const url of locs(xml)){
    const u=new URL(url);
    if(u.origin!==BASE||u.search||u.hash||seenUrls.has(url))throw Error("Noncanonical or duplicate page URL "+url);
    seenUrls.add(url);urls.push(url);
  }
}
const byLocale=new Map(locales.map(x=>[x,new Map()]));
for(const url of urls){
  const u=new URL(url);const m=u.pathname.match(/^\/(?:(tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/([^/]+)\/$/);
  if(m)byLocale.get(m[1]||"en").set(m[2],url);
}
const labelMap=new Map();
const errors=[];
const normalizeHeading=str=>unescape(str).replace(/[’‘]/g,"'").trim();
const rows=new Map();
const identityRows=new Map();
const identitySkippedPages=[];
const requireSpecIdentities=process.env.TRANSLATION_REQUIRE_SPEC_IDENTITIES==="true";
const verifyMetadata=process.env.TRANSLATION_VALIDATE_SEO==="true";
const expectedHtmlLang={en:"en",tr:"tr",zh:"zh-Hans",hi:"hi","pt-br":"pt-BR",fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};

/**
 * Published specification IDs are stable across locale-specific grouping and
 * sorting. A heading's *position* is not: comparing h4 arrays by index can
 * silently miss untranslated English on genuine Turkish/French/Spanish pages.
 * Return null for old live releases / legacy test HTML lacking keyed cards.
 */
function readSpecIdentityLabels(html,expectedLabels){
  const result=new Map();
  let cards=0;
  for(const match of html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)){
    const tag="<article"+match[1]+">";
    const classes=attr(tag,"class")?.split(/\s+/)||[];
    if(!classes.includes("model-spec-card"))continue;
    cards++;
    const id=attr(tag,"data-spec-id");
    const headings=[...match[2].matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)];
    if(!id||result.has(id)||headings.length!==1)return null;
    result.set(id,normalizeHeading(headings[0][1]));
  }
  return cards===expectedLabels&&cards>0?result:null;
}

function inspectSeoHead(html,locale,url){
  const docLang=attr(html.match(/<html\b[^>]*>/i)?.[0]||"","lang");
  if(docLang!==expectedHtmlLang[locale])errors.push("Incorrect HTML language "+url+" "+docLang);
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1]||"";
  const {links,metas}=scanHeadTags(head);
  if(metas.some(tag=>["robots","googlebot","bingbot"].includes((attr(tag,"name")||"").toLowerCase())
     && /\bnoindex\b/i.test(attr(tag,"content")||"")))
    errors.push("Published model unexpectedly noindex "+url);
  const canon=links.filter(x=>attr(x,"rel")==="canonical");
  if(canon.length!==1||attr(canon[0],"href")!==url)errors.push("Wrong self-canonical "+url);
  const alts=links.filter(x=>attr(x,"rel")==="alternate"&&attr(x,"hreflang"));
  const codes=alts.map(x=>attr(x,"hreflang"));
  if(codes.length!==11||new Set(codes).size!==11 ||
     !codes.includes(expectedHtmlLang[locale])||!codes.includes("x-default"))
    errors.push("Missing or duplicated model hreflang "+url);
  const slug=url.match(/\/tractors\/([^/]+)\/$/)?.[1];
  if(slug){
    for(const [lang,tag] of Object.entries(expectedHtmlLang)){
      const expected=BASE+"/"+(lang==="en"?"":lang+"/")+"tractors/"+slug+"/";
      const matching=alts.filter(link=>attr(link,"hreflang")===tag);
      if(matching.length!==1||attr(matching[0],"href")!==expected)
        errors.push("Nonreciprocal model hreflang "+url+" -> "+tag);
    }
    const defaults=alts.filter(link=>attr(link,"hreflang")==="x-default");
    if(defaults.length!==1||attr(defaults[0],"href")!==BASE+"/tractors/"+slug+"/")
      errors.push("Wrong model x-default "+url);
  }
  const pageH1=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if(pageH1.length!==1||!unescape(pageH1[0][1]))errors.push("Missing/duplicate model H1 "+url);
}
const jobs=locales.flatMap(locale=>[...byLocale.get(locale)].map(([slug,url])=>({locale,slug,url})));
const workers=Number(process.env.TRANSLATION_AUDIT_CONCURRENCY||"8");
if(!Number.isInteger(workers)||workers<1||workers>12)throw Error("Invalid bounded concurrency");
let cursor=0;
async function worker(){
  while(cursor<jobs.length){
    const {locale,slug,url}=jobs[cursor++];
    try{
      const html=await get(url);
      const labels=[...html.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)].map(m=>normalizeHeading(m[1]));
      rows.set(locale+"|"+slug,labels);
      const keyed=readSpecIdentityLabels(html,labels.length);
      if(keyed)identityRows.set(locale+"|"+slug,keyed);
      else {
        identitySkippedPages.push(url);
        if(requireSpecIdentities)errors.push("Missing durable model spec identity "+url);
      }
      if(!labels.length)errors.push("No labels "+url);
      if(verifyMetadata)inspectSeoHead(html,locale,url);
    }catch(e){
      const message="Cannot inspect published model "+url+": "+String(e.message||e);
      errors.push(message);
      console.error("LANGUAGE_AUDIT_FETCH_ERROR "+message);
    }
  }
}
await Promise.all(Array.from({length:Math.min(workers,jobs.length)},()=>worker()));
if(!byLocale.get("en").size)errors.push("English model sitemap is empty");
for(const locale of locales.slice(1)){
  const baseSlugs=new Set(byLocale.get("en").keys());
  const targetSlugs=new Set(byLocale.get(locale).keys());
  for(const slug of baseSlugs)if(!targetSlugs.has(slug))errors.push("Missing localized model "+locale+" "+slug);
  for(const slug of targetSlugs)if(!baseSlugs.has(slug))errors.push("Orphan localized model "+locale+" "+slug);
}
const english=byLocale.get("en");
// English pages can inherit source Turkish terms and bypass an English-based
// cross-locale fallback comparison. Report separately, with exact slug evidence.
const sourceLanguageLeakage=new Map();
for(const [slug] of english.entries()){
  for(const label of rows.get("en|"+slug)||[]){
    if(!/[ÇĞİÖŞÜçğıöşü]/u.test(label))continue;
    const item=sourceLanguageLeakage.get(label)||{englishSourceLabel:label,count:0,slugs:[]};
    item.count++;
    if(item.slugs.length<3)item.slugs.push(slug);
    sourceLanguageLeakage.set(label,item);
  }
}
const englishLeakage=[...sourceLanguageLeakage.values()].sort((a,b)=>b.count-a.count||a.englishSourceLabel.localeCompare(b.englishSourceLabel));
console.log("ENGLISH_SOURCE_LANGUAGE_LEAKAGE "+JSON.stringify({
  distinctHeadings:englishLeakage.length,
  occurrences:englishLeakage.reduce((n,x)=>n+x.count,0),
  top:englishLeakage.slice(0,120)
}));
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

/**
 * Exhaustive, order-independent *observation*, not a blanket assertion that
 * every shared label is an error: source trademarks and unit abbreviations
 * can legitimately stay identical. Review exact source IDs before translating.
 */
const identityMap=new Map();
let identityComparedPairs=0;
let identitySkippedPairs=0;
for(const [slug] of english){
  const enSpecs=identityRows.get("en|"+slug);
  for(const locale of locales.slice(1)){
    const localSpecs=identityRows.get(locale+"|"+slug);
    if(!enSpecs||!localSpecs){identitySkippedPairs++;continue;}
    identityComparedPairs++;
    for(const [id,enLabel] of enSpecs){
      if(!localSpecs.has(id)){
        errors.push("Localized model missing published spec identity "+locale+" "+slug+" "+id);
        continue;
      }
      const localizedLabel=localSpecs.get(id);
      if(enLabel!==localizedLabel||!/[a-z]/i.test(enLabel))continue;
      const key=locale+"|"+enLabel;
      const item=identityMap.get(key)||{locale,english:enLabel,count:0,slugs:[]};
      item.count++;
      if(item.slugs.length<3)item.slugs.push(slug);
      identityMap.set(key,item);
    }
    for(const id of localSpecs.keys())
      if(!enSpecs.has(id))
        errors.push("Localized model has unpaired published spec identity "+locale+" "+slug+" "+id);
  }
}
const identityRemaining=[...identityMap.values()]
  .sort((a,b)=>b.count-a.count||a.locale.localeCompare(b.locale)||a.english.localeCompare(b.english));
const identityHeadingCounts=Object.fromEntries(locales.slice(1).map(locale=>[
  locale,identityRemaining.filter(item=>item.locale===locale).length
]));
const identityOccurrenceCounts=Object.fromEntries(locales.slice(1).map(locale=>[
  locale,identityRemaining.filter(item=>item.locale===locale).reduce((n,item)=>n+item.count,0)
]));
const identitySummary={
  comparedPairs:identityComparedPairs,skippedPairs:identitySkippedPairs,
  pagesWithStableIds:identityRows.size,pagesWithoutStableIds:identitySkippedPages.length,
  identicalHeadingCounts:identityHeadingCounts,
  identicalOccurrenceCounts:identityOccurrenceCounts
};
console.log("LANGUAGE_IDENTITY_AUDIT "+JSON.stringify(identitySummary));
for(const locale of locales.slice(1)){
  const candidates=identityRemaining.filter(item=>item.locale===locale);
  // Review inventory, not confirmed translation errors: codes, trademarks and
  // shared words can legitimately remain equal. Surface high-impact candidates
  // in CI logs as well as the full downloadable report.
  console.log("LANGUAGE_IDENTITY_REVIEW "+JSON.stringify({
    locale,headings:candidates.length,occurrences:identityOccurrenceCounts[locale],
    top:candidates.slice(0,40)
  }));
}

const missingHeadingCounts=Object.fromEntries(locales.slice(1).map(l=>[l,suspects.filter(x=>x.locale===l).length]));
const occurrenceCounts=Object.fromEntries(locales.slice(1).map(l=>[l,suspects.filter(x=>x.locale===l).reduce((sum,x)=>sum+x.count,0)]));
const modelCounts=Object.fromEntries(locales.map(l=>[l,byLocale.get(l).size]));
const summary={mode:DIST?"built_preview":"public_live",publishedURLs:urls.length,modelCounts,missingHeadingCounts,occurrenceCounts,identity:identitySummary,englishSourceHeadings:englishLeakage.length,englishSourceOccurrences:englishLeakage.reduce((n,x)=>n+x.count,0),seoMetadataChecked:verifyMetadata,fetchErrors:errors};
console.log("LANGUAGE_AUDIT_SUMMARY "+JSON.stringify(summary));
// A reusable public-label quality report, never a claim that crawling/SEO ranking is assured.
if(process.env.TRANSLATION_REPORT_PATH?.trim()){
  const filename=resolve(process.env.TRANSLATION_REPORT_PATH.trim());
  mkdirSync(dirname(filename),{recursive:true});
  writeFileSync(filename,JSON.stringify({summary,remaining:suspects,identityRemaining,identitySkippedPages:identitySkippedPages.slice(0,30),englishSourceLanguageLeakage:englishLeakage},null,2)+"\n");
}
const minModels=Number(process.env.TRANSLATION_MIN_MODELS||"0");
if(minModels>0&&locales.some(l=>modelCounts[l]<minModels)){
  console.error("TRANSLATION_AUDIT_FAIL_TOO_FEW_MODELS "+JSON.stringify({minModels,modelCounts}));
  process.exitCode=1;
}
if(process.env.TRANSLATION_MAX_EN_SOURCE_OCCURRENCES!==undefined){
  const limit=Number(process.env.TRANSLATION_MAX_EN_SOURCE_OCCURRENCES);
  if(!Number.isInteger(limit)||limit<0)throw Error("Invalid English source leakage threshold");
  if(summary.englishSourceOccurrences>limit){
    console.error("TRANSLATION_AUDIT_ENGLISH_SOURCE_LEAKAGE "+JSON.stringify({
      expectedMax:limit,actual:summary.englishSourceOccurrences
    }));
    process.exitCode=1;
  }
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
if(process.env.TRANSLATION_STRICT==="true" && (suspects.length>0 || englishLeakage.length>0))process.exitCode=1;
