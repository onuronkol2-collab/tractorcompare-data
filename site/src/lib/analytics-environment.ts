// Never load production measurement IDs on preview hosts or authentication payloads.
// Loopback remains an inert, inspectable fixture for offline Playwright.
export type AnalyticsEnvironment = "production" | "local-fixture" | "off";
const AUTH_KEYS = new Set(["access_token", "refresh_token", "provider_token", "provider_refresh_token", "token_hash", "code", "error_code", "error_description"]);
export function analyticsEnvironment(href: string): AnalyticsEnvironment {
  let url: URL;
  try { url = new URL(href); } catch { return "off"; }
  if (url.username || url.password) return "off";
  for (const params of [url.searchParams, new URLSearchParams(url.hash.slice(1))]) {
    for (const key of params.keys()) if (AUTH_KEYS.has(key.toLowerCase())) return "off";
  }
  if (url.origin === "https://tractorvs.com") return "production";
  if ((url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]")) return "local-fixture";
  return "off";
}
// Do not treat a Google account sign-in round trip as a new acquisition source.
// Do not suppress Google Search, AI referrals, or unrelated GitHub links.
export function isGoogleAccountReferral(referrer: string): boolean {
  try {
    const url = new URL(referrer);
    return !url.username && !url.password && url.origin === "https://accounts.google.com";
  } catch { return false; }
}
