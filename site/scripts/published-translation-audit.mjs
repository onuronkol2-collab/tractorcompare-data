// Read-only translation regression probe over all 10 published model URLs.
// It deliberately reports technical headings, NOT source evidence or raw specs.
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
console.log("LANGUAGE_AUDIT_SUMMARY "+JSON.stringify({publishedURLs:urls.length,modelCounts:Object.fromEntries(locales.map(l=>[l,byLocale.get(l).size])),missingHeadingCounts:Object.fromEntries(locales.slice(1).map(l=>[l,suspects.filter(x=>x.locale===l).length])),fetchErrors:errors}));
if(errors.length)process.exitCode=1;
