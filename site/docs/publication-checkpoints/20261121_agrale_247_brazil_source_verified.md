# TractorVS Agrale official Brazilian product release — 21 November 2026

## Live Supabase checkpoint
- Atomic release completed: **247 published / 221 draft / 10 archived** model records, **6289 evidence-backed public specifications**, up from 244/224/6268.
- Exactly three source-confirmed Agrale Brazilian models, **21 model-specific technical features**, 24 original before-state rows (3 tractors+21 specs) in private `tc_backup.tractor_publication_patches` with batch ID `20261121_agrale_4125_cargo_4233_official_v1`.
- This continuation round now has **+10 published models and +109 source-backed specs** (+7 Mahindra NOVO/JIVO/+88, +3 Agrale/+21), **125 protected source originals**. No RLS, GRANT, Auth, private photos, paid API or destructive rows changed.

| Exact model / UUID | OEM product URL | Technical fields | Manufacturer standard and measurement details |
|---|---|---:|---|
| **Agrale 4125** `0b53e944-0ccd-4fbd-84e8-f49ffde1a2ae` | https://www.agrale.com.br/en/detalhes/tratores/tratores-agricolas/trator-4125 | 7 | Three Agrale cylinders, **25 cv / 18.4 kW @2400rpm** (OEM *no test standard stated*); maximum **92 Nm @1600rpm** |
| **Agrale 4125 Cargo** `66781999-258a-4baa-a52b-9a4f79c8b708` | https://www.agrale.com.br/en/detalhes/tratores/tratores-agricolas/trator-4125-cargo | 7 | Three Agrale cylinders, **25 cv / 18.44 kW @2400rpm**, maximum **92.5 Nm @1600rpm**, both engine figures cite **NBR ISO 1585** specifically |
| **Agrale 4233** `e3ed3f24-a207-44cf-8b96-b33e5e92723e` | https://www.agrale.com.br/en/detalhes/tratores/tratores-agricolas/trator-4233 | 7 | Isodiametric, two Agrale cylinders, **30 cv / 22.0 kW @3000rpm** and maximum **69 Nm @2250rpm**; no OEM measurement standard claimed |

Exact producer URLs were checked in live manufacturer HTML *before* status changes. Original DB findings matched these headlines with distinct `canonical_key`, typed units, correct engine torque/power RPM and source ID. **Do not conflate 4125 with the distinct 4125 Cargo**: the NBR ISO 1585 documented on Cargo is not silently inherited by 4125 or 4233; the torque precision and kW figure are distinct. Manufacturer value in metric horsepower `cv` is **not auto-converted into a SAE/ISO mechanical HP numeric tractor header**; `tractors.horsepower=NULL`, year NULL, drivetrain NULL (model manufacturer webpage does not specify). `market='Brazil'` denotes primary local Agrale manufacturer documentation, not a claim of exclusive market.

This batch is backed up and protected by production DB guards: exact full brand/model/source URL/type, status, original model region, status, power, year, manufacturer field values, original 7 distinct canonical keys per model; 3+21 originals privately snapshotted **before** verification and publishing; postcommit expected 21 verified RLS-public specs/24 private backups enforced. No customer/forum records touched; no RLS grants altered.

**Remaining conflicts**: Agrale **540 XT** has two manufacturer PDF versions (power at 2400 vs 2200 rpm, hydraulic 36 vs 41/32 L/min etc.). It stays draft until exact generation and variant/published year established. Agrale **6185/7215** source data blends OEM and third-party providers; confirm exact engine/transmission/year standards before bulk promotion. Additional Agrale 525/575 page tool access was a web cache miss; not published without new evidence. Antonio Carraro has multiple published-family pages that should not be auto interpreted as exact individual model specs.

## Publication delivery and next verifications
Merge this reviewed `site/docs/publication-checkpoints/**` doc after all GitHub CI passes, which triggers existing trusted-main **free anon view only** public catalog sync to **247/6289**. Then verify generated Astro/Cloudflare site and sitemap on all **10 locales** with real HTTP canonical/hreflang/metadata tests. Google Search Console real indexed pages require Page Indexing/URL Inspection, not count of sitemap URLs.

The accompanying `supabase/verification/20261121_agrale_247_release_audit.sql` is deliberately READ ONLY. A real recovery must compare original JSONB snapshots with downstream SEO slugs, compare/bookmark and forum references before exact-record reversal. Never run a blind DELETE/UPDATE over the entire tractor tables.
