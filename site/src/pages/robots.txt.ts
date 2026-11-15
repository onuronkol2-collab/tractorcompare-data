import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = () => {
  const siteUrl = import.meta.env.SITE_URL;
  const canIndex =
    import.meta.env.PUBLIC_INDEXING_ENABLED === "true" &&
    typeof siteUrl === "string" &&
    siteUrl.startsWith("https://");

  const body = canIndex
    ? `User-agent: *
Allow: /

Sitemap: ${new URL("/sitemap-index.xml", siteUrl).toString()}
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