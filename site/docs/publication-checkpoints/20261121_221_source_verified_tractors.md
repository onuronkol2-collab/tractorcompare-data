# TractorVS — 221 published tractors, eight manufacturer-verified releases (21 November 2026)

**Live Supabase checkpoint, independently read back after source-backed transaction commits.**

| Metric | Before | After |
|---|---:|---:|
| Published tractor/variant records | 213 | **221** |
| Draft | 252 | **247** |
| Archived superseded drafts | 7 | **10** |
| Source-evidenced public technical specifications | 5,888 | **5,997** |
| Private original row backups for this release | — | **74** |

The model population increases from 472 to 478 because three superseded combined TYM draft families were **archived**, not deleted, and six exact trim children were inserted. No RLS/grant/Auth modifications, speculative photos, commercial image rights assertions or forum postings were made.

## Package A · Sonalika India: +2 published models, +25 evidenced public specifications
Private restore snapshots: batch `20261121_sonalika_di740iii_tigerdi50_v1`, **2 tractor + 25 source specifications = 27** original rows in `tc_backup.tractor_publication_patches`.

* **Tiger DI 50** `67d959b0-74cc-4685-950d-e0ae6d0eddb4`, India 2WD model family; **13/13** supported by the manufacturer [technical specifications](https://www.sonalika.com/tractor/tiger-di-50.html). 215 Nm maximum torque at the stated 2,000 rated engine rpm is manufacturer-described; clutch single/dual/independent, gearbox 8F+2R / 16F+4R / 12F+3R / 12F+12R, and rear tyre alternatives are **trim choices**, not simultaneous factory standard equipment. 540 rear PTO plus optional reverse function are not two separate RPM ratings. Lift 2,000 kg lacks a stated hitch measurement point. No manufacturer test standard for numeric rated horsepower was inferred.
* **DI 740 III** `3a46f879-666c-47cd-ae1f-53f0c7861521`, India 2WD model family (HDM, Super DI/Rx and Sikander trims), **12/12** evidenced by the [manufacturer page](https://www.sonalika.com/tractor/di-740-iii.html). 42 HP is an **HP marketing category**, not ISO/SAE measured engine power. Page internally lists “Rated rpm: 2000 kg” (nonsensical unit), therefore no rated-speed spec was newly supplied. Its technical table says oil-bath air cleaner while the feature panel says dry air cleaner; **no air-filter spec was published**. Oil-immersed service brakes are also described as *optional* in the features and are annotated accordingly. Side/centre shift, steering and clutch choices remain conditional.

Both records: `horsepower=NULL`, `model_year=NULL`, exact sourced `spec_value` and source link unchanged, manufacturer-derived measurement caveats attached.

## Package B · TYM international: +6 exact variants, +84 public specs
Superseded draft parents `f57ccfee-dc9c-485b-b9e5-65c2cdf6a72e` (T2024/2500), `d8bd757c-17ae-4e98-9a50-1670b2574185` (T2026/2500L), `3ace58f7-cce2-498f-ac6a-cab76361a9d8` (T4048/5025) are **archived, never deleted**. Original **3 tractor + 44 source specs = 47 private restore snapshots** in batch `20261121_tym_2500_2500l_5025_six_variants_v1`. All source specs checked against [TYM 2500 table](https://www.tym.world/en/products/tractors/series-2/2500) and [TYM 5025 table](https://tym.world/en/products/tractors/series-4/5025).

| New ID | Model / exact configuration | Verified public specifications |
|---|---|---:|
| `71e2b971-0585-4b12-920a-993c31559c43` | T2024 **2500R**, 6F×2R mechanical | 13 |
| `2de80a0e-4aac-4bc8-ad69-397fbf2c44cb` | T2024 **2500H**, 2-range HST | 13 |
| `1aa3a3d6-822b-4346-9d13-b6c0d99bdb1e` | T2026 **2500L**, 6F×2R or 9F×3R mechanical *options* | 14 |
| `37c62cc5-b235-41a6-a2f0-4a1260cf4884` | T2026 **2500HL**, 2- or 3-range HST *options* | 14 |
| `efd5ab99-1bc3-4dde-b0e8-581d7559e490` | T4048 **5025R**, 12F×12R, ROPS | 15 |
| `e92e0124-064f-49f3-a189-a4cfab682fb4` | T4048 **5025H**, 3-range HST, ROPS | 15 |

**Important quarantine:** The TYM 2500 marketing section says **307 mm** ground clearance, whereas its technical comparison table states **375 mm** for T2024. Both T2024 child variants therefore omit `ground_clearance` until documentary conflict is resolved. Page gives **924 kg with F-ROPS** vs **888 kg with ROPS**, but this is **rollover-structure-specific, not proven to distinguish mechanical versus hydrostatic gearbox**: no ambiguous ROPS mass was copied onto 2500R/2500H. For T4048, the maker explicitly assigns ROPS mass **1,795 kg to 5025R** and **1,802 kg to 5025H**; kept separate. Manufacturer engine power 24/48 hp has no cited ISO/SAE or rated/max convention; represented only as `manufacturer_engine_power_unspecified_standard`, **not as the unsourced headline**.

### Safety, audit and release visibility
* All public model records independently read back: 8/8 published, 109/109 new source-evidenced public specs, 74/74 private snapshots, consistent unique canonical keys. `tractorvs_public_specs` remains **security_invoker=true, security_barrier=true**; `anon` cannot SELECT private `tractorvs_image_candidates`.
* Site publication is a separate step: once the public-view-only GitHub fingerprint catches **221/5997**, Git-connected Cloudflare rebuild and live multi-locale SEO verification must confirm new URLs. **Do not conflate sitemap URLs with Google-indexed pages**.
* Workflow fast path: merging a reviewable file under `site/docs/publication-checkpoints/` triggers the existing free, published-only catalog fingerprint sync on trusted **main**; scheduled 17/47 UTC checks remain. The sync validates JWT role=anon, read completeness, no >5% publication regression and does not read private drafts or invoke paid Gemini.
* Original source documentation kept private via existing `tc_backup` for rollback. A recovery MUST check SEO URLs, exact model IDs and dependent user content before modifying published records. No automatic destructive rollback bundled.
* Other open work remains: 247 drafts; Agrale 540 XT conflicting manufacturer editions; image licensing/identity; eight-language encyclopedia draft PR #127; Search Console **real** indexed coverage verification.

Read-only verification script: `supabase/verification/20261121_tractor_221_publication_audit.sql`.
