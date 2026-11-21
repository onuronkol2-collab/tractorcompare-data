# TractorVS — three Antonio Carraro models, release checkpoint 264

**Production SQL release date:** 21 November 2026. **Source policy:** manufacturer model-specific technical panel, source identity/variant/market verified, contradictory fields held unverified, immutable old before-state preserved privately.

## Verified database result

| Metric | Before | After |
|---|---:|---:|
| Published tractor model configurations | 261 | **264** |
| Draft configurations | 207 | **204** |
| Archived configurations | 10 | **10** |
| Public evidence-gated specs | 6,445 | **6,492** |

**One atomic guarded transaction** `20261121_ac_tgf7800_trx7800_tony8900trg_v1` first wrote **70 original before-state snapshots** to `tc_backup.tractor_publication_patches` (3 original tractor rows, 67 specification rows). It then switched exactly three individually proven OEM configurations from draft to published, verified **47** technical fields, and removed unsupported verification stamps from **19** pre-existing fields lacking evidence_text. No rows deleted, no RLS, permissions, auth, service keys, forum, or licensed image policies altered.

### Exact OEM identities and source URLs

| Tractor UUID | Model variant | Exact official model source | Public source-backed specs |
|---|---|---|---:|
| `44929c2c-c1db-48e8-a8a5-fdfef3bb467f` | **Antonio Carraro TGF 7800 S**, Yanmar 3319cc 4cyl 16 valves, Stage V / EPA Tier 4; 16F×16R synchronized shuttle; ROPS 2090–2310 kg; cab 2200–2420 kg; lift 2300 kg | https://www.antoniocarraro.it/en/catalogue/tgf | **16** |
| `b678b91d-976c-489a-9d75-ce85865f91ad` | **Antonio Carraro TRX 7800 S**, Yanmar 3319cc 4cyl 16 valves, Stage V / EPA Tier 4; reversible 16F×16R; ROPS 2160–2340 kg; Protector cab 2320–2520 kg; lift 2150 kg | https://www.antoniocarraro.it/en/catalogue/trx | **16** |
| `7fa6422c-6cfc-401e-8677-6933fbe8ea62` | **Antonio Carraro TONY 8900 TRG**, Kubota 3769cc 4cyl turbo 16-valve Stage V; 54.6 kW / 74.2 HP manufacturer claim at 2400 rpm; continuously variable hydrostatic shuttle with 4 automated SIM ranges; ROPS 2290–2400 kg, AIR cab 2470–2580 kg; lift 2400 kg | https://www.antoniocarraro.it/en/catalogue/TRG_TONY | **15** |

### Engineering source and translation decisions

- For TGF/TRX the **OEM technical box** says *70 HP*, but nearby manufacturer marketing narrative says *70.3 hp* (TRX) or *71 hp* (TGF). Exact measured rated horsepower standard **ISO/SAE and test edition not supplied**; we preserve the technical-box **70 hp as `manufacturer_engine_power_unspecified_standard`** with source and caveat, **not `tractors.horsepower`**. Page title/version is exact TGF7800S and TRX7800S, not TGF9900 or TRX9900.
- TONY8900 TRG maker technical box says **74.2 HP/54.6 kW at 2400 rpm**, but does not state exact measurement standard. We keep **only one** source-backed public manufacturer engine-power comparison claim (74.2 HP under explicitly *unspecified test standard*), while the **54.6kW** redundant stored record is **unverified** until a 10-locale key `manufacturer_engine_power_kw_unspecified_standard` is implemented. We do not pretend kW is independently ISO-rated power.
- Manufacturer TRG transmission says **continuous-variable with hydrostatic shuttle, four *robotic* ranges with SIM (Shift In Motion)**. This is distinct from **16 forward and 16 reverse synchronized mechanical gearbox** on TGF and TRX. Do not mix mechanically different powertrains.
- Rollbar vs cab weight **min/max** are manufacturer configuration bands, not one universal weight and not necessarily unballasted or fully laden. Hitch capacities **2300/2150/2400kg** lack a stated measuring point, so no claim of same-measurement comparability.
- PTO *540 rpm, economy 540E, synchronized* is a list of modes: synchronized mode **not another numeric RPM**. Where the maker specifies alternative TGF rear wheel diameters **20 or 24 inches**, they are optional different fitments.
- **19 pre-existing `verified_at` stamps with no evidence_text** were cleared (TGF 6, TRX 6, TONY TRG 7), originals retained, so the public evidence view does not show duplicative unsupported model descriptions. No manufacturer photos licensed or published, no ungrounded model year or 2WD/4WD root drivetrain inferred.

### Additional external quality investigation — Swaraj kept in draft

Official manufacturer page https://www.swarajtractors.com/swaraj-843-xm-tractor has severe conflicts across **model headline vs specification table** and vs existing draft extraction: headline **41–45 HP class**, detail **31–40 HP**; previously stored draft 843XM 1500kg lift vs current lower specification **1650kg**; 3430 vs 3450mm length; 1770 vs 1780mm width; 1980 vs 2055mm wheelbase; 400 vs 420mm clearance; 56 vs 47L fuel; **1840kg vs text currently saying 1850 *mm***, with invalid mass unit. The source summary 540/multispeed vs detailed 540 only and engine 4cyl remain. No values promoted or 843 XM published pending exact edition/official brochure evidence.

The distinct official https://www.swarajtractors.com/swaraj-735-xt-4wd-tractor has headline **4WD with 1700kg lift/3307.2cc**, but its bottom specification lists **2WD with 1650kg**, tyre and chassis values differ from 4WD draft extracted from former page edition. Thus **735 XT 4WD remains draft**, with contradictory old and new source groups NOT merged. The clear model-specific fields might be usable later as a distinct edition, but require versioned technical brochure and drivetrain identity.

Agrale **540 XT** conflicting official edition measurements, Antonio MACH2R and TIGRE3800F contradictory official headline/product body, Sonalika GT22 4WD purchase-selector mismatch remain drafts.

### Deployment and safety

- Atomic transaction first checked exact original model UUID, brand/model/market/year/status/source ID+URL, **67 distinct canonical keys**, old 48 source-text candidates and 19 legacy flags, exact lift/power and min/max weight critical values, duplicate name collisions and previously absent batch ID. Then it wrote **70 original private JSONB snapshots** before data verification/publish.
- Independent after-commit SQL verified **3 published, 47 source-backed technical rows (16+16+15), zero proofless verified stamps**, 70 backups and **264/6492** RLS-safe public records. `public.tractorvs_public_specs` remains `security_invoker=true,security_barrier=true`; `anon` cannot SELECT private `public.tractorvs_image_candidates`.
- This pull request contains documentation and strictly READ-ONLY independent audit SQL, no destructive migration or schema change. After build and production-safety CI both PASS, merge trusted main to trigger existing zero-paid **anon-only** catalogue fingerprint sync from **261/6445 → 264/6492**, then check Git-connected Cloudflare sitemap/10 locales **via actual HTTP smoke**. Do not claim 2640 new live model pages or search engine indexation before separate live check. Sitemap count cannot establish GSC Page Indexing status.
- Project SEO translation: existing [PR #165](https://github.com/onuronkol2-collab/tractorcompare-data/pull/165) merged; residual locale technical label gaps and issue #57 remain. This batch uses already-localized `manufacturer_engine_power_unspecified_standard`; further labels require exact value semantics in all 10 languages.

**Follow-up read-only verification:** `supabase/verification/20261121_ac_264_release_and_swaraj_hold_audit.sql`. Rollback must inspect downstream site URLs/forum/compare references and only restore original JSONB snapshots for exact affected record IDs, not blanket deletion.
