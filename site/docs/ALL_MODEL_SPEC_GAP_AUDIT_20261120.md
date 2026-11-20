# TractorVS: all-model deep specification gap audit
20 November 2026 · Maintained through the protected owner workflow

## The goal

Scan **every published and draft tractor**, not merely newly discovered models. Research missing model-specific technical categories (engine, rated/gross/boost/PTO, gearbox, hydraulic pumps/lift, weights and mass, tyre configurations, dimensions, brakes, axles, fuel and emissions) from an original manufacturer page, OEM PDF/manual, or a reliable model-matched independent measurement report when no manufacturer data exists. Clearly tag independent evidence; a claimed PTO power, a tested PTO horsepower, and a gross engine HP are **not** interchangeable.

**User's workflow rule:** Be practical and solution-oriented. Investigate source families in large batches; do not stop after a handful of successful models, and do not publish unverified year/market/variant claims.

## Reusable private SQL audit

Supabase owner/maintenance only:
`supabase/verification/20261120_all_tractor_source_and_spec_gap_audit.sql`

The read-only audit:
1. Reports full source+excerpt+verification-date coverage separately for published and draft rows.
2. Finds models missing core technical categories, including models that are already published.
3. Ranks official source-document families by number of unverified technical rows to review multiple exact models per source.
4. Finds suspicious power/weight units (such as kg/HP in a weight field) and duplicate/colliding model identities.
5. Checks that unpublished tractor data cannot be read in `tractorvs_public_specs`.

**NEVER** write draft model identities or private PDF research results into public GitHub Actions artifacts or public SEO pages. The SQL does not make any edits.

## Current source-verified production checkpoint

The database after this turn's controlled research has **151 published / 309 draft / 2 archived** tractors, with **4,619 publicly exposed technical rows** and **zero draft leakage**. There are two known published fields awaiting reconciliation: Başak 2075 BK 4WD's website 3830 mm length versus the official brochure's 3930 mm **including front weights** (3930 separately recorded with the exact qualifier), and Iseki T97 Series' 97 HP marketed model-family power record without adequate supporting excerpt. They remain unverified rather than being silently marked complete.

This turn's source updates:
- **11 Zetor FORTERRA CL/HSX/HD published models:** 94 producer-backed evidence/verification repairs, including correcting the 40 km/h **ECO** label for HSX and HD.
- **Başak Traktör 2075 BK 4WD:** +18 new true technical fields and 17 producer-PDF excerpt repairs; the distinct BK 2WD remains a draft. Original <https://admin.basaktraktor.com.tr/upload/7c743eaf-5228-4ae7-94d7-25df6a13e778-2075%20BK%204WD.pdf>.
- **LS Tractor J27 HST and GEAR:** +4 new independently sourced engine fields, 18 old verification repairs; independent <https://www.tractordata.com/farm-tractors/008/2/3/8231-ls-j27-engine.html> and producer <https://www.lstractor.com/en/product/tractor/tractor_J>. PS vs hp PTO ratings remain separate.
- **TYM T1025/T3047/T4057/T6130:** 13 manufacturer-brochure verification repairs and supported link migration; 2024 T575 and current T4057 edition differences are explicitly noted.
- **McCormick X5.085:** one previously draft tractor now published with **57** verified fields, **14 newly sourced features**. Exact maker 09/2023 2-page document <https://www.mccormick.it/wp-content/uploads/2021/04/MC_RS57_X5.085_Brochure_2p_6736270A1_HR_EN.pdf>. Fixed incorrectly guessed model 085=85 HP to true 75 HP. Corrected 48 kg/HP incorrectly stored as physical tractor weight: manufacturer's average weight is 3,700 kg; preserve marketing weight/power ratio as a separate key.
- **Yanmar YM347 and YM359:** two distinct **2022 US YM** models, 45 fully cited fields each (+9 new across two models), without mixing with published Turkey-market YT variants. Official PDFs: <https://www.yanmartractor.com/webres/File/Updated%202022%20EDA%20Files/YM347%202022%20Spec%20Sheet%20w%20EDA%208-17-22%20WEB.pdf> and <https://www.yanmartractor.com/webres/File/Updated%202022%20EDA%20Files/YM359%202022%20Spec%20Sheet%20w%20EDA%208-17-22%20WEB.pdf>. North American engine 46.0 vs 58.9 hp, PTO 35.5 vs 47 hp, US gallons/inches/lb preserved. Original Turkish catalogue marketing 47/60 HP explicitly labelled as a **different market claim**, not North American rated power.
- **Swaraj Target 625 2WD, Target 625 4WD, Target 630 4WD:** three manufacturer India exact model product pages, **114 verified fields** including four new equipment details. Unique drivetrain, front tyre, 19/24 hp PTO, 870/910 kg mass, 83.1/87 Nm torque and 1595/1555 mm wheelbase checked independently. Sources: <https://www.swarajtractors.com/swaraj-target-625-2wd-tractor>, <https://www.swarajtractors.com/swaraj-target-625-4wd-tractor>, <https://www.swarajtractors.com/swaraj-target-630-4wd-tractor>.

Totals for this conversation's changes: **6 new published models, 49 genuinely new technical fields**, and **142 repairs** to existing evidence/verification. **This does not mean all 151 published models are technically feature-complete**, nor does a producer's public photo grant reuse rights.

## Continuing without paid tools

The existing hourly ChatGPT automation is enabled and has been updated to verify core-category gaps on both published and draft models, work official PDF families in large batches and use accurately attributed independent sources only where manufacturer data cannot be found. TinyFish paid browser and Gemini paid research are not to be used.

The free GitHub Actions workflow `.github/workflows/tractorvs-publication-autosync.yml` checks the **anon-only published view** at UTC minutes :17/:47 and, only on changes, asks Cloudflare's Git integration to rebuild static pages. Verify the actual Cloudflare Workers Builds result, canonical URLs and sitemap before saying the new 151 model pages are live. Search Console indexing is a separate step and must not be claimed without evidence.

Next high-priority source families include exact Swaraj 744/855 models, Kioti CX2510 variants, Iseki TXGS24, OEM Sonalika FP-18, and Antonio Carraro's exact equipment versions. Generic series rows (e.g. Kioti HX Series, Iseki product groups, SAME range headings) and duplicate Agrale 540 XT/Deutz-Fahr 5090 D generation conflicts are **not** ready for automatic publication.
