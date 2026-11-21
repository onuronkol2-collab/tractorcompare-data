# TractorVS Antonio Carraro two official Stage V models — 21 November 2026

## Production publication checkpoint

**Supabase independently verified:** **249 published**, **219 draft**, **10 archived** model records; **6,321** source-backed public technical specifications. Previous checkpoint 247/6,289, therefore exactly **2 new Antonio Carraro models and 32 public evidence-linked specifications**.

All 46 original rows (2 tractor records + 44 old specification records) are preserved privately in `tc_backup.tractor_publication_patches`, batch `20261121_antonio_mach4_trx5800_official_v1`. Atomic PostgreSQL transaction required exact model/brand/URL, old status, 17 linked candidate evidence rows and 5 proofless legacy rows per tractor, full original backup, +32 verified rows in RLS-safe public view and 46 backup rows before commit.

| UUID | Exact model and configuration | Model-specific official manufacturer page | Source-backed public fields |
|---|---|---|---:|
| `f267b552-5cdb-4936-9857-b4d88f0618cb` | **MACH 4 R** (technical 8900 R, four rubber tracks, Stage V); ROPS or optional cab | https://www.antoniocarraro.it/en/catalogue/mach-4-r | 16 |
| `cf9f7eff-7d64-4c5a-83d3-281e37679252` | **TRX 5800**, Yanmar Stage V, S90 gearbox 16 forward+16 reverse; ROPS or RedCab | https://www.antoniocarraro.it/en/catalogue/TRX_5800 | 16 |

### Measurement and version integrity
- MACH 4 R source technical box expressly identifies **54.6 kW / 74.2 hp at 2400 rpm**, Kubota 4-cylinder/16-valve turbo diesel common rail **3769 cc Stage V**. Its rubber quadtrack drive layout and reversible steering are preserved as descriptive technical fields; `tractors.drivetrain` is deliberately NULL rather than inaccurately calling tracks standard 2WD/4WD.
- Model source distinguishes MACH 4 R **with rollbar 3200 kg / with cab 3380 kg** and **capacity 2400 kg**. Weight loading/ballast and hitch-lift measurement point not specified. Road homologation **40 km/h** must not be relabelled tested gear-limited operating speed.
- TRX 5800 official model box: Yanmar **2091 cc Stage V**, **37.9 kW / 51.5 hp at 2600 rpm**, with **ROPS 1800–2015 kg** and **RedCab 1950–2165 kg** manufacturer bands (not an individual unscoped guaranteed weight). Quoted capacity **2190 kg** location not given, retained as manufacturer-claimed lift without invented measuring standard. S90 16F x16R with synchronised shuttle retained.
- Source `engine_rated_power_hp` canonical label is inaccurate when a source does not cite ISO/SAE or rated/max test conditions. Both original model-specific horsepower records were relabelled `manufacturer_engine_power_unspecified_standard` with original source value + unit, manufacturer's claim **not measured rated hp**. Their duplicate `engine_rated_power_kw` values remain safely stored but **unverified** pending separate 10-locale technical label/standards review; `tractors.horsepower=NULL`, model_year NULL. Source emission Stage V does not imply exact manufacture year.
- Ten *legacy* source row flags (five per model) had `verified_at` dates but `evidence_text=NULL`: these were never eligible for RLS-gated public display. They now explicitly have `verified_at=NULL`; old rows were not deleted and original JSONB backup remains. Duplicated description/weight text is not presented as ten separate unverified facts.
- **MACH 2 R** remains draft: the maker's same model page 8900 R technical box says **74.2 hp** but main product description mentions **98 hp**. Needs source generation/market clarification before any exact power claim. **TIGRE 3800 F** likewise has model page Italian/English engine displacement and headline power inconsistencies (1331 vs 1642 cc and 38.7 cv vs 25.7 hp) and remains draft.

No new photos added: a manufacturer-illustrated page is not a commercial image licence. No RLS/grants, Auth or forum modifications performed. The public view remains `security_invoker=true, security_barrier=true`, and `anon` lacks SELECT on private `tractorvs_image_candidates`.

### CI, free catalog sync and SEO separation
This PR adds a reviewable `site/docs/publication-checkpoints/` release document and strictly read-only verification SQL. Upon merge into trusted `main` **only after CI green**, existing zero-paid, anon-public-view-only catalog workflow should update fingerprint to **249/6321** and trigger Git-connected Cloudflare static generation. Verify HTTP reachability, sitemap and reciprocal hreflang in ten locales; do not claim Google indexing from generated sitemap or deprecated Search Console sitemap `indexed` metadata.

**Continuous user task tally:** beginning 237/6180, current **249/6321** → **12 more published models and 141 more sourced public specs** across 3 atomic batches; **171 before-state original snapshots** (Mahindra 101, Agrale 24, Antonio Carraro 46). Remaining **219 drafts** include conflicting Agrale 540 XT manufacturer document editions, Antonio single models with contrary marketing/technical box power, licensed photographs, translation QA PR #127 and actual GSC index coverage.

Read-only independent check: `supabase/verification/20261121_antonio_249_batch_audit.sql`. Never run blind rollback/delete; inspect downstream URLs, forum content, compare links and FK dependencies before original snapshot restoration.
