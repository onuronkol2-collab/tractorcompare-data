# TractorVS — Panther 26 / Sonalika original model release (21 November 2026)

## Verified production checkpoint

**Before:** 251 published / 217 draft / 10 archived; 6,337 source-gated specs.  
**After:** **255 published / 213 draft / 10 archived; 6,384** source-gated specs.  
**Impact:** +4 independent source-identified variants, **+47 exact technical specification fields**.

Production was an atomic PostgreSQL transaction guarded by exact brand/model/status/variant/market/source URL/evidence row counts/old manufacturer's critical engine+transmission data and duplicate published-model checks. **63 before-state original rows** backed up privately before updates: 4 tractors + 59 specs. Private batch: `20261121_panther26_sonalika_di734_tiger55_verified_v1`. No rows deleted, no GRANT/RLS/Anon/Authenticated/Auth/Media changes.

| Exact manufacturer variant | Existing model UUID | Manufacturer model page | Verified public fields |
|---|---|---|---:|
| Antonio Carraro **Panther 26 M**, Stage V, 4WD, mechanical **9F/3R** | `da7afde6-6c29-49b9-a79f-63bc32025825` | https://www.antoniocarraro.it/en/catalogue/Panther_26M | 11 |
| Antonio Carraro **Panther 26 H**, Stage V, 4WD, **three-range hydrostatic** | `48e8caec-9a7f-4eb6-b271-9a7c517c7d27` | https://www.antoniocarraro.it/en/catalogue/Panther_26H | 10 |
| Sonalika **DI 734 Power Plus**, India 2WD standard/Rx family and 8F/2R | `fb435078-e556-417b-a5be-4084d6cf26f7` | https://www.sonalika.com/tractor/DI-734-Power-Plus | 12 |
| Sonalika **Tiger DI 55 III**, India, **12F/3R**; 2WD vs 4WD not asserted | `9486ecf8-7150-494a-9173-0364986a195a` | https://www.sonalika.com/tractor/tiger-di-55-iii | 14 |

### Engineering QA decisions

- Panther 26 M/H model designation **26** does not equal manufacturer technical power **25 hp**. The historic root `tractors.horsepower=26` was inaccurate and replaced with `NULL`. The source's 25 hp is retained as an explicit `manufacturer_engine_power_unspecified_standard`, **not** claimed SAE/ISO dynamometer measured rated hp. Both models: Mitsubishi **1318cc, three-cylinder Stage V**. M: 950kg maker weight and 850kg rear lift, 9 forward/3 reverse mechanical 4WD. H: 1035kg maker weight and 900kg rear lift, hydrostatic low/medium/high 4WD. Manufacturer does not state loaded weight standard or specific hitch measuring point.
- Five original Panther records per model (=**10 old "verified" fields**) had `verified_at` but no `evidence_text`. They remain privately backed up and stored, but status has been changed to `verified_at=NULL`. Source-evidenced manufacturer technical rows are the sole public comparison data.
- Sonalika DI 734 Power Plus: technical specification table says `air_filter_type=Wet type` but Features says `Dry type`; technical `Sliding Mesh with Centre shift` conflicts Features `Constant mesh / side shift`. Both contradicting fields retained *unverified*, with plain-English evidence notes and are not visible in the publicly gated specifications; model could still be published with **12** remaining source-specific specs.
- Sonalika DI 734 **37 HP Cat.** is *manufacturer marketing horsepower category*, NOT exact measured rated engine output. Old root `tractors.horsepower=37` set **NULL**, while `engine_hp_category` source-labeled and published. Technical data: 3 cylinders at 1800rpm, **8F/2R**, **55L** fuel, 1600kg manufacturer lift. Optional steering and oil immersed brakes are labeled trim-dependent. Primary site lists two 2WD variants standard/Rx; do not imply a 4WD option without proof.
- Sonalika Tiger DI 55 III: current individual official table has **235 Nm max torque**, 3 cylinders at **2000rpm**, **12F/3R**, 65L fuel, 2200kg manufacturer hitch, dry air cleaner, independent clutch. The manufacturer **Tiger DI 55 III 4WD** exists as a separate official model page; this record's product page does **not** clearly bind the exact drive layout. Thus `tractors.drivetrain=NULL`; never copy the 4WD option into this model by category.
- No model year invented, no user/photograph media rights inferred from product catalogue visuals. Independent source URLs are retained; source records explicitly identify the maker.

## Security, staging and SEO
- Independent SELECT following commit returned public model/spec counts **255 / 6384**, backup **63**, seven? **four** published models with 11+10+12+14 exactly, **zero** unsupported verified Panther legacy flags.
- `public.tractorvs_public_specs` retains `security_invoker=true`, `security_barrier=true`; `anon` cannot SELECT `public.tractorvs_image_candidates`.
- Merge this checkpoint only after PR-site build and production bundle safety checks pass. The existing trusted-main, free, anon-view-only GitHub catalogue snapshot flow should update its fingerprint to **255/6384**. A later Git-connected Cloudflare production build and **10-locale real HTTP** canonical, hreflang and sitemap SEO check is mandatory before claiming 2,550 pages live.
- The number of sitemap URLs is not Google-indexed page count. Use Search Console *Page Indexing* and *URL Inspection*. Site photos remain source/license-gated; eight-language encyclopedia PR #127 requires separate QA.
- Open: 213 drafts, conflicting OEM Agrale 540 XT official PDF revisions, Antonio MACH 2 R 74.2/98 manufacturer text, TIGRE 3800 F engine variant disagreements, Sonalika GT 22 4WD page 2WD purchase dropdown discrepancy, additional model-and-option-specific evidence.

**Read-only post-release SQL:** `supabase/verification/20261121_panther_sonalika_255_release_audit.sql`. Manual rollback requires source-before-state JSONB review and dependency impact assessment; never blanket-delete models.
