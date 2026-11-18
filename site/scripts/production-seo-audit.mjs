// Read-only production SEO coverage audit. No credentials or writes.
const BASE = "https://tractorvs.com";
const languages = {en:"en",tr:"tr",zh:"zh-Hans",hi:"hi","pt-br":"pt-BR",fr:"fr",de:"de",ru:"ru",ja:"ja",es:"es"};
const problems=[], warnings=[], allPages=[];
const error=(code,page,why)=>{problems.push({code,page,why});console.error("SEO_ERROR "+JSON.stringify({code,page,why}));};
const warn=(code,page,why)=>{warnings.push({code,page,why});};
const matches=(txt,re)=>[...txt.matchAll(re)].map(m=>m[1]);
async function fetchPage(url) {
  const u=new URL(url,BASE);
  if(u.origin!==BASE)throw Error("Refused external URL "+u.href);
  for(let n=0;n<2;n++){
    const response=await fetch(u,{redirect:"follow",signal:AbortSignal.timeout(25000)});
    const body=await response.text();
    if([429,502,503].includes(response.status)&&n===0)continue;
    return {body,response};
  }
  throw Error("Unexpected HTTP retry failure");
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
for(const loc of siteMaps){
 try{
  const r=await fetchPage(loc);
  if(r.response.status!==200)error("sitemap-child",loc,"HTTP "+r.response.status);
  allPages.push(...xmlLocs(r.body));
 }catch(e){error("sitemap-fetch",loc,String(e));}
}
const unique=new Set(allPages);
if(unique.size!==allPages.length)error("duplicate-sitemap-url","/sitemap-index.xml",
  (allPages.length-unique.size)+" duplicate URLs");
const modelByLocale=Object.fromEntries(Object.keys(languages).map(k=>[k,new Set()]));
let valid=0, modelPages=0, modelSample=[];
const titlesByLocale=new Map();
const urls=[...unique];
for(let i=0;i<urls.length;i+=6){
 await Promise.all(urls.slice(i,i+6).map(async page=>{
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
   if(meta.lang!==languages[locale])error("html-language",p,"HTML lang "+meta.lang+" expected "+languages[locale]);
   const base=p.replace(/^\/(tr|zh|hi|pt-br|fr|de|ru|ja|es)(?=\/)/,"");
   const alternateMap=new Map(meta.alternates.map(x=>[x.lang,x.url]));
   for(const [l,code] of Object.entries(languages)){
    const expected=BASE+(l==="en"?base:"/"+l+base);
    if(alternateMap.get(code)!==expected)error("hreflang",p,code+" expected "+expected);
   }
   if(alternateMap.get("x-default")!==BASE+base)error("x-default",p,"Invalid default language");
   const isModel=/\/tractors\/[^/]+\/$/.test(p);
   if(isModel){
    const slug=p.split("/").filter(Boolean).at(-1);
    modelByLocale[locale].add(slug);modelPages++;
    const titleKey=locale+"::"+meta.title;
    const previous=titlesByLocale.get(titleKey);
    if(previous && previous!==p)error("duplicate-model-title",p,"Same title as "+previous);
    titlesByLocale.set(titleKey,p);
    if(meta.title.length>105)warn("verbose-title",p,"Title has "+meta.title.length+" characters");
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
  }catch(e){error("page-fetch",page,String(e));}
 }));
}
const baseline=[...modelByLocale.en].sort().join("|");
for(const [locale,slugs] of Object.entries(modelByLocale))
 if([...slugs].sort().join("|")!==baseline)
  error("locale-model-mismatch",locale,"Published models differ across locales: "+slugs.size+" vs en="+modelByLocale.en.size);
if(modelByLocale.en.size<17)error("missing-models","/tractors/","Fewer than 17 published model URLs in sitemap");
const report={
  site:BASE,sitemaps:siteMaps.length,sitemapUrls:unique.size,checkedPages:valid,
  modelPages,modelsPerLocale:Object.fromEntries(Object.entries(modelByLocale).map(([k,v])=>[k,v.size])),
  errors:problems.length,warnings:warnings.length,
};
console.log("TRACTORVS_SEO_AUDIT_REPORT "+JSON.stringify(report));
console.log("TRACTORVS_SEO_MODEL_SAMPLES "+JSON.stringify(modelSample));
if(warnings.length)console.log("TRACTORVS_SEO_WARNINGS "+JSON.stringify(warnings.slice(0,30)));
if(problems.length)process.exitCode=1;
