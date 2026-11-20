import type { APIRoute } from "astro";

export const prerender = true;

// The Astro site URL is configured from SITE_URL in astro.config.mjs.
// Read it from APIContext.site rather than import.meta.env.SITE_URL:
// unprefixed custom variables are not necessarily exposed via Vite import.meta.env.
export const GET: APIRoute = ({ site }) => {
  const siteUrl = site?.toString();
  const canIndex =
    import.meta.env.PUBLIC_INDEXING_ENABLED === "true" &&
    typeof siteUrl === "string" &&
    siteUrl.startsWith("https://");

  const body = canIndex
    ? `User-agent: *
Allow: /

# OAI-SearchBot may index public pages for ChatGPT Search.
User-agent: OAI-SearchBot
Allow: /

Sitemap: ${new URL("/sitemap-index.xml", siteUrl).toString()}
Sitemap: ${new URL("/image-sitemap.xml", siteUrl).toString()}
`
    : `User-agent: *
Disallow: /
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
