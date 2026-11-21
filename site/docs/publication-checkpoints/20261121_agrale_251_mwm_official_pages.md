# TractorVS • Agrale 6185 and 7215: independently manufacturer-verified release

**Date:** 21 November 2026. **Live database checkpoint:** 251 published, 217 draft, 10 archived models; 6,337 manufacturer/independent source-gated public specs.

## One atomic production transaction
- Original backup batch: `20261121_agrale_6185_7215_official_heads_v1`.
- **47 original rows** captured in private `tc_backup.tractor_publication_patches` BEFORE any update: two original draft tractors and all 45 stored technical rows.
- Two existing Agrale drafts published, with **16 total visible technical fields** (6185: 9; 7215: 7). The remaining **29 independent-only rows** remain stored but UNVERIFIED, and therefore do not appear as evidence-verified public specs.
- Previous checkpoint 249 published / 6321 public specs; new checkpoint 251 published / 6337.

### Manufacturer identity and interpretation
| Exact tractor UUID | Scope and manufacturer URL | Public verified fields | Important limitations |
|---|---|---:|---|
| `6294988c-26de-4180-9b37-ac75f32b9ab3` | **Agrale 6185**, Brazil, MWM 229-6 TCE, 6200 cm³, factory cab. https://www.agrale.com.br/pt/detalhes/tratores/tratores-agricolas/trator-6185 | **9** | Producer lists 175 **cv**, engine torque maximum **72 kgf·m** at 1300–1500 rpm; partial-synchronised mechanical 24F×12R. Source web page does **not** specify model year or precise standard for cv measurement. Old independent 706 Nm torque and 2300 rpm rated-speed rows remain unverified, rather than invented as OEM facts. |
| `5d2edc98-24ce-4d19-a1c7-e51aa0b96414` | **Agrale 7215**, Brazil MWM Maxx Force 6.0A, inline six-cylinder, https://www.agrale.com.br/pt/detalhes/tratores/tratores-agricolas/trator-7215 | **7** | Manufacturer exact page: 220 cv (a manufacturer figure, not same as archived model 215 advertising or an Argentinian Perkins trim); quoted **74.4 kgf·m (730 Nm)** at 1350–1650 rpm; synchronised manual transmission. Independent catalog 12F×4R and many other hydraulic/PTO/weight figures remain unverified unless exact edition confirmed. |

### Evidence flow
- 6185 had six manufacturer-linked supported fields in original database (factory cabin, cylinders, displacement, MWM maker/model, torque RPM). **Three** previously unverified independent fields — `engine_power_cv=175`, `transmission_type=Partially synchronized manual`, `transmission_gear_configuration=24F+12R` — were corroborated directly by this exact original manufacturer product page. Their `source_id` was updated to the manufacturer source and their original independent record and provenance retained in private snapshots.
- 7215 had six direct manufacturer-backed fields (cylinders/maker/model, 220cv, 730Nm, torque speed band). **One** independent `transmission_type=Synchronized manual` was directly corroborated by the producer page and rebound to the manufacturer URL after backed-up original.
- Total exactly **12 original manufacturer rows + 4 independently cross-checked and relinked original rows =16**. No raw unrelated third-party specs or source values fabricated, no mass/torque conversions performed.
- Exact manufacturer documents are Brazilian manufacturer versions; model year, tested SAE/ISO equivalence of `cv`, drivetrain, and optional trims not proven by the HTML. `tractors.horsepower=NULL, drivetrain=NULL, model_year=NULL` intentionally.
- Manufacturer full model may have historical data-sheet versions. **Agrale 540 XT is NOT covered** and remains draft due two conflicting OEM editions; do not merge.
- No new photo rights or imagery were claimed; no RLS/GRANT/Auth/forum changes. Public `tractorvs_public_specs` retains `security_invoker=true,security_barrier=true`, `anon` cannot SELECT private `tractorvs_image_candidates`.

## Delivery / rollback
Upon approved PR merge, existing `site/docs/publication-checkpoints/**` trusted-main zero-paid, anon-only catalog sync should update GitHub from previous **249/6321** to **251/6337** and Git-connected Cloudflare should rebuild. Independently verify **251 links per locale**, 2510 model pages, sitemap **2590** URLs only once the live production SEO job confirms numbers. Neither sitemap nor its count is actual Google indexed-page coverage; check GSC Page Indexing/URL Inspection separately.

Manual rollback must review downstream forum, tractor URL, index and comparison references; use exact private JSONB original snapshots and before-state guards. This PR contains *only* documentation and a read-only audit SQL, not executable destructive recovery.

**Round total so far:** initial 237 published /6180 specs; current **251/6337**: +14 models and +157 evidence-backed specs, **218 original snapshots** across Mahindra NOVO 101 + first Agrale 24 + Antonio 46 + this Agrale 47. 217 drafts remain.

Independent audit `supabase/verification/20261121_agrale_251_6185_7215_audit.sql`.
