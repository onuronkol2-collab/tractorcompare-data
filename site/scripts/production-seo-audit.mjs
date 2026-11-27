import {localStylesheets,stylesheetProblem} from "./live-stylesheets.mjs";
import {comparisonSampleId,comparisonDataProblems} from "./comparison-data-indexing.mjs";
import {readIndexingHead} from "./indexing-head.mjs";
import {blockedCanonicalPaths} from "./canonical-robots-coverage.mjs";
import {scanHeadTags,inspectMetaDescription,descriptionReuseGroups} from "./verify-sitewide-meta-descriptions.mjs";
import {inspectSocialMetadata} from "./verify-sitewide-social-metadata.mjs";
import {inspectVisibleMainImages} from "./seo-main-markup.mjs";
import {inspectDocumentImageAlts,inspectUndocumentedEmptyImageAlts} from "./verify-sitewide-image-alts.mjs";
import {hasBibliographicTitleLeak,inspectSeoTitle,crossLocaleModelTitleGroups} from "./verify-sitewide-seo-titles.mjs";
import {writeFileSync} from "node:fs";
import {extractCanonicalAnchors,summarizeCanonicalGraph} from "./production-internal-link-graph.mjs";
import {readOpeningTagAttribute,googleIndexingBlockedByMeta,indexBlockingResponseHeader} from "./seo-html-attributes.mjs";
import {inspectLocaleAnnotations} from "./verify-published-site-inventory.mjs";
import {parseProductionSitemapInventory,selectProductionSeoPages,reviewedPairSitemapCoverage,farmToolSitemapCoverage,resolveProductionSeoMode,verifyProductionSeoCoverage} from "./production-sitemap-inventory.mjs";
// Read-only production SEO coverage audit. No credentials or writes.
const BASE = "https://tractorvs.com";
const languages = {en:"en",tr:"tr",zh:"zh-Hans",hi:"hi","pt-br":"pt-BR",fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};
const problems=[], warnings=[];
const AUDIT_MODE=resolveProductionSeoMode(process.env.TRACTORVS_SEO_AUDIT_MODE);
const error=(code,page,why)=>{problems.push({code,page,why});console.error("SEO_ERROR "+JSON.stringify({code,page,why}));};
const warn=(code,page,why,details={})=>{warnings.push({code,page,why,...details});};
const matches=(txt,re)=>[...txt.matchAll(re)].map(m=>m[1]);
async function fetchPage(url) {
  const u=new URL(url,BASE);
  if(u.origin!==BASE)throw Error("Refused external URL "+u.href);
  let lastFailure;
  for(let n=0;n<4;n++){
    try{
      const response=await fetch(u,{redirect:"manual",signal:AbortSignal.timeout(25000)});
      if([429,502,503,504].includes(response.status) && n<3) {
        lastFailure=new Error("Transient HTTP "+response.status);
      } else {
        const body=await response.text();
        return {body,response};
      }
    }catch(e){
      lastFailure=e;
    }
    if(n<3)await new Promise(resolve=>setTimeout(resolve,300*(n+1)));
  }
  throw lastFailure || Error("Unexpected HTTP retry failure");
}
const xmlLocs=s=>matches(s,/<loc>([^<]+)<\/loc>/g).map(x=>x.replaceAll("&amp;","&"));
const attr=(html,name)=>readOpeningTagAttribute(html,name);
function metadata(html,file){
 const head=/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1] || "";
 const {links,metas}=scanHeadTags(head);
 const annotations=inspectLocaleAnnotations(links);
 const m=(name)=>attr(metas.find(tag=>(attr(tag,"name")||"").toLowerCase()===name)||"","content");
 const title=inspectSeoTitle(html,file);
 const description=inspectMetaDescription(html,file);
 return {
  links,
  title:title?.title||"",titleErrors:title?.errors||["missing-document-title"],
  description:description?.description||"",descriptionErrors:description?.errors||[], robots:m("robots")||"",
  noindex:googleIndexingBlockedByMeta(metas),
  canonical:annotations.canonical,
  alternates:annotations.alternates,
  annotationErrors:annotations.errors,
  lang:html.match(/<html[^>]*lang=['"]([^'"]+)['"]/i)?.[1]||"",
  h1:/<h1\b/i.test(html),
  json:matches(html,/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi),
 };
}
const robots=await fetchPage("/robots.txt");
if(robots.response.status!==200 || !/^text\/plain(?:;|$)/i.test(robots.response.headers.get("content-type")||""))
  error("robots-blocked","/robots.txt","Robots blocks or fails");
if(!robots.body.includes("Sitemap: "+BASE+"/sitemap-index.xml"))
  error("robots-sitemap","/robots.txt","Missing production sitemap");
const idx=await fetchPage("/sitemap-index.xml");
if(idx.response.status!==200)error("sitemap-index","/sitemap-index.xml","HTTP "+idx.response.status);
const siteMaps=xmlLocs(idx.body);
if(!siteMaps.length)error("sitemap-empty","/sitemap-index.xml","No sitemap loc entries");
const childXml=new Map();
for(const loc of siteMaps){
 try{
  const r=await fetchPage(loc);
  if(r.response.status!==200){error("sitemap-child",loc,"HTTP "+r.response.status);continue;}
  childXml.set(loc,r.body);
 }catch(e){error("sitemap-fetch",loc,String(e));}
}
// A sitemap index enumerates FILES. The main HTML and approved forum URLsets
// enumerate pages. The image URLset references pages already listed there.
// Treating 640 image references as 640 duplicate pages was a false alarm.
let inventory;
try{inventory=parseProductionSitemapInventory({indexXml:idx.body,children:childXml});}
catch(e){
 error("sitemap-inventory","/sitemap-index.xml",String(e?.message||e));
 process.exit(1); // Never make 3,882 page requests after a broken public inventory.
}
const unique=inventory.pages;
try {
 const blocked=blockedCanonicalPaths(robots.body,[...unique].map(url=>new URL(url).pathname));
 for(const path of blocked)error("robots-path-blocked",path,"Googlebot rule disallows a canonical sitemap page");
}catch(e){error("robots-unverifiable","/robots.txt",String(e?.message||e));}
// A source-reviewed published article must not disappear from the ONE live
// HTML sitemap while its public URL still responds. Only actual fetched XML
// membership counts; audit-tool "inSitemap" heuristics are not evidence.
const farmTools=farmToolSitemapCoverage(inventory);
console.log("TRACTORVS_FARM_TOOL_SITEMAP_LIVE "+JSON.stringify(farmTools));
for(const url of farmTools.missing)
 error("farm-tool-sitemap-missing",url,"Published localized tool absent from fetched HTML sitemap; inspect deployment and sitemap membership");
const publishedPair=reviewedPairSitemapCoverage(inventory);
console.log("TRACTORVS_REVIEWED_PAIR_SITEMAP_LIVE "+JSON.stringify(publishedPair));
for(const url of publishedPair.missing)
 error("reviewed-pair-sitemap-missing",url,
  "Already-published curated comparison absent from LIVE HTML child sitemap; inspect Cloudflare deploy/caching and canonical routes");
console.log("TRACTORVS_SEO_INVENTORY "+JSON.stringify({
 sitemap_files:inventory.indexChildren,html_pages:inventory.htmlPages.size,
 approved_forum_pages:inventory.forumPages.size,image_page_references:inventory.imagePages.size,
 image_references_already_in_html:inventory.imagePagesAlreadyInHtml,
 approved_forum_image_pages:inventory.imagePagesInForumOnly,
 distinct_indexable_pages:unique.size,exact_model_count_per_locale:inventory.modelsPerLocale,
}));
const editorialPaths=[
  "/articles/","/tr/articles/",
  ...Object.keys(languages).filter(lang=>lang!=="en"&&lang!=="tr")
    .map(lang=>"/"+lang+"/articles/"),
  "/methodology/","/tr/methodology/",
  // Other four published long-form articles are genuinely bilingual, not ten-language copies.
  ...["tractor-technical-terms","pto-and-power-take-off",
    "tractor-hydraulic-lift-explained","tractor-engine-power-and-torque"]
    .flatMap(slug=>["/guides/"+slug+"/","/tr/guides/"+slug+"/"]),
  ...Object.keys(languages).map(lang=>
    (lang==="en"?"/":"/"+lang+"/")+"guides/choosing-a-tractor/"),
  ...Object.keys(languages).map(lang=>
    (lang==="en"?"/":"/"+lang+"/")+"reviews/basak-2075-bk/")
];
const absentEditorial=editorialPaths.filter(path=>!unique.has(BASE+path));
for(const path of absentEditorial)
  warn("editorial-sitemap-lag",path,
    "Publicly authored editorial page not yet found in fetched production sitemap; verify deployment and CDN cache");
console.log("TRACTORVS_EDITORIAL_SITEMAP "+
  JSON.stringify({expected:editorialPaths.length,listed:editorialPaths.length-absentEditorial.length,absent:absentEditorial}));
// Duplicates within an HTML/forum/image child are rejected by the typed inventory helper.
const modelByLocale=Object.fromEntries(Object.keys(languages).map(k=>[k,new Set()]));
let valid=0, modelPages=0, modelSample=[], fetchFailures=0;
const inspectedPages=[];
const observedAnchors=new Map();
const titlesByLocale=new Map();
const modelTitleRecords=[];
const descriptionRecords=[];
const descriptionLengths={over160:0,byLocale:Object.fromEntries(Object.keys(languages).map(l=>[l,0]))};
const stylesheetRefs=new Map();
const comparisonSamples=new Map();
// The 60-character threshold is crawler guidance, not a Google requirement.
// Track it across checked locales as an advisory, without deleting exact
// model/variant/market/year disambiguators or blocking correct long titles.
const titleLengths={over60:0,over105:0,byLocale:Object.fromEntries(
 Object.keys(languages).map(locale=>[locale,{over60:0,over105:0}]))};
// All 3,882 URLs are verified in the source sitemap daily. To keep the
// daily audit within GitHub time/network budgets, HTTP/canonical/hreflang
// checks cover EVERY non-model page plus a rotating, equal-sized sample
// of models in each language. The Sunday run uses mode=full.
const urls=selectProductionSeoPages(inventory,{
 mode:AUDIT_MODE,day:Math.floor(Date.now()/86_400_000),samplePerLocale:20
});
console.log("TRACTORVS_SEO_CRAWL_SCOPE "+JSON.stringify({
 mode:AUDIT_MODE,crawl_pages:urls.length,total_indexable_pages:unique.size,
 every_nonmodel_page_checked:true,model_sample_per_locale:AUDIT_MODE==="daily"?20:"all"
}));
for(let i=0;i<urls.length;i+=8){
 await Promise.all(urls.slice(i,i+8).map(async page=>{
  try{
   const u=new URL(page),p=u.pathname;
   if(u.origin!==BASE || u.search || p.includes("/language/") || p.includes("/404")){
    error("sitemap-invalid",page,"Noncanonical sitemap URL");return;
   }
   const {body,response}=await fetchPage(page);
   if(response.status!==200){error("page-http",p,"HTTP "+response.status);return;}
   if(indexBlockingResponseHeader(response.headers.get("x-robots-tag")))
    error("blocked-header",p,"Restrictive X-Robots-Tag on production; review directive scope");
   if(!/^text\/html(?:;|$)/i.test(response.headers.get("content-type")||"")){
    error("page-mime",p,"Canonical sitemap target did not return HTML");return;
   }
   if(readIndexingHead(body).refresh)error("meta-refresh",p,"Canonical sitemap target is a client-side redirect");
   const file=p.slice(1)+"index.html";
   const hub=/^\/(?:(tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?compare\/$/.exec(p);
   if(hub){const id=comparisonSampleId(body);if(id)comparisonSamples.set(hub[1]||"en",id);else error("comparison-sample",p,"No published comparison model ID in SSR");}
   const meta=metadata(body,file);
   for(const asset of localStylesheets(meta.links,page)){
     const entry=stylesheetRefs.get(asset) ?? {example:p,pages:0};
     entry.pages++;
     stylesheetRefs.set(asset,entry);
   }
   const social=inspectSocialMetadata(body,p);
   for(const reason of social?.errors ?? [])error("social-metadata",p,reason);
   if(meta.noindex)error("blocked-meta",p,"Robots or Googlebot meta blocks indexing (noindex or none)");
   for(const reason of meta.titleErrors)error("title-integrity",p,reason);
   for(const reason of meta.descriptionErrors)error("description-integrity",p,reason);
   if(meta.canonical.length!==1 || meta.canonical[0]!==page)
    error("canonical",p,JSON.stringify(meta.canonical));
   const locale=p.match(/^\/(tr|zh|hi|pt-br|fr|de|ru|ja|es)\//)?.[1]||"en";
   if(meta.description&&!meta.descriptionErrors.length){
     descriptionRecords.push({file,description:meta.description});
     if(meta.description.length>160){
       descriptionLengths.over160++;descriptionLengths.byLocale[locale]++;
       warn("description-length-guidance",p,"Description exceeds editorial length guidance; preserve verified identity and evidence",{length:meta.description.length});
     }
   }
   // CJK descriptions convey useful content with fewer characters. These
   // checks are quality signals, not artificial Google length requirements.
   if(meta.title.length < (locale==="zh"||locale==="ja" ? 6 : 10) ||
      meta.description.length < (locale==="zh"||locale==="ja" ? 12 : 30))
    error("title-description",p,"Missing or clearly empty title/description");
   if(!meta.h1)error("heading",p,"H1 not found");
   if(meta.title.length>60){
     titleLengths.over60++;
     titleLengths.byLocale[locale].over60++;
     if(meta.title.length>105){
       titleLengths.over105++;
       titleLengths.byLocale[locale].over105++;
     }
     warn("title-length-guidance",p,"Title has "+meta.title.length+
       " characters; review optional boilerplate but retain identity",{title:meta.title,length:meta.title.length});
   }
   // Full-sitemap accessibility/SEO integrity is handled by a tested
   // pure helper; an absent alt differs from a valid decorative alt="".
   const imageCheck=inspectVisibleMainImages(body);
   if(!imageCheck.foundMain)error("missing-main",p,"Main content landmark missing");
   // Check document-wide image alt on every crawled live page, including
   // header/footer, forum members and lightbox markup outside <main>.
   // alt="" is valid for decorative imagery; only absent alt is an error.
   const documentImages=inspectDocumentImageAlts(body);
   for(const i of documentImages.missingAlt)
     error("image-alt",p,"Image #"+i.index+" ("+i.src+") lacks alt attribute");
   for(const i of inspectUndocumentedEmptyImageAlts(body))
     error("image-alt-empty-context",p,
       "Blank alt on image #"+i.index+" ("+i.src+") without decorative reason");
   // JSON-LD errors are SEO issues on any page type, not only models.
   for(const [i,raw] of meta.json.entries())try{
     JSON.parse(raw);
   }catch(e){error("jsonld-parse",p,"Script "+(i+1)+": "+String(e));}
   if(meta.lang!==languages[locale])error("html-language",p,"HTML lang "+meta.lang+" expected "+languages[locale]);
   const base=p.replace(/^\/(tr|zh|hi|pt-br|fr|de|ru|ja|es)(?=\/)/,"");
   for(const reason of meta.annotationErrors)error("hreflang-annotation",p,reason);
   const alternateMap=meta.alternates;
   // Methodology has only EN/TR translations; guides now have all ten.
   // Expect reciprocal alternate tags ONLY when a matching indexable URL
   // really exists in this fetched production sitemap inventory.
   for(const [l,code] of Object.entries(languages)){
    const expected=BASE+(l==="en"?base:"/"+l+base);
    const actual=alternateMap.get(code.toLowerCase());
    if(unique.has(expected) && actual!==expected)
      error("hreflang",p,code+" expected "+expected);
    if(!unique.has(expected) && actual)
      error("hreflang-nonexistent",p,code+" points at an unlisted locale page "+actual);
   }
   const defaultExpected=BASE+base;
   if(unique.has(defaultExpected) && alternateMap.get("x-default")!==defaultExpected)
     error("x-default",p,"Invalid default language");
   if(!unique.has(defaultExpected)&&alternateMap.has("x-default"))
     error("x-default",p,"Default language points to an unlisted page");
   const isModel=/\/tractors\/[^/]+\/$/.test(p);
   if(isModel){
    const slug=p.split("/").filter(Boolean).at(-1);
    modelByLocale[locale].add(slug);modelPages++;
    modelTitleRecords.push({file:p.slice(1)+"index.html",title:meta.title});
    const titleKey=locale+"::"+meta.title;
    const previous=titlesByLocale.get(titleKey);
    if(previous && previous!==p)error("duplicate-model-title",p,"Same title as "+previous);
    titlesByLocale.set(titleKey,p);
    // Length guidance is reported for every page type, not only models.
    if(hasBibliographicTitleLeak(meta.title))
      warn("model-title-source-note",p,"Bibliographic source wording inside model title; verify exact variant before any edit");
    const graphs=[];
    for(const raw of meta.json)try{
      const value=JSON.parse(raw);graphs.push(...(value["@graph"]||[value]));
    }catch(e){error("jsonld-parse",p,String(e));}
    for(const type of ["WebPage","BreadcrumbList"])
     if(!graphs.some(g=>g["@type"]===type))error("jsonld-"+type,p,"Missing "+type);
    // A noncommercial specifications catalogue must not regain Google Product
    // rich-result errors by reintroducing Product-derived Vehicle markup.
    const subject=graphs.find(g=>g["@type"]==="Thing");
    if(!subject)error("jsonld-main-entity",p,"Missing noncommercial Thing tractor identity");
    if(subject?.url!==page)error("tractor-entity-url",p,"Incorrect model JSON-LD URL");
    const webPage=graphs.find(g=>g["@type"]==="WebPage");
    if(subject && webPage?.mainEntity?.["@id"]!==subject["@id"])
      error("tractor-main-entity",p,"WebPage mainEntity does not point at tractor");
    const productTypes=new Set(["Product","Vehicle","Car","IndividualProduct","ProductModel","ProductGroup"]);
    if(graphs.some(g=>productTypes.has(g["@type"])))
      error("product-schema",p,"Noncommercial catalogue must not claim Google Product eligibility");
    if(subject && ["offers","review","aggregateRating","additionalProperty","manufacturer"].some(k=>k in subject))
      error("thing-product-properties",p,"Thing has inapplicable Product properties");
    const count=subject?.subjectOf?.length || 0;
    if(modelSample.length<6)modelSample.push({path:p,title:meta.title,description:meta.description,linkedManufacturerSources:count,entityType:subject?.["@type"],htmlBytes:Buffer.byteLength(body)});
   }
   observedAnchors.set(page,extractCanonicalAnchors(body,page,unique));
   inspectedPages.push(page);
   valid++;
  }catch(e){fetchFailures++;error("page-fetch",page,String(e));}
 }));
}
// Inspect actual resource responses, not only the deployed _headers source.
// The comparison UI still needs these JSON files to render technical values.
let comparisonDataChecked=0;
for(const locale of Object.keys(languages)){
 const id=comparisonSamples.get(locale);
 if(!id){error("comparison-sample-missing",locale,"No canonical comparison sample");continue;}
 const path="/comparison-data/"+locale+"/"+id+".json";
 try{
  const {response,body}=await fetchPage(path);
  const reasons=comparisonDataProblems(response,body);
  for(const reason of reasons)error("comparison-data-indexing",path,reason);
  if(!reasons.length)comparisonDataChecked++;
 }catch(e){error("comparison-data-fetch",path,String(e));}
}
console.log("TRACTORVS_COMPARISON_DATA_INDEXING "+JSON.stringify({checked:comparisonSamples.size,passed:comparisonDataChecked}));
for (const [asset,refs] of stylesheetRefs) {
  let reason;
  try {
    const {response,body}=await fetchPage(asset);
    reason=stylesheetProblem(response,body);
  } catch (err) { reason=String(err); }
  if (reason) error("live-stylesheet",asset,reason+"; referenced by "+refs.pages+" checked pages, e.g. "+refs.example);
}
console.log("TRACTORVS_LIVE_STYLESHEETS "+JSON.stringify({distinct:stylesheetRefs.size,
  failed:problems.filter(issue=>issue.code==="live-stylesheet").length}));
const baseline=[...modelByLocale.en].sort().join("|");
// Incomplete network crawls are failures, but must not invent missing-model
// claims: only compare complete per-locale inventories after every page loads.
if(fetchFailures===0 && valid===urls.length){
  for(const [locale,slugs] of Object.entries(modelByLocale))
   if([...slugs].sort().join("|")!==baseline)
    error("locale-model-mismatch",locale,"Published models differ across locales: "+slugs.size+" vs en="+modelByLocale.en.size);
  if(modelByLocale.en.size<17)error("missing-models","/tractors/","Fewer than 17 published model URLs in sitemap");
}
let coverage=null;
try{coverage=verifyProductionSeoCoverage(inventory,urls,inspectedPages,AUDIT_MODE);}
catch(e){error("crawl-coverage","/sitemap-index.xml",String(e?.message||e));}
const internalLinks=summarizeCanonicalGraph(unique,observedAnchors,{fullCoverage:coverage?.fullCoverage===true,roots:Object.keys(languages).map(lang=>BASE+(lang==="en"?"/":"/"+lang+"/"))});
const {noIncoming,unreachable,...internalLinkSummary}=internalLinks;
console.log("TRACTORVS_INTERNAL_LINK_GRAPH "+JSON.stringify(internalLinkSummary));
// Report graph candidates separately from SEO errors/title advisories. A static
// HTML graph is not proof of search-engine crawling, indexing or all aliases.
const crossLocaleTitleCandidates=crossLocaleModelTitleGroups(modelTitleRecords);
for(const group of crossLocaleTitleCandidates)warn("cross-locale-model-title",group.files[0],
 "Identical title observed for the same model in multiple locales; review language wording without removing identity",group);
const descriptionReuse=descriptionReuseGroups(descriptionRecords);
for(const group of descriptionReuse.sameLocale)warn("same-locale-description-reuse",group.files[0],"Review repeated description on distinct observed canonical pages",group);
for(const group of descriptionReuse.crossLocale)warn("cross-locale-model-description",group.files[0],"Review identical model description in multiple observed languages",group);
const report={
  site:BASE,mode:AUDIT_MODE,sitemaps:siteMaps.length,sitemapUrls:unique.size,
  htmlPages:inventory.htmlPages.size,forumPages:inventory.forumPages.size,
  imagePageReferences:inventory.imagePages.size,
  plannedPages:urls.length,checkedPages:valid,coverageComplete:coverage!==null,fullCoverage:coverage?.fullCoverage===true,modelPages,modelsPerLocale:Object.fromEntries(Object.entries(modelByLocale).map(([k,v])=>[k,v.size])),
  fullPublishedModelsPerLocale:inventory.modelsPerLocale,
  titleAdvisories:titleLengths,
  crossLocaleTitleGroups:crossLocaleTitleCandidates.length,
  descriptionAdvisories:descriptionLengths,
  sameLocaleDescriptionGroups:descriptionReuse.sameLocale.length,
  crossLocaleDescriptionGroups:descriptionReuse.crossLocale.length,
  internalLinkSummary,comparisonDataChecked,
  errors:problems.length,warnings:warnings.length,
};
console.log("TRACTORVS_SEO_AUDIT_REPORT "+JSON.stringify(report));
console.log("TRACTORVS_SEO_MODEL_SAMPLES "+JSON.stringify(modelSample));
if(warnings.length)console.log("TRACTORVS_SEO_WARNINGS "+JSON.stringify(warnings.slice(0,30)));
// CI retains the complete review inventory rather than just 30 console samples.
if(process.env.TRACTORVS_SEO_EVIDENCE_PATH){
 writeFileSync(process.env.TRACTORVS_SEO_EVIDENCE_PATH,JSON.stringify({report,warnings,problems,internalLinks,crossLocaleTitleCandidates,descriptionReuse},null,2)+"\n");
}
if(problems.length)process.exitCode=1;
