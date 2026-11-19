# TractorVS: safe bulk tractor publishing readiness

**Status:** executable READ-ONLY preflight prepared; no current Supabase credentials
or direct connection in the GitHub-only execution context. Running a GitHub
workflow does not grant access to unpublished Supabase records.

## 1 — One read-only inventory, no hundreds of manual queries

Use `supabase/verification/20261119_tractorvs_batch_publication_preflight.sql`
only in the owner's authenticated database connection. It returns (A) actual
status counts, (B) non-archived exact identity conflicts, (C) the entire current
**draft** identity/evidence review table, (D) draft leakage count, and (E) RLS
settings. No model is marked publication approved just by a count. The output
contains unpublished model identities: **never commit it publicly**.

A candidate cannot progress unless the exact brand, model, market, model year,
variant/trim and manufacturer evidence refer to **the same tractor**. Source
URL, excerpt and verification timestamp are useful evidence but are not proof
of authenticity or equipment match by themselves. Measurement standards,
engine/PTO/max/nominal power, rated RPM, pump vs. outlet hydraulic flow, and
differences between brochure revisions must be checked as separate values.
Publication is possible without a photo if the detail page carries the site's
explicit missing-photo disclosure; no substitute model image is allowed.

## 2 — Promotion (only after real database review)

The public site is built from the invoker-security
`public.tractorvs_public_specs` view, not from generic open Supabase tables.
Verify `supabase/verification/verify_tractorvs_public_catalog_view.sql` first:
RLS on the four source tables, anon/authenticated grants scoped, zero
non-published records, published-only source links.

Move only **confirmed specific UUIDs** from `draft` to `published` in a
single transaction *after* checking that the state and evidence have not
changed; retain all other drafts and preserve original source records. Do not
run an `UPDATE ... WHERE status='draft'` bulk promotion or blindly publish
`review_priority` candidates. Rebuild/redeploy the **static** Cloudflare
Workers site after each accepted batch; a Supabase status update alone does
not create a public page. Check the new model URL, canonical, 10 locale pages,
sitemap, image licensing and responsive behavior. Then perform Google Search
Console URL inspection; discovered URLs are not necessarily indexed.

## 3 — Why this cannot silently finish now

Supabase is not connected to the assistant's current app tools. GitHub access
can edit application code, tests and research workflows but cannot safely read
current Supabase private drafts or issue transactional Postgres commands.
The historical 405-model photo ZIP is a snapshot, **not** the live draft list.
Do not put a service-role key into GitHub, Cloudflare client assets, a public
CSV, the conversation or a GitHub issue. A user's optional Supabase connector
can grant scoped access after they explicitly connect it.

## 4 — Provenance and criteria

- Identity unique across brand, model, variant, market and year; no active duplicate
- Manufacturer original source and exact target variant, with trustworthy excerpt
- At least one meaningful group of technical facts; missing fields labeled unknown
- Conflicting manufacturer specifications not silently reconciled
- Original manufacturer URLs and test reports distinct from third-party assertions
- Published model never includes draft-only research metadata or private comments
- Image requires matching file-level rights AND visual model/trim verification
- Actual Cloudflare deployment, image URL and sitemap verified; SEO indexing
  checked by Search Console when connected

Progress in this file is deliberately conservative; it is not a claim that the
Supabase read-only report or any UPDATE was executed.
