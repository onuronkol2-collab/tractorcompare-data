# TractorVS — production bulk evidence release 2026-11-20

## Purpose

Consolidated verification and deployment checkpoint for one source-family batch publication cycle. All 13 tractor models below were promoted to `published` in Supabase project `aaufxtcvnzgavtlintiv` via three guarded UUID-scoped atomic transactions, AFTER inspecting manufacturer-authored technical tables and comparing the existing 603 spec rows by model. This is not a claim that Google Search has indexed the pages.

Postflight database snapshot: **95 published, 365 draft, 2 archived**, 95 unique models exposed by the `tractorvs_public_specs` view (2,855 rows). The public-site pages and sitemap must be separately regenerated and verified following merge and Cloudflare production build.

## Provenance families

| Models | Number | Verified specs | Specific manufacturer source |
| --- | ---: | ---: | --- |
| Landini 2-045 / 2-050 / 2-060 | 3 | 159 (53 each) | https://www.landini.it/wp-content/uploads/2017/11/flipbook-serie-2-ita-2017-cpy-2.pdf |
| STEYR 6170 / 6180 / 6200 IMPULS | 3 | 153 (51 each) | https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/7eeca058f2bd4fe6892c36fcb39769a1?v=ebff5e26 |
| SAME DORADO NATURAL 50 / 65 / 75 / 85 / 80.4 / 90.4 / 100.4 | 7 | 291 | https://www.same-tractors.com/media/308.8192.3.1-0_Dorado_Natural_EN_1.pdf |

## Exact data and variant controls

- Landini: Italian Serie 2 brochure **07/2017**, `2-045`, `2-050`, `2-060` **model columns**; separate STD vs GE dimensions, Yanmar motor variants, 12F/12R base vs optional 16F/16R, and ISO CV/kW outputs.
- STEYR: official IMPULS brochure marked **01/2026**; `6170`, `6180`, `6200` model-specific ECE R120 rated and max power (170/192, 180/211, 200/226 CV respectively). The range-wide advertised `225 CV` is stored as an explicitly **rounded series marketing claim**, never as the model's own maximum. PTO, 150/170 L/min hydraulic configurations and front suspension options must not be flattened into a single undisputed standard.
- SAME: official DORADO NATURAL English brochure **10/2019**, Stage IIIA, seven separate model columns. `50` has 15F/15R while others 30F/15R. `90.4` and `100.4` list 4WD-only figures; the other specified configurations distinguish 2WD and 4WD. During publication, 7 originally misleading `Optional platform` claims were corrected to `Silent-Block mounted platform`, 7 universal-standard 4WD claims clarified as available configurations, and 5 2WD claims clarified as model-specific configurations.

All existing source URLs and original technical rows were retained. `verified_at` was assigned to manufacturer-linked rows only after comparing original official documents and exact model-specific table columns, with guarded transaction row counts; no open-ended `UPDATE tractors SET status='published'`.

## Ongoing free-first workflow and limits

The owner's primary publishing automation remains the connected **hourly** ChatGPT/Supabase evidence-first bulk verifier. Each run must progress through multiple manufacturer documentation families without revisiting already published models, and use direct producer pages, official PDFs and credible independent sources before generating another paid AI call. Image research runs daily, and photos are not published unless both licensing and exact model identity are verified.

GitHub `TractorVS free-first research watchdog` checks queue/auth/quota every 30 minutes **read-only** by default. Scheduled and push-triggered runs **do not dispatch paid Gemini calls**. A human may explicitly opt into a bounded `workflow_dispatch` fallback with `dry_run=false`, subject to the existing 6-run UTC daily / 24-run monthly ceiling; there is no automatic unlimited paid loop.

Do not confuse an action-run success with a source-verified model publication or a production deployment. Inspect the production Cloudflare build status, `https://tractorvs.com/tractors/`, one model route and the sitemap after this change. Future published models should be associated with their own source family and dates.
