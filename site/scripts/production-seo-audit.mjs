import {inspectVisibleMainImages} from "./seo-main-markup.mjs";
import {inspectDocumentImageAlts,inspectUndocumentedEmptyImageAlts} from "./verify-sitewide-image-alts.mjs";
import {parseProductionSitemapInventory,selectProductionSeoPages} from "./production-sitemap-inventory.mjs";
// Read-only production SEO coverage audit. No credentials or writes.
const BASE = "https://tractorvs.com";
const languages = {en:"en",tr:"tr",zh:"zh-Hans",hi:"hi","pt-br":"pt-BR",fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};
const problems=[], warnings=[];
const AUDIT_MODE=process.env.TRACTORVS_SEO_AUDIT_MODE==="full"?"full":"daily";
const error=(code,page,why)=>{problems.push({code,page,why});console.error("SEO_ERROR "+JSON.stringify({code,page,why}));};
const warn=(code,page,why)=>{warnings.push({code,page,why});};
const matches=(txt,re)=>[...txt.matchAll(re)].map(m=>m[1]);
async function fetchPage(url) {
  const u=new URL(url,BASE);
  if(u.origin!==BASE)throw Error("Refused external URL "+u.href);
  let lastFailure;
  for(let n=0;n<4;n++){
    try{
      const response=await fetch(u,{redirect:"follow",signal:AbortSignal.timeout(25000)});
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
const attr=(html,name)=>html.match(new RegExp("\\b"+name+"=['\"]([^'\"]+)['\"]","i"))?.[1]||null;
const tags=(html,name)=>[...html.matchAll(new RegExp("<"+name+"\\b[^>]*>","gi"))].map(m=>m[0]);
function metadata(html){
 const links=tags(html,"link"), metas=tags(html,"meta");
 const m=(name)=>attr(metas.find(tag=>attr(tag,"name")===name)||"","content");
 return {
  title:html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]||"",
  description:m("description")||"", robots:m("robots")||"",
  canonical:links.filter(x=>attr(x,"rel")==="canonical").map(x=>attr(x,"href")),
  alternates:links.filter(x=>attr(x,"rel")==="alternate" && attr(x,"hreflang"))
    .map(x=>({lang:attr(x,"hreflang"),url:attr(x,"href")})),
  lang:html.match(/<html[^>]*lang=['"]([^'"]+)['"]/i)?.[1]||"",
  h1:/<h1\b/i.test(html),
  json:matches(html,/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi),
 };
}
const robots=await fetchPage("/robots.txt");
if(robots.response.status!==200 || /^Disallow:\s*\/\s*$/im.test(robots.body))
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
const titlesByLocale=new Map();
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
   if((response.headers.get("x-robots-tag")||"").includes("noindex"))
    error("blocked-header",p,"X-Robots-Tag noindex on production");
   const meta=metadata(body);
   if(meta.robots.includes("noindex"))error("blocked-meta",p,meta.robots);
   if(meta.canonical.length!==1 || meta.canonical[0]!==page)
    error("canonical",p,JSON.stringify(meta.canonical));
   const locale=p.match(/^\/(tr|zh|hi|pt-br|fr|de|ru|ja|es)\//)?.[1]||"en";
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
       " characters; review optional boilerplate but retain identity");
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
   const alternateMap=new Map(meta.alternates.map(x=>[x.lang,x.url]));
   // Methodology has only EN/TR translations; guides now have all ten.
   // Expect reciprocal alternate tags ONLY when a matching indexable URL
   // really exists in this fetched production sitemap inventory.
   for(const [l,code] of Object.entries(languages)){
    const expected=BASE+(l==="en"?base:"/"+l+base);
    const actual=alternateMap.get(code);
    if(unique.has(expected) && actual!==expected)
      error("hreflang",p,code+" expected "+expected);
    if(!unique.has(expected) && actual)
      error("hreflang-nonexistent",p,code+" points at an unlisted locale page "+actual);
   }
   const defaultExpected=BASE+base;
   if(unique.has(defaultExpected) && alternateMap.get("x-default")!==defaultExpected)
     error("x-default",p,"Invalid default language");
   const isModel=/\/tractors\/[^/]+\/$/.test(p);
   if(isModel){
    const slug=p.split("/").filter(Boolean).at(-1);
    modelByLocale[locale].add(slug);modelPages++;
    const titleKey=locale+"::"+meta.title;
    const previous=titlesByLocale.get(titleKey);
    if(previous && previous!==p)error("duplicate-model-title",p,"Same title as "+previous);
    titlesByLocale.set(titleKey,p);
    // Length guidance is reported for every page type, not only models.
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
   valid++;
  }catch(e){fetchFailures++;error("page-fetch",page,String(e));}
 }));
}
const baseline=[...modelByLocale.en].sort().join("|");
// Incomplete network crawls are failures, but must not invent missing-model
// claims: only compare complete per-locale inventories after every page loads.
if(fetchFailures===0){
  for(const [locale,slugs] of Object.entries(modelByLocale))
   if([...slugs].sort().join("|")!==baseline)
    error("locale-model-mismatch",locale,"Published models differ across locales: "+slugs.size+" vs en="+modelByLocale.en.size);
  if(modelByLocale.en.size<17)error("missing-models","/tractors/","Fewer than 17 published model URLs in sitemap");
}
const report={
  site:BASE,mode:AUDIT_MODE,sitemaps:siteMaps.length,sitemapUrls:unique.size,
  htmlPages:inventory.htmlPages.size,forumPages:inventory.forumPages.size,
  imagePageReferences:inventory.imagePages.size,
  checkedPages:valid,modelPages,modelsPerLocale:Object.fromEntries(Object.entries(modelByLocale).map(([k,v])=>[k,v.size])),
  fullPublishedModelsPerLocale:inventory.modelsPerLocale,
  titleAdvisories:titleLengths,
  errors:problems.length,warnings:warnings.length,
};
console.log("TRACTORVS_SEO_AUDIT_REPORT "+JSON.stringify(report));
console.log("TRACTORVS_SEO_MODEL_SAMPLES "+JSON.stringify(modelSample));
if(warnings.length)console.log("TRACTORVS_SEO_WARNINGS "+JSON.stringify(warnings.slice(0,30)));
if(problems.length)process.exitCode=1;
