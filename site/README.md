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
- Cloudflare Workers Static Assets deployment with a stable canonical root, explicit language switching and optional language suggestion
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

## Google Analytics 4: explicit consent, not Google Tag Manager

- The owner's public GA4 **measurement ID** is `G-PZCNNEY1VN`; the separate
  Google tag `GTM-...` visible in Google's setup UI is **not** the GA4 stream
  measurement ID. Do not copy Google's unconditioned install snippet into HTML
  and do not install a duplicate GTM tag.
- `SiteLayout.astro` includes one `AnalyticsConsent.astro` on all ten
  locales, using localized language from `analytics-i18n.ts`.
- On a first visit the banner is optional; **neither gtag.js nor an analytics
  request is loaded until the visitor explicitly clicks Accept**. Rejection
  means no GA4 script is fetched. The choice is stored locally under
  `tractorvs_analytics_choice_v1` and can be changed using the footer
  preferences button. Revoking consent reloads the page without the Google
  Analytics script and attempts to clear known first-party `_ga` cookies.
- Privacy pages in all ten locales are at `/privacy/`, `/tr/privacy/`, etc.;
  they describe measurement, cookies, Google's processing, and revocation.
- GA4's **Realtime** report only shows accepted visits after production
  deployment (subject to browser blockers and Google's processing). An
  unconsented test visit should **not** create a GA4 event; this is deliberate.
  Existing Cloudflare request logs may still operate independently of GA4.
- Google Consent Mode advanced modeling is deliberately not enabled: no Google
  tag or consent ping is sent before affirmative consent. This opt-in
  implementation is conservative, and legal review of the site's full
  privacy/cookie disclosures may still be appropriate as requirements change.
- QA: open a private/incognito window, inspect Network for
  `googletagmanager.com` / `google-analytics.com` before accepting (none);
  click Reject (none); reopen settings, click Accept (gtag.js request), and
  revoke (request stops after reload). Check mobile, all ten locales, and
  no duplicate GA4 tags.

## Deployment

The Worker serves Astro's static output in `dist/` using Workers Static Assets.

```bash
npm run deploy
```

No production custom domain is assumed by this scaffold. Domain registration availability and trademark clearance must be confirmed separately.

## Existing systems

The website-only changes do not modify or deploy the existing AI Edge Functions, research pipeline or review dashboard. The separate v22.8 AI review PR remains independent and is not part of the public website deployment.

## Stable root, crawlable language choices and Cloudflare Worker

- The root `/` serves the **same canonical English HTML** to users and search
  engines, regardless of Cloudflare country or User-Agent; there are no
  IP-based, geolocation or crawler-specific redirects. This avoids cloaking
  and makes the English canonical page stable.
- An **optional**, dismissible browser-language suggestion appears on the
  English homepage. It never automatically redirects or changes the canonical.
- The language menu links directly to permanent localized pages. The explicit
  `/language/<locale>/?next=<encoded-path>` Worker endpoint can store a
  Secure, HttpOnly, SameSite=Lax language preference after a user chooses it;
  it validates same-origin next paths.
- All 10 language homepages, catalogues, model pages, comparison routes and
  localized tractor selection guides are real static HTML routes. The data
  methodology still has genuine EN/TR pages only and shows the English
  fallback honestly in other languages.
- The Worker serves responsive on-site image proxy paths and does not modify
  source/photograph attribution or override the restricted public catalogue.
  Unit tests cover stable root, explicit language selection and locale routes.

## Publishing additional tractors

- First run the private, read-only
  `supabase/verification/20261119_tractorvs_batch_publication_preflight.sql`
  against the actual production Supabase database. It reports draft-specific
  evidence gaps, conflicts and active identity duplicates **without publishing**.
- Confirm every proposed tractor/trim against its original manufacturer
  source, and run `supabase/verification/verify_tractorvs_public_catalog_view.sql`
  before any status change. Do not automatically publish by an evidence count,
  or publish every draft with a blanket UPDATE.
- After promoting only reviewed UUIDs, rebuild/redeploy the static Cloudflare
  Worker website. Model pages and sitemap do not appear merely because
  Supabase status changed; they are generated at **build time**.
- Verify all 10 new model URLs, canonicals, hreflang, source labels, images
  and sitemap inclusion after deployment. Real Google indexing requires
  Search Console evidence. Photo availability is not a prerequisite for a
  truthful sourced model page if it displays a clear missing-photo notice.
- Full release procedure is documented in
  `supabase/docs/TRACTORVS_BATCH_PUBLICATION_GATE.md`.

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

After deploying, verify stable canonical root for humans and crawlers, explicit language preference, all ten catalogues, direct model links, comparison behavior, and canonical/alternate tags when indexing is enabled. If the deployment is configured to use a custom build command, ensure the Worker still deploys with the updated root or `site/` Wrangler file.
