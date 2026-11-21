# TractorVS — Lamborghini Spire F 80 Target audited release

Date: 2026-11-21 (Europe/Istanbul)
Database batch: `20261121_lamborghini_spire_f80_target_stagev_evidence_v1`
Target UUID: `0c8f654d-3651-401c-8f7a-0e5d488e1b37`

## Database release — verified

- **Lamborghini Trattori Spire F 80 Target** (formerly ambiguous draft name `Spire F Target`) promoted to `published` in **Europe**, with the **04/2025 manufacturer brochure edition** as the document context. The actual tractor model year remains unknown; no model year was fabricated.
- 38 existing manufacturer-PDF facts verified, 15 additional manufacturer-PDF facts added, **53 distinct publicly visible source-and-quote-evidenced technical concepts**.
- **Rated engine power = 75 HP / 55.2 kW (ECE R120)**, distinct from **maximum engine power = 76 HP / 55.8 kW**. Original unsourced top-level horsepower `80` cleared because it was a model designation/marketing value and not the 75 HP rated result.
- Front lift/PTO, fuel tank, double hydraulic pump, Powershift transmission, front axle suspension and cab equipment options labelled as configuration-dependent; exact unsupported base-equipment claims not fabricated.
- **Disputed overall height withheld:** manufacturer PDF endpoints report **2396 vs 2398 mm** for otherwise similarly labelled F 80 Target technical tables. The existing `overall_height` row remains with `verified_at IS NULL` and is not exposed by `tractorvs_public_specs`. Manufacturer PDF and publication details require follow-up before this dimension is released.
- Official technical source attached to all visible rows:
  `https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7987_d432d453ca77b6271f17857f0d842cd0`
- Cross-checking technical PDF edition showing 2396 mm:
  `https://www.lamborghini-tractors.com/en-eu/all/download/7988_b274e15de8fa324d508dde300f1d3fc8`

## Preflight, rollback, final verification

- Two earlier transaction attempts failed closed without committing: one SQL UUID aggregate incompatibility, and one missing `status='published'` assignment detected by the public-view assertion. Both rolled back atomically.
- Original database state saved privately under `tc_backup.tractor_publication_patches`: **1 original tractor row, 39 original specifications**. The subsequent 15 newly created specification IDs are separately marked `__created_in_batch=true`, making reversal possible by exact IDs; no destructive bulk update and no RLS changes.
- Read-only postflight: `269 published / 199 draft / 10 archived`, **53/53 public sourced specs**, zero draft leak, quarantined conflicting dimension, backup not available to `anon`.
- To undo after independent review: remove only 15 rows having `__created_in_batch=true` for this batch; restore original 39 specs and tractor row from private saved JSON using exact UUIDs in a guarded transaction. **No rollback executed**.
- This Git checkpoint triggers the existing free public-catalog fingerprint workflow. Successful GitHub CI or committed snapshot is not automatically proof of Cloudflare deployment or Google indexing. Production URLs/canonical/hreflang/site map must be separately verified.

## Remaining draft review priorities

- Swaraj 735 XT 4WD official description conflicts with embedded 2WD table; manufacturer specs are version/variant-dependent.
- Swaraj 843 XM older producer brochure conflicts with current page on power bracket, lift, dimensions and service interval.
- Agrale 540 XT and Deutz-Fahr 5090 D remain held on manufacturer revisions and model generation conflicts.
- Sonalika GT 22 4WD official page's variant table labels a 2WD entry; ensure exact 4WD technical mapping before release.
