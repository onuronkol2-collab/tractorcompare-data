# TractorVS — manufacturer-excerpt-gated Antonio Carraro batch release

Date: 2026-11-21
Supabase batch identifier: `20261121_ac_mach2r_8900r_tigre3800f_release_v1`
Scope: no code, RLS, auth, schema, policies or third-party image changes. These were two existing drafts, now `published`.

## Published production-data records

| Tractor | UUID | Verified and displayed public specs | Source |
| --- | --- | ---: | --- |
| Antonio Carraro MACH 2 R, **8900 R** technical-tab variant | `f0ee0c8c-53dd-417b-bdc0-0bbdc07a1177` | 17 | https://www.antoniocarraro.it/en/catalogue/mach-2-r |
| Antonio Carraro TIGRE 3800 F, Stage V | `3872ab21-af50-417c-8b98-fa5f0de71c01` | 10 | https://www.antoniocarraro.it/it/catalogo/tigre-3800-f |

The exact OEM pages were accessed as HTTP 200 and their current model-specific text checked against all promoted values. The marketing prose about **98 hp** on the MACH 2 R page is separate from the **8900 R tab's 54.6 kW / 74.2 hp at 2400 rpm**; this release is strictly tagged `8900 R`. The manufacturer does not identify the ISO/SAE test standard for that number, so only `manufacturer_engine_power_unspecified_standard` and its kW companion are visible, not an invented rated-HP field. The listed **3050 kg roll-bar** and **3200 kg cab** weights remain separate. Local road-homologation conditions were not assumed.

For TIGRE 3800 F, the **Italian manufacturer page says 1331 cc** while the **English manufacturer page says 1642 cc**:
- https://www.antoniocarraro.it/it/catalogo/tigre-3800-f
- https://www.antoniocarraro.it/en/catalogue/tigre-3800-f

The displacement and legacy English engine-description rows were **not verified for public exposure**. The reported **25.7 CV** is explicitly *metric CV / manufacturer-stated standard unspecified*, not converted silently into mechanical HP. Ten corroborated facts (three-cylinder Yanmar Stage V, 8F/4R, 1250 kg manufacturer-listed weight, 1000 kg lift capacity, up-to-six optional quick couplers and PTO synchronization among them) were released. Whether the manufacturer has a version-specific 1331/1642 cc issue remains an unresolved OEM clarification.

Both original country/market values were blanket `global`; precise region and production year are **unproven** and are now NULL rather than invented. Publication is model+variant specific, with a persistent UUID in SEO page slugs.

## Database verification

- Independently checked result after commit: **271 published, 197 draft, 10 archived**.
- Manufacturer-sourced visible specs: **17/17 MACH**, **10/10 TIGRE**, each with a unique canonical key, dated verification and excerpt.
- Draft leak count through `public.tractorvs_public_specs`: **0**.
- Legacy disputed TIGRE engine-displacement/description/power fields remain **outside** the public view. MACH is not assigned a falsely certified rated-power key.
- Private backup under `tc_backup.tractor_publication_patches` has **2 original tractor rows + 34 original specs** with batch id above. `anon` role has no SELECT access to private backups.
- No arbitrary `UPDATE WHERE status='draft'` bulk promotion, no unlicensed image addition.

## Rollback procedure for reviewed operator

In a single locked, guarded transaction, restore the original two `tractors` and 34 `tractor_specs` rows from `tc_backup.tractor_publication_patches` for this exact batch ID. Confirm no newer authoring/editing has happened before overwriting. Do not modify any other model, taxonomies or access policy. Do not run rollback without a real identified fault.

## Site publishing and SEO checkpoint

The existing `tractorvs-publication-autosync.yml` is triggered by a new tracked file under `site/docs/publication-checkpoints/` and refreshes the public-only catalog fingerprint (no service key). Its GitHub success is not itself proof of Cloudflare deployment or Google indexing. After the fingerprint/build completes, verify the two production URLs, HTTP 200, canonical, 10 locales and x-default, sitemap, mobile accessibility and photo disclosure. Search indexing is a separate Search Console measurement, not a guarantee.
