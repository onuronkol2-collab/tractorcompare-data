# TractorVS — ten-language website

A multilingual Astro website in an isolated `site/` directory. The existing Supabase research pipeline, SQL snapshots, Edge Functions and AI research data remain separate from the frontend.

## Current state

- Existing English landing page at `/` and Turkish landing page at `/tr/` remain unchanged.
- Additional locale prefixes: `/zh/`, `/hi/`, `/pt-br/`, `/fr/`, `/de/`, `/ru/`, `/ja/`, `/es/`
- English catalogue at `/tractors/`, Turkish at `/tr/tractors/` and all other catalogues at `/<locale>/tractors/`
- Static, crawlable model detail pages generated in ten languages from the restricted public Supabase view
- Grouped technical specifications; only evidence-backed original manufacturer links displayed (third-party references remain in the database)
- Search across the generated catalogue
- Responsive, modern and technical visual system
- Reciprocal canonical/`hreflang` references prepared for all ten languages when indexing is explicitly enabled
- Search indexing is disabled by default for safe previews
- Cloudflare Workers Static Assets deployment with an edge Worker for root-only country localization and a persistent manual language preference
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

## Country language on first visit (Cloudflare Workers)

- Root `/` is English for bots and users who prefer English. Human navigations to `/` may receive a **302** to the preferred locale chosen from Cloudflare's `request.cf.country` signal, with `Accept-Language` fallback.
- The routing applies **only to the root**. Deep links such as `/fr/tractors/<slug>/`, `/tr/compare/` and indexed locale pages remain directly accessible; no country-based redirects are applied to those.
- Supported country mappings cover Turkey, India, China, Brazil, France, Germany, Russia, Japan, Spain and English-speaking markets, with selected Spanish-speaking markets mapped to Spanish. Canada chooses French for French-language browser preference, otherwise English. Unsupported countries use compatible browser language, else English.
- The accessible language menu links via `/language/<locale>/?next=<encoded-local-page>`. The edge Worker validates same-origin paths, sets an HTTP-only, Secure, SameSite=Lax preference cookie, and redirects to the same page in the chosen language. This is **not** a tracking cookie and does not store location details.
- If geolocation is missing or inaccurate, the visitor can choose any language. Search crawlers receive the English root, and all other languages have permanent, crawlable locale URLs.
- The Worker uses `main`, `assets.binding` and `assets.run_worker_first` in **both** the repository-root and `site/` Wrangler configurations. Deploy with the updated configuration; deploying assets alone would not enable country detection.
- Server-side country detection is Cloudflare-specific; local Astro development does not reproduce Cloudflare geolocation. The `site/tests/i18n-geo.test.mjs` suite exercises the Worker behavior with explicit location mocks.

## Language data and editorial checks

- Source translations are maintained at `src/lib/ui.ts` (site-wide interface), `src/lib/home-ui.ts` (market home pages), and `src/lib/spec-i18n.ts` (technical glossary).
- Review engineering terminology and manufacturer-specific conditions before extending translations. Original model names, measured values, units, manufacturer-provided descriptions and sources stay as stored; no automatic translation API modifies Supabase data.
- Rare technical labels without a verified glossary translation preserve their original name. This is deliberate to avoid a misleading translation.
- Neither locale creation nor geo routing grants access to draft tractors. Public pages are still built only from `public.tractorvs_public_specs`.
- Keep `PUBLIC_INDEXING_ENABLED=false` until domain/canonical/translation and preview checks are approved; do not switch it on just because new locales were added.

## Verify release

From repository root:

```bash
npm install
npm run test --workspace=tractorvs-site
npm run build
npx wrangler deploy --dry-run --outdir .wrangler-dry-run
```

After deploying, verify root country selection, explicit language preference, all ten catalogues, direct model links, comparison behavior, and canonical/alternate tags when indexing is enabled. If the deployment is configured to use a custom build command, ensure the Worker still deploys with the updated root or `site/` Wrangler file.
