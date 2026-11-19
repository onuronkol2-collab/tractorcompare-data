// Non-mutating inspection of the *public* TractorVS Worker endpoint.
// No database credentials, private API calls or external packages.
const origin = new URL(process.env.TRACTORVS_AUDIT_ORIGIN ||
  "https://tractorvs-site.onuronkol2.workers.dev");
const approvedHosts = new Set(["tractorvs.com", "tractorvs-site.onuronkol2.workers.dev"]);
if (origin.protocol !== "https:" || !approvedHosts.has(origin.hostname) ||
    origin.port || origin.username || origin.password) {
  throw Error("The audit accepts only approved public TractorVS HTTPS hosts.");
}
const pages = ["/", "/robots.txt", "/sitemap-index.xml",
  "/tractors/", "/tr/tractors/", "/tr/",
  "/methodology/", "/tr/methodology/",
  "/guides/choosing-a-tractor/", "/tr/guides/choosing-a-tractor/",
  "/zh/guides/choosing-a-tractor/", "/hi/guides/choosing-a-tractor/",
  "/pt-br/guides/choosing-a-tractor/", "/fr/guides/choosing-a-tractor/",
  "/de/guides/choosing-a-tractor/", "/ru/guides/choosing-a-tractor/",
  "/ja/guides/choosing-a-tractor/", "/es/guides/choosing-a-tractor/"];
const results=[];
const modelLinks = new Map();
for (const path of pages) {
  const url = new URL(path,origin);
  try {
    const response = await fetch(url,{
      signal:AbortSignal.timeout(16000),
      redirect:"follow",
      headers: {"User-Agent":"TractorVS-public-SEO-smoke-check/1.0"}
    });
    const body = (await response.text()).slice(0,500000);
    const isHtml=(response.headers.get("content-type")||"").includes("text/html");
    const get=(regex)=>body.match(regex)?.[1] ?? null;
    if (isHtml && (path === "/tractors/" || path === "/tr/tractors/")) {
      const slugs = [...body.matchAll(/href=["'](\/(?:tr\/)?tractors\/[^"'?#]+\/?)["']/gi)]
        .map((m) => m[1]);
      modelLinks.set(path, [...new Set(slugs)].sort());
    }
    const entry={
      path,
      status:response.status,
      final_path:new URL(response.url).pathname,
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
const english = modelLinks.get("/tractors/") || [];
for (const path of english.slice(0,4)) {
  try {
    const response = await fetch(new URL(path,origin),{signal:AbortSignal.timeout(16000),redirect:"follow"});
    const html = (await response.text()).slice(0,500000);
    console.log("LIVE_MODEL_PAGE " + JSON.stringify({
      path, status:response.status,
      h1:html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g," ").trim() ?? null,
      has_technical_specs:/(technical spec|technical data|wheelbase|transmission|spec-group|model-spec-card)/i.test(html),
      canonical:html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] ?? null,
      has_jsonld:/application\/ld\+json/i.test(html),
      robots:html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] ?? null
    }));
  } catch(e) { console.log("LIVE_MODEL_PAGE "+JSON.stringify({path,error:String(e)})); }
}
console.log("AUDIT_SUMMARY "+JSON.stringify({
  total:results.length,
  http_ok:results.filter(r=>r.status>=200&&r.status<300).length,
  requests_failed:results.filter(r=>r.error).length,
  robots:results.find(r=>r.path==="/robots.txt")?.robots_preview ?? null,
}));
if(results.every(r=>r.error)) {
  process.exitCode=1;
}
