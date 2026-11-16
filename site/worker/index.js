import { isLocale, localizedPath, preferredLocale, unlocalizedPath } from "../src/lib/locales.ts";

const cookieName = "tractorvs_locale";
const oneYear = 60 * 60 * 24 * 365;
const botPattern = /(?:googlebot|bingbot|duckduckbot|baiduspider|yandexbot|slurp|crawler|spider|facebookexternalhit|twitterbot|linkedinbot)/i;

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
    if (url.pathname.startsWith("/language/")) {
      if (method !== "GET" && method !== "HEAD") return new Response("Method not allowed", {status:405});
      const match = /^\/language\/([a-z-]+)\/?$/.exec(url.pathname);
      if (!match || !isLocale(match[1])) return new Response("Unknown locale", {status:404});
      return redirect(internalDestination(url, match[1]), match[1]);
    }
    if (url.pathname !== "/" || method !== "GET") {
      return env.ASSETS.fetch(request);
    }

    // All language URLs remain publicly accessible without geolocation redirects.
    // Do not redirect crawlers: Google recommends crawlable, stable URLs.
    const accept = request.headers.get("accept") || "";
    const mode = request.headers.get("sec-fetch-mode");
    if (!accept.includes("text/html") ||
        (mode && mode !== "navigate") ||
        botPattern.test(request.headers.get("user-agent") || "")) {
      return env.ASSETS.fetch(request);
    }
    const chosen = cookieLocale(request) ||
      preferredLocale(request.cf?.country, request.headers.get("accept-language") || "");
    if (chosen === "en") return env.ASSETS.fetch(request);
    return redirect(localizedPath(chosen, "/") + url.search);
  }
};

export { cookieLocale, internalDestination };
