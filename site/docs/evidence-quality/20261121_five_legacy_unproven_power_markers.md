# TractorVS — unsupported old verified markers safely quarantined (21 Nov 2026)

## Why this is a separate quality action
Read-only QA of **221 published tractors** found **five legacy spec rows with non-null `verified_at` but empty `evidence_text`**. All five were **already excluded** by the public evidence gate `public.tractorvs_public_specs`. A `verified_at` marker without model-matched cited evidence violates project publication policy, regardless of a general catalogue source association.

A guarded transaction backed up the exact five original rows in private `tc_backup.tractor_publication_patches` batch **`20261121_legacy_5_missing_evidence_quarantine_v1`** before setting `verified_at=NULL`, `last_verified_at=NULL` and adding a non-public `measurement_standard` review note. **No DELETE**, public RLS or publication status change. All original values and source links remain in source rows and snapshots, for future exact-model verification.

| OEM model | Legacy field | Exact value | Why quarantine |
|---|---|---|---|
| Iseki T97 Series | `engine_power_range` | 97 HP | Generic Iseki global tractor range `https://www.iseki.co.jp/global/english/products/tractor/`, no model-specific evidence in this row |
| Mahindra OJA 2124 | `engine_power_range` | 21–35 HP | Broad catalogue *range*, not an exact 2124 engine rating, missing evidence text |
| Mahindra OJA 2127 | `engine_power_range` | 21–35 HP | Same broad marketing band applied to a different exact model |
| Mahindra OJA 2130 | `engine_power_range` | 21–35 HP | Same broad range, no exact-model test standard |
| TAFE 7515 GE 4WD | `engine_power` | 74 HP | General products page `https://www.tafetractors.com/tr-tr/products` lacks an extracted model-specific citation for this row |

**Checks:** 
- Before and after: **221 published models, 5,997 source/evidence-gated visible public specs**. No model, slug, canonical, media or sitemap changes.
- Backup count **5/5**; quarantined `verified_at IS NULL` **5/5**; table remains RLS-protected; public view still invoker/barrier-safe.
- Do not convert product catalogue ranges or model numbers to exact rated horsepower. If manufacturer test/technical document later proves a value and its power standard, attach model- and variant-specific quote, unit and evidence before re-verifying it.
- Additional duplicated `canonical_key` rows in old published models were **not** bulk-deleted: distinct units, documents, operating conditions or spec revisions require individual review.

Independent read-only SQL: `supabase/verification/20261121_legacy_five_power_quarantine_audit.sql`.
