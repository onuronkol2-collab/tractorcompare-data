/**
 * Production-only smoke check for reviewed EN/TR brand discovery pilots.
 * No network calls, no secrets, no Cloudflare writes.
 * Validates real source-backed output from the published catalogue build.
 */
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {join,resolve} from "node:path";
import {fileURLToPath} from "node:url";

export const BASE="https://tractorvs.com";
export const SLUGS=["mccormick","valtra"];
export const PREFIXES=["","tr/"];

export function auditPilotHtml(html,{slug,prefix}){
  const path="/"+prefix+"brands/"+slug+"/";
  const origin=BASE+path;
  const models=[...html.matchAll(/<article\b[^>]*class="brand-model"[^>]*>/g)].length;
  const hrefs=[...html.matchAll(/<h3><a href="([^"]+)"/g)].map(x=>x[1]);
  const unique=new Set(hrefs);
  const expectedDetailPrefix="/"+prefix+"tractors/";
  const canonical=(html.match(/<link rel="canonical" href="([^"]+)"/)||[])[1]||null;
  const indexable=/name="robots" content="index,follow,max-image-preview:large"/.test(html);
  const hrefEn=BASE+"/brands/"+slug+"/";
  const hrefTr=BASE+"/tr/brands/"+slug+"/";
  const hasEn=html.includes('hreflang="en" href="'+hrefEn+'"');
  const hasTr=html.includes('hreflang="tr" href="'+hrefTr+'"');
  const wrongLocales=/(?:hreflang|og:locale:alternate)="(?:zh|hi|pt-BR|fr|de|ru|ja|es)"/.test(html);
  const externalSources=(html.match(/class="brand-model-links"[\s\S]*?target="_blank" rel="noopener noreferrer"/g)||[]).length;
  const passed=models>=10&&hrefs.length===models&&unique.size===models&&
    hrefs.every(href=>href.startsWith(expectedDetailPrefix)&&href.endsWith("/"))&&
    canonical===origin&&indexable&&hasEn&&hasTr&&!wrongLocales&&externalSources>=1;
  return {path,models,modelLinks:hrefs.length,unique:unique.size,
    externalSources,canonical,indexable,hasEn,hasTr,wrongLocales,passed};
}

export function verifyPilotArtifacts(dist){
  const reports=[];
  const sitemaps=readdirSync(dist).filter(x=>/^sitemap-\d+\.xml$/.test(x))
    .map(name=>readFileSync(join(dist,name),"utf8")).join("\n");
  for(const slug of SLUGS){
    for(const prefix of PREFIXES){
      const path=join(dist,prefix,"brands",slug,"index.html");
      if(!existsSync(path))throw Error("Missing expected published brand page: "+path);
      const html=readFileSync(path,"utf8");
      const result=auditPilotHtml(html,{slug,prefix});
      if(!result.passed)throw Error("Invalid brand discovery page: "+JSON.stringify(result));
      if(!sitemaps.includes("<loc>"+BASE+result.path+"</loc>"))
        throw Error("Brand page missing from generated HTML sitemap: "+result.path);
      reports.push(result);
    }
  }
  for(const prefix of PREFIXES){
    const catalog=readFileSync(join(dist,prefix,"tractors","index.html"),"utf8");
    for(const slug of SLUGS){
      const target="/"+prefix+"brands/"+slug+"/";
      if(!catalog.includes('href="'+target+'"'))
        throw Error("Brand guide not linked from SSR catalogue: "+target);
    }
  }
  for(const prefix of ["zh/","hi/","pt-br/","fr/","de/","ru/","ja/","es/"]){
    for(const slug of SLUGS){
      if(existsSync(join(dist,prefix,"brands",slug,"index.html")))
        throw Error("Unreviewed language brand page was generated: "+prefix+slug);
    }
  }
  return {pages:reports.length,modelsByPage:reports.map(r=>({path:r.path,count:r.models}))};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const dist=resolve(fileURLToPath(new URL("../dist",import.meta.url)));
  const report=verifyPilotArtifacts(dist);
  console.log("TRACTORVS_BRAND_PILOT_QA "+JSON.stringify(report));
}
