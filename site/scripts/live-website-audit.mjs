// Non-mutating inspection of the *public* TractorVS Worker endpoint.
// No database credentials, private API calls or external packages.
import {inspectPublicPage,modelSlugs,inspectCatalogParity,CATALOG_PATHS,HOME_PATHS} from "./live-public-response.mjs";
const origin = new URL(process.env.TRACTORVS_AUDIT_ORIGIN ||
  "https://tractorvs-site.onuronkol2.workers.dev");
const approvedHosts = new Set(["tractorvs.com", "tractorvs-site.onuronkol2.workers.dev"]);
if (origin.protocol !== "https:" || !approvedHosts.has(origin.hostname) ||
    origin.port || origin.username || origin.password) {
  throw Error("The audit accepts only approved public TractorVS HTTPS hosts.");
}
const pages = [...HOME_PATHS,...CATALOG_PATHS,"/robots.txt","/sitemap-index.xml",
  "/methodology/", "/tr/methodology/",
  "/guides/choosing-a-tractor/", "/tr/guides/choosing-a-tractor/",
  "/zh/guides/choosing-a-tractor/", "/hi/guides/choosing-a-tractor/",
  "/pt-br/guides/choosing-a-tractor/", "/fr/guides/choosing-a-tractor/",
  "/de/guides/choosing-a-tractor/", "/ru/guides/choosing-a-tractor/",
  "/ja/guides/choosing-a-tractor/", "/es/guides/choosing-a-tractor/",
  "/reviews/basak-2075-bk/", "/tr/reviews/basak-2075-bk/",
  "/zh/reviews/basak-2075-bk/", "/hi/reviews/basak-2075-bk/",
  "/pt-br/reviews/basak-2075-bk/", "/fr/reviews/basak-2075-bk/",
  "/de/reviews/basak-2075-bk/", "/ru/reviews/basak-2075-bk/",
  "/ja/reviews/basak-2075-bk/", "/es/reviews/basak-2075-bk/"];
const results=[];
const modelLinks = new Map();
const production=origin.hostname==="tractorvs.com";
const modelProblems=[];
for (const path of pages) {
  const url = new URL(path,origin);
  try {
    const response = await fetch(url,{
      signal:AbortSignal.timeout(16000),
      redirect:"manual",
      headers: {"User-Agent":"TractorVS-public-SEO-smoke-check/1.0"}
    });
    const body = await response.text();
    const isHtml=(response.headers.get("content-type")||"").includes("text/html");
    const get=(regex)=>body.match(regex)?.[1] ?? null;
    if(isHtml&&CATALOG_PATHS.includes(path))modelLinks.set(path,modelSlugs(body,path));
    const finalPath=new URL(response.url||url.href).pathname;
    const errors=inspectPublicPage({path,status:response.status,finalPath,contentType:response.headers.get("content-type"),body,headerRobots:response.headers.get("x-robots-tag"),production});
    const entry={
      path,
      status:response.status,
      final_path:finalPath,
      errors,
      content_type:response.headers.get("content-type"),
      header_robots:response.headers.get("x-robots-tag"),
      html_robots:isHtml?get(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i):null,
      html_canonical:isHtml?get(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i):null,
      hreflang_count:isHtml?(body.match(/hreflang=/gi)||[]).length:0,
      jsonld_count:isHtml?(body.match(/application\/ld\+json/gi)||[]).length:0,
      model_detail_links:isHtml?(body.match(/href=["'][^"']*\/tractors\/[^"']+["']/gi)||[]).length:0,
      contains_same_or_landini:isHtml?/\b(SAME|Landini|McCormick|Belarus)\b/i.test(body):null,
      robots_preview:!isHtml&&path==="/robots.txt"?body.slice(0,220).replace(/\s+/g," "):null,
      sitemap_preview:!isHtml&&path==="/sitemap-index.xml"?body.slice(0,120).replace(/\s+/g," "):null,
    };
    results.push(entry);
    console.log("PUBLIC_PAGE_AUDIT "+JSON.stringify(entry));
  } catch(error) {
    const entry={path,error:String(error?.message || error)};
    results.push(entry);
    console.log("PUBLIC_PAGE_AUDIT "+JSON.stringify(entry));
  }
}
for (const [catalogue, links] of modelLinks) {
  console.log("LIVE_CATALOG_SLUGS " + JSON.stringify({catalogue,total_links:links.length,links:links.slice(0,100)}));
}
const english = (modelLinks.get("/tractors/") || []).map(slug=>"/tractors/"+slug);
for (const path of english.slice(0,4)) {
  try {
    const response = await fetch(new URL(path,origin),{signal:AbortSignal.timeout(16000),redirect:"manual"});
    const html = await response.text();
    const errors=inspectPublicPage({path,status:response.status,finalPath:new URL(response.url||new URL(path,origin)).pathname,contentType:response.headers.get("content-type"),body:html,headerRobots:response.headers.get("x-robots-tag"),production});
    if(!/(spec-group|model-spec-card)/i.test(html))errors.push("missing-technical-specs");
    if(errors.length)modelProblems.push({path,errors});
    console.log("LIVE_MODEL_PAGE " + JSON.stringify({
      path, status:response.status, errors,
      h1:html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g," ").trim() ?? null,
      has_technical_specs:/(technical spec|technical data|wheelbase|transmission|spec-group|model-spec-card)/i.test(html),
      canonical:html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? null,
      has_jsonld:/application\/ld\+json/i.test(html),
      robots:html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] ?? null
    }));
  } catch(e) { modelProblems.push({path,error:String(e)}); console.log("LIVE_MODEL_PAGE "+JSON.stringify({path,error:String(e)})); }
}
const editorialProblems=results.filter(r=>
  (r.path.includes("/guides/")||r.path.includes("/methodology/")||r.path.includes("/reviews/"))
  && r.status!==200);
console.log("TRACTORVS_LIVE_EDITORIAL_HEALTH "+JSON.stringify({
  checked:results.filter(r=>/\/(guides|methodology|reviews)\//.test(r.path)).length,
  errors:editorialProblems.length,
  pages:editorialProblems.map(r=>({path:r.path,status:r.status??null,error:r.error??null}))
}));
console.log("AUDIT_SUMMARY "+JSON.stringify({
  total:results.length,
  http_ok:results.filter(r=>r.status>=200&&r.status<300).length,
  http_non_ok:results.filter(r=>!(r.status>=200&&r.status<300)).length,
  requests_failed:results.filter(r=>r.error).length,
  robots:results.find(r=>r.path==="/robots.txt")?.robots_preview ?? null,
}));
const parity=inspectCatalogParity(modelLinks);
const publicProblems=results.filter(r=>r.error||r.errors?.length);
console.log("TRACTORVS_PUBLIC_RESPONSE_HEALTH "+JSON.stringify({origin:origin.origin,checked:results.length,errors:publicProblems,modelErrors:modelProblems,catalogParity:parity,strict:production&&process.env.GITHUB_EVENT_NAME!=="pull_request"}));
// PR and workers.dev are observational only: they do not prove deployment.
// On the canonical production origin, all observed failures count, not just
// editorial HTTP failures or a total network outage.
if(production&&process.env.GITHUB_EVENT_NAME!=="pull_request"&&(publicProblems.length||modelProblems.length||parity.length))process.exitCode=1;
if(results.every(r=>r.error))process.exitCode=1;
