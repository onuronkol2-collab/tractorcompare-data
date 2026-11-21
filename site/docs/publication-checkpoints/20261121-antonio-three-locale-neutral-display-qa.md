# TractorVS — three Antonio Carraro public profiles: locale-neutral metadata QA

Date: 2026-11-21
Private batch: `20261121_ac_three_public_display_qa_v1`
Change scope: exactly three **already published** model variants and three **already verified** public source excerpts.

## Why these display corrections were required

Technical-record provenance notes such as "manufacturer technical tab" and "Italian manufacturer technical box" were incorrectly included in the public `tractors.variant` string. They are **research metadata**, not model trims, and appear unlocalized in ten languages.

The actual public variants are now short and locale-neutral:
- Antonio Carraro MACH 2 R: `8900 R · Stage V` (the exact technical-tab trim, not the page's generic 98-hp brochure narrative)
- Antonio Carraro TIGRE 3800: `Stage V` (distinct model name, no F suffix)
- Antonio Carraro TIGRE 3800 F: `Stage V` (separate F model)

All three retain `model_year=NULL` and `market=NULL` because no supported exact year or sales region was proven.

## Source quote discrepancy cleanup

The official English TIGRE 3800 F manufacturer page states **1642 cc**, while the Italian page states **1331 cc**. Neither is published as a verified `engine_displacement_cc` fact. To avoid incidentally exposing the disputed number as part of unrelated source quotations, three verified excerpts for engine make/cylinders/emission were narrowed to exact **literal substrings** of the Italian primary source:
- `engine_cylinders`, `engine_manufacturer`: `Motore: YANMAR - 3 Cilindri`
- `engine_emission_stage`: `STAGE 5`

The excerpt shortening does not alter their supported technical values. Verified 10 TIGRE F public specs remain distinct, with no source excerpt containing the disputed engine displacement.

## Guarded private backups and verification

Before updates, exactly **3 original tractor rows + 3 source-backed spec rows** were snapshotted to `tc_backup.tractor_publication_patches` under this batch. Changes were applied in an atomic, identity- and prior-state-guarded transaction. The taxonomy trigger's derived canonical keys were restored explicitly.

Rechecked source-backed public specs after commit:
- MACH 2 R **17** (unique 17)
- TIGRE 3800 **15** (unique 15)
- TIGRE 3800 F **10** (unique 10)
- Draft content exposure through `tractorvs_public_specs`: **0**.

The earlier publication backups are independent:
- `20261121_ac_mach2r_8900r_tigre3800f_release_v1`
- `20261121_ac_tigre3800_nonf_evidence_v1`

Rollback requires restoring only the six original rows of this QA batch from private exact UUID snapshots, after checking for subsequent edits. No rollback action executed.

## Website deployment and search verification

This new checkpoint triggers the existing GitHub `TractorVS zero-paid published catalog sync` job to rebuild public static pages. GitHub CI and successful catalog fingerprint do not independently establish live Cloudflare HTTP 200, hreflang correctness, sitemap listing, accessibility or Google indexing; those must be verified separately.
