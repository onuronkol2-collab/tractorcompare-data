# TractorMetric — website starter

A bilingual Astro website scaffold, stored in this repository without changing the existing Supabase research pipeline or database files.

## Current state

- English landing page at `/`
- Turkish landing page at `/tr/`
- Responsive, modern and technical visual system
- Search-engine metadata and language alternates are prepared
- Indexing is disabled by default for safe previews
- Sitemap generation is enabled only after the production domain and indexing flag are configured
- Cloudflare Workers Static Assets deployment configuration is included
- The user-selected brand is TractorMetric; domain and trademark clearance remain outstanding

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

After the final domain is registered, set these environment variables in the Cloudflare build configuration:

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

The current visible identity is `TractorMetric`, selected by the project owner. Before launch, verify domain availability and conduct trademark clearance in the relevant markets. Update `src/config/brand.ts` only if the approved brand changes.

## Next implementation steps

1. Confirm the final brand and register the domain.
2. Verify the Supabase public read schema and row-level security before adding client-side data access.
3. Connect catalogue and comparison routes to existing reviewed tractor/specification data.
4. Add indexable model pages with source references and accurate canonical URLs.
5. Complete the sitemap, structured data, privacy policy and contact details before production launch.
