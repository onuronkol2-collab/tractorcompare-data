# TractorVS — bilingual website

A bilingual Astro website in an isolated `site/` directory. The existing Supabase research pipeline, SQL snapshots, Edge Functions and AI research data remain separate from the frontend.

## Current state

- English landing page at `/` and Turkish landing page at `/tr/`
- English public tractor catalogue at `/tractors/` and Turkish catalogue at `/tr/tractors/`
- Static, crawlable model detail pages generated in both languages from the restricted public Supabase view
- Source links, evidence excerpts and grouped technical specifications on model pages
- Search across the generated catalogue
- Responsive, modern and technical visual system
- Canonical URLs and language alternates are prepared
- Search indexing is disabled by default for safe previews
- Cloudflare Workers Static Assets deployment configuration
- Selected public brand: **TractorVS**

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

## Build

```bash
npm run build
```

Without the Supabase build variables, the site builds safely and shows an explicit catalogue-connection notice. It does not display sample or invented tractor records.

## Public catalogue connection

The production build reads only the restricted `public.tractorvs_public_specs` view. The view uses invoker security and the base tables' RLS policies. It returns only published tractor models, selected technical fields, evidence excerpts and source URL metadata. It excludes draft models, AI findings, research documents, queue data, source notes and admin metadata.

Before configuring Cloudflare build variables:

1. Review and run `supabase/migrations/20261115000400_tractorvs_public_catalog_view.sql` in Supabase SQL Editor.
2. Run `supabase/verification/verify_tractorvs_public_catalog_view.sql` and inspect the results. The view must use invoker security and non-published rows exposed must equal zero.
3. In Cloudflare Workers Builds, add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as build variables. A legacy `SUPABASE_ANON_KEY` is supported as an alternative.
4. Use a publishable/anon key only. Never add a secret, service-role, database or Gemini key to website build variables.

The catalogue and model pages are generated at build time. After a published tractor or specification is added or changed, trigger a new website deployment to refresh the static pages. The public key is used only during the build and is not included in the generated pages.

## Production SEO

After registering and connecting the final domain, set:

- `SITE_URL=https://YOUR-FINAL-DOMAIN`
- `PUBLIC_INDEXING_ENABLED=true`

Only enable indexing after the public model pages, domain, canonical URLs, language alternates and source links have been reviewed.

## Deployment

The Worker serves Astro's static output in `dist/` using Workers Static Assets.

```bash
npm run deploy
```

No production custom domain is assumed by this scaffold. Domain registration availability and trademark clearance must be confirmed separately.

## Existing systems

The website-only changes do not modify or deploy the existing AI Edge Functions, research pipeline or review dashboard. The separate v22.8 AI review PR remains independent and is not part of the public website deployment.
