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
    if(url.pathname.startsWith("/images/tractors/")){
      if(method!=="GET"&&method!=="HEAD")return new Response("Method not allowed",{status:405});
      // Only the fixed approved-photo allowlist can be fetched. No arbitrary URL input.
      const upstream=resolveApprovedPhotoSource(url.pathname);
      if(!upstream)return new Response("Photo not found",{status:404});
      try{
        const origin=await fetch(upstream,{
          method:"GET",redirect:"follow",signal:AbortSignal.timeout(20000),
          headers:{"User-Agent":"TractorVS image gallery (+https://tractorvs.com/)"},
          cf:{cacheEverything:true,cacheTtl:604800}
        });
        if(!origin.ok||!(origin.headers.get("content-type")||"").toLowerCase().startsWith("image/jpeg"))
          return new Response("Photo source unavailable",{status:502,headers:{"Cache-Control":"no-store"}});
        return new Response(method==="HEAD"?null:origin.body,{
          status:200,headers:{
            "Content-Type":"image/jpeg",
            "Cache-Control":"public, max-age=86400, s-maxage=604800",
            "X-Content-Type-Options":"nosniff"
          }
        });
      }catch{
        return new Response("Photo source unavailable",{status:502,headers:{"Cache-Control":"no-store"}});
      }
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
