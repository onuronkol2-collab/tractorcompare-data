import { isLocale, localizedPath, unlocalizedPath } from "../src/lib/locales.ts";
import {resolveApprovedPhotoSource} from "../src/lib/tractor-photos.ts";

const cookieName = "tractorvs_locale";
const oneYear = 60 * 60 * 24 * 365;

function cookieLocale(request) {
  const match = /(?:^|;\s*)tractorvs_locale=([a-z-]+)/i.exec(request.headers.get("cookie") || "");
  return match && isLocale(match[1]) ? match[1] : null;
}

function internalDestination(url, locale) {
  const requested = url.searchParams.get("next");
  if (typeof requested !== "string" || !requested.startsWith("/") ||
      requested.startsWith("//") || requested.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(requested)) {
    return localizedPath(locale, "/");
  }
  const target = new URL(requested, url.origin);
  if (target.origin !== url.origin) return localizedPath(locale, "/");
  // Only allow locale-consistent destinations and never cross to external origins.
  return localizedPath(locale, unlocalizedPath(target.pathname)) + target.search;
}

function redirect(location, preferred = null) {
  const headers = new Headers({
    Location: location,
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  });
  if (preferred) {
    headers.set("Set-Cookie", cookieName + "=" + preferred +
      "; Path=/; Max-Age=" + oneYear + "; Secure; HttpOnly; SameSite=Lax");
  }
  return new Response(null, { status: 302, headers });
}

/** Only root and explicit language selection use the Worker; other pages are static. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    // Yandex and Naver require HTTP 200 at exact *.html verification URLs.
    // Cloudflare's default HTML handling redirects *.html to extensionless paths.
    // Serve only approved verification assets without changing site-wide
    // HTML canonical URLs or exposing an arbitrary asset proxy.
    const searchEngineHtmlProofPaths = new Set([
      "/yandex_6bf433db24ce4bb4.html",
      "/yandex_dd55c1f59fb67af2.html",
      "/navera11c61023793bf35184978b1fed89d2e.html",
    ]);
    if (searchEngineHtmlProofPaths.has(url.pathname)) {
      if (method !== "GET" && method !== "HEAD")
        return new Response("Method not allowed", {status:405, headers:{"Allow":"GET, HEAD"}});
      const assetUrl = new URL(url);
      assetUrl.pathname = url.pathname.slice(0, -".html".length);
      const proof = await env.ASSETS.fetch(new Request(assetUrl.toString(), {method:"GET"}));
      if (proof.status !== 200)
        return new Response("Verification file unavailable", {status:503, headers:{"Cache-Control":"no-store"}});
      return new Response(method === "HEAD" ? null : proof.body, {status:200, headers:{
        "Content-Type":"text/html; charset=UTF-8",
        "Cache-Control":"public, max-age=300",
        "X-Robots-Tag":"noindex",
        "X-Content-Type-Options":"nosniff",
      }});
    }
    // Permanent alias for the widely submitted /sitemap.xml URL. The
    // generated /sitemap-index.xml remains the sole authoritative index; this
    // redirect automatically includes future multi-file sitemap growth.
    if(url.pathname==="/sitemap.xml"){
      if(method!=="GET"&&method!=="HEAD")
        return new Response("Method not allowed",{status:405,headers:{"Allow":"GET, HEAD"}});
      return new Response(null,{status:308,headers:{
        "Location":new URL("/sitemap-index.xml",url.origin).toString(),
        "Cache-Control":"public, max-age=86400"
      }});
    }
    if(url.pathname.startsWith("/images/tractors/")){
      if(method!=="GET"&&method!=="HEAD")return new Response("Method not allowed",{status:405});
      // Only the fixed approved-photo allowlist can be fetched. No arbitrary URL input.
      const upstream=resolveApprovedPhotoSource(url.pathname);
      if(!upstream)return new Response("Photo not found",{status:404});
      if (url.pathname.endsWith("-480.jpg")) {
        const thumbnail = await env.ASSETS.fetch(request);
        if (thumbnail.ok && thumbnail.headers.get("Content-Type")?.startsWith("image/jpeg")) return thumbnail;
      }
      // Commons thumbnails can be temporarily unavailable at 1920px even
      // when the same, approved image is available at 960px. Never redirect
      // to an unreviewed image or another model; the fallback goes through
      // the exact same fixed photo-ID / resolution allowlist.
      const isFullSize=url.pathname.endsWith("-1920.jpg");
      const loadPhoto=async(source,timeoutMs)=>{
        try{
          const origin=await fetch(source,{
            method:"GET",redirect:"follow",signal:AbortSignal.timeout(timeoutMs),
            headers:{"User-Agent":"TractorVS image gallery (+https://tractorvs.com/)"},
            cf:{cacheEverything:true,cacheTtl:604800}
          });
          return origin.ok &&
            (origin.headers.get("content-type")||"").toLowerCase().startsWith("image/jpeg")
              ? origin : null;
        }catch{return null;}
      };
      let source=await loadPhoto(upstream,isFullSize?12000:20000);
      let isFallback=false;
      if(!source&&isFullSize){
        // The only alternative is the 960px version of this *same*
        // vetted Commons file. Re-check the allowlist instead of editing
        // the external URL or guessing another model photo.
        const fallbackPath=url.pathname.replace(/-1920\.jpg$/,"-960.jpg");
        const fallback=resolveApprovedPhotoSource(fallbackPath);
        if(fallback){
          source=await loadPhoto(fallback,12000);
          isFallback=Boolean(source);
        }
      }
      if(!source)
        return new Response("Photo source unavailable",{status:502,headers:{"Cache-Control":"no-store"}});
      return new Response(method==="HEAD"?null:source.body,{
        status:200,headers:{
          "Content-Type":"image/jpeg",
          // A temporary 960px fallback must be retried soon rather than
          // being cached at the high-resolution URL for a whole week.
          "Cache-Control":isFallback?"public, max-age=600, s-maxage=1800"
            :"public, max-age=86400, s-maxage=604800",
          "X-Content-Type-Options":"nosniff",
          ...(isFallback?{"X-TractorVS-Image-Fallback":"960"}:{})
        }
      });
    }
    if (url.pathname === "/api/visitor-country") {
      if (method !== "GET" && method !== "HEAD") {
        return new Response("Method not allowed",{status:405});
      }
      const code = typeof request.cf?.country === "string" &&
        /^[A-Z]{2}$/.test(request.cf.country) ? request.cf.country : null;
      return new Response(method === "HEAD" ? null : JSON.stringify({country:code}),{
        headers:{"Content-Type":"application/json; charset=utf-8",
                 "Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}
      });
    }
    if (url.pathname.startsWith("/language/")) {
      if (method !== "GET" && method !== "HEAD") return new Response("Method not allowed", {status:405});
      const match = /^\/language\/([a-z-]+)\/?$/.exec(url.pathname);
      if (!match || !isLocale(match[1])) return new Response("Unknown locale", {status:404});
      return redirect(internalDestination(url, match[1]), match[1]);
    }
    // Every language URL, including the English canonical /, returns its own
    // stable static HTML for both people and crawlers. Country/User-Agent
    // detection must NOT redirect first-time visits or cloak search engines.
    // Language changes remain explicit via /language/{locale}/.
    return env.ASSETS.fetch(request);
  }
};

export { cookieLocale, internalDestination };
