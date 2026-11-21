# TractorVS — 258 verified tractors: Antonio Carraro SN 6800 V / TC 6800 F / TONY 8700 V

## 21 November 2026 production checkpoint
Supabase transaction already **committed and independently audited**:
- **258 published / 210 draft / 10 archived** models, **6,425 source-evidenced specs** via RLS-safe `public.tractorvs_public_specs`.
- +3 exact OEM models and +41 model-identified source-backed specs over the previous 255/6384.
- **60 private before-state original snapshots** (3 previous tractor rows +57 previous spec rows) in `tc_backup.tractor_publication_patches`, batch `20261121_antonio_sn_tc_tony_3_models_v1`.
- Combined this continuation round: **+7 published models / +88 verified public specs / 123 private before-state snapshots** (63 Panther/Sonalika +60 Antonio).
- No photo/image publishing, expensive API calls, schema migrations, RLS/GRANT/Auth changes, unscoped tested horsepower or guessed model year.

| Source-matched existing UUID | Model and precise Europe/Stage V variant | Exact official manufacturer page | Source-backed fields |
|---|---|---|---:|
| `321df789-607c-4045-b5d7-9a428e5d117f` | **SN 6800 V**, 66 hp maker-stated, Yanmar 4-cyl Stage V, **S90 16F×16R**, ROPS 1,775–1,965kg, RedCab 1,925–2,115kg | https://www.antoniocarraro.it/en/catalogue/SN_6800V | 14 |
| `ef4320ef-6d0c-41fd-b35a-1e74377d76e8` | **TC 6800 F**, Yanmar 4-cyl Stage V, **S90 16F×16R**, ROPS 1,870–2,075kg, distinct steering-wheel layout from articulated SN | https://www.antoniocarraro.it/en/catalogue/TC_6800_F | 12 |
| `057ddf74-0aac-48d0-a2ca-44df28e48619` | **TONY 8700 V**, Deutz 4-cylinder 16-valve **2900cc**, Stage V, **75.3 hp** at **2000rpm** maker figure, **375Nm at 1400rpm**, cab 2,525–2,725 kg, hybrid transmission | https://www.antoniocarraro.it/en/catalogue/TONY_8700V | 15 |

### Manufacturer measurement and distinct identity controls
- Manufacturer pages use *HP* but do not state applicable **ISO/SAE tested rated engine-power standard**. All three `engine_rated_power_hp` fields were renamed at canonical key level to `manufacturer_engine_power_unspecified_standard`, with original source value and unit retained. No forced mechanical kW conversion, `tractors.horsepower=NULL`.
- **SN 6800 V** has articulated steering chassis with factory rollbar/RedCab weight bands, **TC 6800 F** steering-wheel chassis has ROPS weight range. Neither source establishes an exhaustive *drivetrain* description and no 2WD/4WD vehicle-headline inference made. Both original `rear_hitch_lift_capacity_kg=2190` claims have unspecified lift measuring point.
- The maker's combined page displays **TONY 8700 V** and **TONY 11700 V**. The present model's source values **75.3 hp / 2900cc / 375Nm at 1400rpm / 2525–2725kg** are specific to **8700 V**. **11700 V** differs: 112 CV (page model box), 2924cc, 420Nm at 1600rpm and different cab weight; no mixture was published. Old `transmission_type='Hybrid mechanical-hydrostatic CVT'` implied CVT which OEM page does not explicitly label; corrected to **`Mechanical-hydrostatic hybrid`** and preserved attribution. Distinct S90 gearbox on other two models.
- Operating weight columns `_min_kg`, `_max_kg` are range bounds by cab/ROPS configuration, *not* a universal operating or ballasted weight. Hitch capacity 2,190/2,700 kg needs manufacturer-standard measuring point.
- All **16 pre-existing** (SN5, TC5, TONY6) `verified_at` flags lacking `evidence_text` were reset to NULL and original unverified rows retained (after private snapshots), not counted in source-gated public technical data. This avoids duplicate descriptions, weights and unsupported precision.
- Model-year not in source, left NULL. No unlicensed maker photos embedded or media usage rights claimed.

### Safety/rollback and SEO propagation
Atomic PostgreSQL transaction preflight validated unchanged full model/brand/variant/draft/market/root numeric metadata, exact `manufacturer` source ID and URL, 57 distinct canonical keys, source candidates, 16 older proofless flags, independent critical torque/weights/engine/gear values, published model duplicate collision, and private batch idempotency. Inserted 60 private original snapshots *before* modifying 41 fields / quarantining old 16, then verified exactly 41 source visible and 60 protected.
Independent after-state SELECT confirmed counts **14/12/15**, zero unsupported verified flags; RLS invoker/barrier settings unchanged and `anon` cannot read `tractorvs_image_candidates`.

**GitHub delivery:** This documentation and strictly READ-ONLY SQL in `site/docs/publication-checkpoints/**` should be merged only after site build and production bundle safety checks **green**. Existing trusted-main free anon-public-snapshot workflow then refreshes fingerprint from 255/6384 to **258/6425**; check actual GitHub JSON revision and the Git-connected Cloudflare production deployment. Finally run actual 10-locale SEO HTTP sitemap/canonical/reciprocal hreflang audit, expecting 2,580 model URLs only once confirmed. **Sitemap count is not Google's real indexed-page count**; GSC Page Indexing/URL Inspection is separate.

Still open: 210 drafts; conflicting Agrale 540 XT editions, Antonio MACH2R 74.2 vs 98 maker text, TIGRE3800F 1331 vs 1642 cc; Sonalika GT22 4WD confusing 2WD purchase selector; 8-language encyclopedia PR #127, photo rights, authentic moderated forum, Google indexing. No assumption that every manufacturer website picture is commercially reusable.

Read-only audit: `supabase/verification/20261121_antonio_sn_tc_tony_258_audit.sql`.
