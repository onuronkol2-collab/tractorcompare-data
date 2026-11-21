# TractorVS release: ArmaTrac 804 Fruit Garden Cabin and 804.4 Fruit Garden ROPS

**Date:** 21 November 2026. **Live production Supabase result:** **266 published, 202 draft, 10 archived**, with **6,502 manufacturer/independent verified source-evidenced public technical rows**, previously 264/204/10 and 6492.

### Guarded OEM release (already executed in production)

Exact existing tractors (do not create duplicates):

| Existing tractor UUID | Distinct manufacturer configuration | Maker source (verified individual landing page) | New visible OEM specs |
|---|---|---|---:|
| `619e4fd9-1155-4927-b488-4f55c95ee739` | **ArmaTrac 804 Fruit Garden Cabin**, Stage 3A, **Cab**, Perkins 80 **HP (maker claimed)**, **307 Nm** | https://armatrac.com/tractor/286/804-fruit-garden-cabin | **5** |
| `362ad12b-7e89-4adf-83df-841b96b0362e` | **ArmaTrac 804.4 Fruit Garden ROPS**, Stage 3A, **ROPS platform**, Perkins 80 **HP (maker claimed)**, **307 Nm** | https://armatrac.com/tractor/288/8044-fruit-garden-rops | **5** |

The ArmaTrac individual manufacturer product pages explicitly identify their distinct official model names and operating station configurations, **Stage 3A**, engine **Perkins**, **80 HP** and **307 Nm**. They do **not** provide ISO/SAE engine power test standard, dyno rating conditions, exact torque test RPM, year or individual 2WD vs 4WD setup. Thus the manufacturer power is labelled `manufacturer_engine_power_unspecified_standard` (not independently comparable `tractors.horsepower`), `horsepower=NULL,model_year=NULL,drivetrain=NULL`. The market field `International` describes the English-language model catalogue scope, **not** a claim of exclusive geographic sale or fixed country package.

**Safety and backups:** atomic transaction batch `20261121_armatrac_804_cab_8044_rops_v1` validated full original brand/model, source ID + exact URL + official_product_page source type, original draft status/variant/root power/year/drivetrain, original five unique canonical keys/spec values in each and no already published exact model. Before any update, 2 original tractors +10 old specs = **12 private original JSONB snapshots** written to `tc_backup.tractor_publication_patches`. After verification and publication, independent read-only queries confirmed 5+5 publicly verified exact source fields, **12 protected original records**, `public.tractorvs_public_specs` `security_invoker=true,security_barrier=true`, `anon` no SELECT on private `tractorvs_image_candidates`. No schema migrations/RLS/grants/auth changes, no user/forum data touched.

The ArmaTrac site expressly states its pictures/drawings/text/media are copyrighted. **No OEM picture used or publication right inferred**; source technical facts were only attributed in original concise wording. License use decisions must be separate.

**Other findings intentionally not published:** ArmaTrac **654 Fruit Garden CRD5** manufacturer shows **280–295 Nm** as a **torque range**, not a singular model-specific peak; exact variant/torque RPM and engine manufacturer vs its *HCE Stage-V (ECAPRA)* 'engine type' label are not established. It remains draft. ArmaTrac **1104 Lux** maker page was blocked by bot/verification; no false source validation and no publication. Swaraj **843 XM / 735 XT 4WD** manufacturer site technical summary vs detailed table conflict (2WD/4WD, weights/dimensions, model horsepower classes), remain draft pending official edition-specific PDF.

### Continuous project tally and propagation

This user-requested 21 November session began with **261 published / 207 draft / 6,445 public specs**. This adds **5 models / 57 maker-evidenced public specs** (Antonio Carraro 3/+47; ArmaTrac 2/+10) and **82 private old-row backups** (70+12).

Pull request contains **documentation and read-only QA SQL only**. After the PR's site build and production-bundle-safety checks complete successfully and it merges into trusted main, existing zero-paid GitHub anon-only catalog fingerprint sync should update **264/6492→266/6502**. Cloudflare build, 10-locale live sitemap/canonical/hreflang audit and actual Google indexed-page count are **separate**; don't infer them from new database status or a successful compile.

Open: **202 drafts**, exact version conflicts (Swaraj 843XM/735XT4WD, Agrale540XT, Antonio MACH2R/TIGRE3800F, Sonalika GT22 4WD), 10-locale residual translation issue #57, 8-language encyclopedia PR #127, rights-proven photos and GSC Page Indexing.

**Independent read-only verification:** `supabase/verification/20261121_armatrac_266_cab_rops_audit.sql`. Recovery requires exact backed-up original JSONB after reviewing FKs, comparison bookmarks and SEO URL dependencies, no blanket DELETE.
