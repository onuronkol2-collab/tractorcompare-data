# TractorNexus — bilingual website

A bilingual Astro website scaffold in an isolated `site/` directory. The existing Supabase research pipeline, SQL snapshots, Edge Functions and tractor research data are kept separate and untouched by this frontend.

## Current state

- English landing page at `/`
- Turkish landing page at `/tr/`
- Responsive, modern and technical visual system
- Search-engine metadata and language alternates are prepared
- Indexing is disabled by default for safe previews
- Sitemap generation is enabled only after a production domain and indexing flag are configured
- Cloudflare Workers Static Assets deployment configuration is included
- The selected project brand is **TractorNexus**
- Domain registration availability and trademark clearance are not yet confirmed

## Requirements

- Node.js 22.23.4 or newer
- npm
- A Cloudflare account for deployment

## Local development

From this directory:

```bash
npm install
npm run dev
```

Open the local Astro URL shown in the terminal. The English page is at `/`; the Turkish page is at `/tr/`.

## Build and preview

```bash
npm run build
npm run preview
```

The preview script builds the site before starting Wrangler.

## Production SEO configuration

After registering the final domain, set these environment variables in the Cloudflare build configuration:

- `SITE_URL=https://YOUR-FINAL-DOMAIN`
- `PUBLIC_INDEXING_ENABLED=true`

Without both values, the generated `robots.txt` disallows crawling, canonical URLs and language alternates are omitted, and sitemap generation remains off. This is deliberate so preview URLs and an unapproved domain are not indexed.

## Cloudflare deployment

The Worker is configured to serve the static output in `dist/` using Workers Static Assets.

```bash
npm run deploy
```

For an initial safe preview, use the Cloudflare preview URL and keep `PUBLIC_INDEXING_ENABLED=false`. Connect the repository to Cloudflare Workers Builds only after the production domain and indexing settings are approved.

## Brand

The project owner's selected public brand is **TractorNexus**. The same spelling is used in the Turkish and English experiences. Before launch, confirm the desired domain is available at the registrar and complete trademark clearance in the intended markets.

## Next implementation steps

1. Verify the preferred domain and complete trademark checks before registration.
2. Verify the Supabase public read schema and row-level security before adding client-side data access.
3. Connect catalogue and comparison routes to existing reviewed tractor/specification data.
4. Add indexable model pages with source references and accurate canonical URLs.
5. Complete the sitemap, structured data, privacy policy and contact details before production launch.

No production deployment or live Supabase connection is configured by this scaffold.