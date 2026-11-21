/**
 * Production SEO audit inventory from the ONE public sitemap index.
 * HTML and approved forum URLs are page inventory; image URLs are references
 * to those pages, not additional crawlable pages. No network/write effects.
 */
const SITE="https://tractorvs.com";
const LOCALES=["en","tr","zh","hi","pt-br","fr","de","ru","ja","es"];
function invalid(msg){throw Error("[TractorVS SEO inventory] "+msg);}
function normalized(raw){
 if(typeof raw!=="string")invalid("Non-string sitemap URL");
 const url=raw.replaceAll("&amp;","&");
 let parsed;
 try{parsed=new URL(url)}catch{invalid("Malformed URL "+url.slice(0,150));}
 if(parsed.origin!==SITE||parsed.search||parsed.hash||parsed.username||parsed.password||
   !parsed.pathname.endsWith("/")||parsed.href!==url)
  invalid("Noncanonical/offsite page URL "+url.slice(0,150));
 return url;
}
function entries(xml,tag){
 if(typeof xml!=="string")invalid("Missing "+tag+" XML");
 const root=tag==="sitemap"?"sitemapindex":"urlset";
 if(!new RegExp("<"+root+"(?:\\s|>)").test(xml))
  invalid("Invalid "+root+" root");
 const re=new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+tag+">","g");
 const matches=[...xml.matchAll(re)];
 const urls=[];
 for(const [,entry] of matches){
  // An image:image child contains <image:loc>, not the direct page <loc>.
  const locs=[...entry.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  if(locs.length!==1)invalid("Missing or repeated <loc> in "+tag+" entry");
  urls.push(locs[0].replaceAll("&amp;","&"));
 }
 return urls;
}
export function parseProductionSitemapInventory({indexXml,children}){
 const sitemapFiles=entries(indexXml,"sitemap");
 if(sitemapFiles.length<3||sitemapFiles.length>30)invalid("Unexpected child sitemap count");
 if(new Set(sitemapFiles).size!==sitemapFiles.length)invalid("Duplicate sitemap child");
 const htmlPages=new Set(),forumPages=new Set(),imagePages=new Set();
 let htmlChildren=0,imageChildren=0,forumChildren=0;
 for(const sitemapFile of sitemapFiles){
  let u;
  try{u=new URL(sitemapFile)}catch{invalid("Malformed sitemap child")}
  if(u.origin!==SITE||u.search||u.hash||u.href!==sitemapFile)
    invalid("Offsite/noncanonical sitemap child "+sitemapFile);
  const filename=u.pathname.slice(1);
  let type;
  if(/^sitemap-[0-9]+\.xml$/.test(filename)){type="html";htmlChildren++;}
  else if(filename==="forum-sitemap.xml"){type="forum";forumChildren++;}
  else if(filename==="image-sitemap.xml"){type="image";imageChildren++;}
  else invalid("Unexpected sitemap child "+filename);
  const xml=children instanceof Map?children.get(sitemapFile):children?.[sitemapFile];
  if(typeof xml!=="string")invalid("Missing fetched child "+filename);
  const pages=entries(xml,"url");
  if(type==="html" && !pages.length)invalid("Empty HTML sitemap "+filename);
  const target=type==="html"?htmlPages:type==="forum"?forumPages:imagePages;
  for(const raw of pages){
   const url=normalized(raw);
   if(target.has(url))invalid("Duplicate "+type+" page in sitemap "+url);
   if(type==="forum" &&
       !/^\/(?:(?:tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?forum\/(?:[a-z0-9-]+\/)?$/.test(new URL(url).pathname))
      invalid("Non-forum URL in approved forum sitemap "+url);
   target.add(url);
  }
 }
 if(!htmlChildren||imageChildren!==1||forumChildren!==1)
  invalid("Root index must include HTML, image and approved forum sitemap");
 for(const url of forumPages)if(htmlPages.has(url))
  invalid("Forum page duplicated in HTML and forum sitemap "+url);
 const pages=new Set([...htmlPages,...forumPages]);
 for(const url of imagePages)if(!pages.has(url))
  invalid("Image sitemap references an unapproved or unlisted page "+url);
 const modelSets=new Map();
 for(const locale of LOCALES){
  const root=SITE+"/"+(locale==="en"?"":locale+"/")+"tractors/";
  if(!htmlPages.has(root))invalid("Missing "+locale+" catalogue landing");
  const s=new Set([...htmlPages].filter(url=>url.startsWith(root)&&url!==root)
   .map(url=>url.slice(root.length)).filter(slug=>/^[^/]+\/$/.test(slug)));
  if(!s.size)invalid("Missing "+locale+" model pages");
  modelSets.set(locale,s);
 }
 const reference=modelSets.get("en");
 for(const [locale,models] of modelSets)
  if(models.size!==reference.size||[...reference].some(x=>!models.has(x)))
   invalid("Localized model slug parity failed: "+locale);
 return {indexChildren:sitemapFiles.length,htmlChildren,htmlPages,forumPages,imagePages,
  pages,modelsPerLocale:reference.size,modelCount:[...modelSets.values()].reduce((s,x)=>s+x.size,0),
  imagePagesAlreadyInHtml:[...imagePages].filter(x=>htmlPages.has(x)).length,
  imagePagesInForumOnly:[...imagePages].filter(x=>forumPages.has(x)).length};
}
/** Sample actual HTML daily, all canonical pages weekly (and explicitly in full mode).
 * Every locale gets a rotating window of model pages; editorial+forum are always included.
 */
export function selectProductionSeoPages(inventory,{mode="daily",day=0,samplePerLocale=20}={}){
 if(mode==="full")return [...inventory.pages];
 if(mode!=="daily"||!Number.isInteger(day)||day<0||
    !Number.isInteger(samplePerLocale)||samplePerLocale<1||samplePerLocale>100)
  invalid("Invalid daily audit sampling configuration");
 const nonModels=[],modelsByLocale=new Map(LOCALES.map(l=>[l,[]]));
 for(const url of inventory.pages){
  const m=new URL(url).pathname.match(/^\/(?:(tr|zh|hi|pt-br|fr|de|ru|ja|es)\/)?tractors\/([^/]+)\/$/);
  if(m)modelsByLocale.get(m[1]||"en").push(url);
  else nonModels.push(url);
 }
 const selected=new Set(nonModels);
 for(const urls of modelsByLocale.values()){
  urls.sort();
  if(!urls.length)invalid("Empty locale sample");
  const start=(day*samplePerLocale)%urls.length;
  for(let j=0;j<Math.min(samplePerLocale,urls.length);j++)
   selected.add(urls[(start+j)%urls.length]);
 }
 return [...selected];
}
