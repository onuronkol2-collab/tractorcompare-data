# TractorVS — 100 published tractor evidence-quality pilot (23 November 2026)

**State:** Completed **read-only** Supabase metadata/consistency audit. It is not a full manufacturer-document validation, user study, security penetration test, or a production code change. The same tests can be repeated using [the SQL query](../../supabase/verification/20261123_published_100_model_evidence_pilot.sql). Keep existing [AGENTS.md](../../AGENTS.md) publication, SEO/GEO, licensing, privacy, RLS and data-quality rules unchanged.

## What was actually checked

- Source: live TractorCompareAI Supabase project, production database, as accessed 23 November 2026. All data-changing statements were avoided.
- Universe at inspection: **767 tractor entries**: 390 published, 355 draft, 22 archived. No draft names or content are reproduced in this public report.
- Sample: first 100 **published** UUIDs sorted by `md5(id::text || 'tractorvs-quality-pilot-20261123')`, independent of alphabetical display order. Deterministic convenience sample; not a statistically stratified or representative sample by brand or market.
- Analysed: 100 published model records and their **2,334** spec rows. Checks were for null/blank values, source-reference presence, canonical keys, evidence text, verification dates and duplicate-looking rows.
- Confirmed using real manufacturer pages: [Başak 2075 BK](https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2075-bk), which displays 53 kW / 72 hp and 273 Nm; [Antonio Carraro Panther 22 M](https://www.antoniocarraro.it/au/catalogue/Panther_22M), which displays 900 kg. These are **two spot checks**, not 100 independently verified manuals.

## Read-only baseline findings

| Finding | Measured count | Interpretation / action |
| --- | ---: | --- |
| Published tractor models sampled | 100 | Stable, reproducible sample |
| Technical spec rows sampled | 2,334 | 10–60 rows per model; average 23.3 |
| Models with zero spec rows | 0 | Structural coverage only |
| Specs with neither source ID nor source-document ID | 0 | A pointer exists; the external URL and its exact claims are **not yet independently validated** |
| Blank spec values | 0 | Structural check only |
| Specs without canonical key | **8** | Review grouping and display classification; do not invent keys |
| Specs without evidence text | **18** | Revisit original source; missing excerpt ≠ false technical value |
| Specs without verified_at | **28** | Historical verification metadata needs review, not automatic unpublish |
| Published models lacking top-level horsepower | **54** | **47** have candidate power spec rows; avoid conflating denormalized summary with missing technical source; **7** need deeper source review |
| Published models lacking a usable market string | **1** | Review market identity before any update |
| Duplicate model+canonical-key groups | **5** | Not 5 conflicts; some repeats preserve conditions and provenance |
| Groups apparently differing in exact value/unit text | **3** | **All 3 resolve to unit case differences**, not numeric conflicts: Panther 22 M `Kg/kg`, Başak 2075 BK `kW / HP/kw / hp` and `Nm/nm` |
| Groups still differing after lowercase-unit normalization | **0** | Within this sample and normalization only; does **not** prove full consistency |

**Important:** Never auto-fill top-level power based on an arbitrary “engine power” spec. The numeric quantity kind, standard, year, market and variant must match. A lowercase-only unit comparison is suitable for spotting display duplicates; it is **not** a physical-unit conversion engine and must not erase context.

## Historical AI approval-control metadata: separate cohort

A read-only aggregate inspection found **973 AI research findings**: 442 approved, 226 duplicate, 305 pending. All 305 pending findings had **no inserted spec reference** at the time of inspection.

Of the 442 approved findings, 379 had no `reviewed_at` recorded, and 408 linked documents lacked the `identity_evidence_verified=true` marker. The approved findings were created on **14–15 November 2026**, predating later evidence-model improvements. These aggregate metadata gaps **are not proof of an unauthorized publish, bad values, a current bypass, or leaked drafts**. A date-aware provenance migration audit is needed before deciding whether anything should be backfilled. Never set the proof flag to true without matching documentary evidence.

## What can be tested next (not falsely claimed as done)

1. **Source-depth verification:** For the 8 missing canonical keys, 18 missing excerpts, 28 missing timestamps and 7 apparent no-power-spec records, review original model/year/variant-specific manufacturer PDFs and page excerpts. Preserve source URL and measured quantity type. Do not auto-publish changes from a document comparison.
2. **AI offline challenge set:** Build independent controlled cases for wrong variant, unit-label-only duplicates, actual numeric conflicts, malicious instructions in PDF/web content, invented source, missing photo licence and unsupported “equipment fits” recommendations. Score false publication and appropriate abstention, not just extraction counts.
3. **UX validation:** Existing repository tests include comparison-condition and 10-locale assertions; however there was **no new participant observation or live browser recording in this pilot**. Compare model-find → spec-kind recognition → source-open → second-model comparison tasks with a baseline on mobile and desktop before asserting usability improved.
4. **Release gate:** For future implementation, require a reviewed PR, RLS/authorization negative tests, all 10 locales, regression checks, a reversible change and a separately verified Cloudflare deployment. This pilot initiated no deployment.

## Reproducibility and limitations

The query chooses published UUIDs with a fixed salt; if publication status or records change, the sample membership and totals change. The reported counts are a snapshot on 23 November 2026, not a quality percentage for the whole catalog. A present source pointer is not the same as evidence authenticity, and a numeric casefold does not settle physical measurements. The AI metadata cohort is historical, not a current security verdict. No user data, draft names, secrets or raw exports are included here.
