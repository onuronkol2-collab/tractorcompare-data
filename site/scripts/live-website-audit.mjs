// Non-mutating inspection of the *public* TractorVS Worker endpoint.
// No database credentials, private API calls or external packages.
const origin = new URL(process.env.TRACTORVS_AUDIT_ORIGIN ||
  "https://tractorvs-site.onuronkol2.workers.dev");
if (origin.protocol !== "https:" || !origin.hostname.endsWith(".workers.dev"))
  throw Error("Expected HTTPS workers.dev origin");
const pages = ["/", "/robots.txt", "/sitemap-index.xml",
  "/tractors/", "/tr/tractors/", "/tr/"];
const results=[];
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
console.log("AUDIT_SUMMARY "+JSON.stringify({
  total:results.length,
  http_ok:results.filter(r=>r.status>=200&&r.status<300).length,
  requests_failed:results.filter(r=>r.error).length,
  robots:results.find(r=>r.path==="/robots.txt")?.robots_preview ?? null,
}));
if(results.every(r=>r.error)) {
  process.exitCode=1;
}
