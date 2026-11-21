/**
 * Read-only TractorVS edge canonical health report.
 *
 * The sitemap and HTML already declare https://tractorvs.com as canonical.
 * This checks the transport/host layer independently, using redirect:"manual"
 * so that a followed redirect cannot be mistaken for a direct HTTP 200.
 *
 * Never calls private endpoints, logs credentials, changes Cloudflare config,
 * or rewrites canonical URLs. The www alias is monitored but optional until
 * the site owner creates its proxied DNS record and redirect.
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const PREFERRED_ORIGIN = "https://tractorvs.com";
export const PATHS = ["/", "/tr/", "/tr/tractors/"];
const OPTIONAL_HOST = "https://www.tractorvs.com";

function sampleUrl(prefix, pathname) {
  return new URL(pathname, prefix).toString();
}

async function probe(url, fetchFn) {
  const response = await fetchFn(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(14_000),
    headers: { "User-Agent": "TractorVS-edge-canonical-audit/1.0" },
  });
  const rawLocation = response.headers.get("location");
  let location = null;
  if (rawLocation) {
    try { location = new URL(rawLocation, url).toString(); }
    catch { location = rawLocation; }
  }
  return { status: response.status, location, response };
}

export async function inspectCanonicalEdge({fetchFn = fetch, paths = PATHS} = {}) {
  const results = [];
  const issues = [];
  const notices = [];
  for (const pathname of paths) {
    const target = sampleUrl(PREFERRED_ORIGIN, pathname);
    const url = sampleUrl("http://tractorvs.com", pathname);
    try {
      const {status,location} = await probe(url,fetchFn);
      const good = [301,308].includes(status) && location === target;
      results.push({url,status,location,expected:target,ok:good});
      if (!good) issues.push({
        code:"http-to-https",url,
        message:"Expected a direct permanent 301/308 redirect to "+target+
          "; got HTTP "+status+(location?" Location "+location:""),
      });
    } catch (error) {
      issues.push({code:"http-unavailable",url,
        message:"Unable to verify direct HTTP redirect: "+String(error?.message||error).slice(0,180)});
    }
  }

  for (const pathname of ["/","/tr/tractors/"]) {
    const url = sampleUrl(OPTIONAL_HOST,pathname);
    const target = sampleUrl(PREFERRED_ORIGIN,pathname);
    try {
      const {status,location} = await probe(url,fetchFn);
      const good = [301,308].includes(status) && location === target;
      results.push({url,status,location,expected:target,ok:good});
      if(!good) notices.push({code:"www-canonical",url,
        message:"Optional www alias should redirect permanently to "+target+
          ", not return "+status+(location?" -> "+location:"")});
    }catch(error){
      notices.push({code:"www-unavailable",url,
        message:"www host unavailable (check Cloudflare proxied DNS and SSL): "+
          String(error?.message||error).slice(0,140)});
    }
  }

  for (const pathname of ["/","/tr/"]) {
    const url = sampleUrl(PREFERRED_ORIGIN,pathname);
    try {
      const {response,status} = await probe(url,fetchFn);
      if(status!==200){
        issues.push({code:"https-response",url,message:"Expected HTTP 200; got "+status});
        continue;
      }
      const type=response.headers.get("content-type")||"";
      const html=await response.text();
      const canonical=(html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)||[])[1]
        ||(html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i)||[])[1];
      const canonicalCount=(html.match(/<link\b[^>]*\brel=["']canonical["']/gi)||[]).length;
      const noindex=/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(html) ||
        /noindex/i.test(response.headers.get("x-robots-tag")||"");
      const good=type.includes("text/html") && canonical===url && canonicalCount===1 && !noindex;
      results.push({url,status,canonical,canonicalCount,noindex,ok:good});
      if(!good)issues.push({code:"https-canonical",url,
        message:"HTTPS canonical inconsistency: content-type="+type+
          " canonical="+String(canonical)+" tags="+canonicalCount+" noindex="+noindex});
    } catch(error) {
      issues.push({code:"https-unavailable",url,
        message:"Failed to verify HTTPS canonical: "+String(error?.message||error).slice(0,180)});
    }
  }

  return {origin:PREFERRED_ORIGIN,passed:issues.length===0,
    issues,notices,results};
}

export async function main() {
  const report=await inspectCanonicalEdge();
  for(const item of report.results)console.log("EDGE_CANONICAL_PROBE "+JSON.stringify(item));
  for(const item of report.issues)console.log("EDGE_CANONICAL_ISSUE "+JSON.stringify(item));
  for(const item of report.notices)console.log("EDGE_CANONICAL_NOTICE "+JSON.stringify(item));
  console.log("EDGE_CANONICAL_SUMMARY "+JSON.stringify({
    checked:report.results.length,issues:report.issues.length,
    notices:report.notices.length,strict:process.env.TRACTORVS_EDGE_CANONICAL_STRICT==="true"
  }));
  if(process.env.GITHUB_STEP_SUMMARY) {
    const {appendFileSync}=await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      "## TractorVS HTTP/HTTPS & www canonical verification\n\n"+
      "- HTTP/HTTPS issues: **"+report.issues.length+"**\n"+
      "- www notices: **"+report.notices.length+"**\n"+
      "- Strict enforcement: **"+(process.env.TRACTORVS_EDGE_CANONICAL_STRICT==="true"?"on":"off (audit only)")+"**\n"+
      report.issues.map(x=>"- "+x.code+": "+x.message+"\n").join("")+
      report.notices.map(x=>"- "+x.code+": "+x.message+"\n").join("")+"\n");
  }
  // Initially audit-only; Cloudflare dashboard changes are owner-account tasks.
  // Promote to strict only once redirects are verified and stable.
  if(report.issues.length && process.env.TRACTORVS_EDGE_CANONICAL_STRICT==="true")
    process.exitCode=1;
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await main();
}
