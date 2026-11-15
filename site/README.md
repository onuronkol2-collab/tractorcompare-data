# TractorVS — bilingual website

A bilingual Astro website in an isolated \`site/\` directory. The existing Supabase research pipeline, SQL snapshots, Edge Functions and AI research data remain separate from the frontend.

## Current state

- English landing page at \`/\` and Turkish landing page at \`/tr/\`
- English public tractor catalogue at \`/tractors/\` and Turkish catalogue at \`/tr/tractors/\`
- Build-time static model detail pages in both languages for records returned by the restricted public Supabase view
- Source links, evidence excerpts and technical specification grouping on model pages
- Catalogue search on the pre-rendered model list
- Responsive, modern and technical visual system
- Search-engine metadata, canonical URLs and language alternates
- Indexing disabled by default for safe previews
- Cloudflare Workers Static Assets deployment configuration
- Selected public brand: **TractorVS**

## Requirements

- Node.js 22.23.4 or newer
- npm
- A Cloudflare account for deployment

## Local development

From this directory:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

Without both \`SUPABASE_URL\` and \`SUPABASE_ANON_KEY\`, the site builds safely and shows an explicit catalogue-connection notice. It does not display sample or invented tractor records.

## Public catalogue connection

The production build reads only the restricted \`public.tractorvs_public_specs\` view, using a public/anon key and existing Supabase row-level security for the underlying published model/spec tables. The view returns only published tractor models, selected technical fields, evidence excerpts and source URL metadata. It does not expose draft models, AI findings, research documents, queue data, source notes or admin metadata.

Before configuring Cloudflare build variables:

1. Review and run \`supabase/migrations/20261115000400_tractorvs_public_catalog_view.sql\` in Supabase SQL Editor.
2. Run \`supabase/verification/verify_tractorvs_public_catalog_view.sql\` and inspect the results.
3. In Cloudflare Workers Builds, add \`SUPABASE_URL\` and \`SUPABASE_ANON_KEY\` as build variables. Use only the public anon/publishable key.
4. Never add service-role, secret, database or Gemini keys to website build variables.

The catalogue is generated at build time. After a published tractor or specification is added or changed, trigger a new website deployment to refresh the static pages.

## Production SEO

After registering and connecting the final domain, set:

- \`SITE_URL=https://YOUR-FINAL-DOMAIN\`
- \`PUBLIC_INDEXING_ENABLED=true\`

Only enable indexing after the public model pages, domain, canonical URLs, language alternates and source links have been reviewed.

## Deployment

The Worker serves Astro's static output in \`dist/\` using Workers Static Assets.

\`\`\`bash
npm run deploy
\`\`\`

No production custom domain is assumed by this scaffold. Domain registration availability and trademark clearance must be confirmed separately.

## Existing systems

The website-only changes must not modify or deploy the existing AI Edge Functions, research pipeline, review dashboard or historical SQL snapshots. The separate v22.8 AI review PR remains independent and is not part of the public website deployment.
