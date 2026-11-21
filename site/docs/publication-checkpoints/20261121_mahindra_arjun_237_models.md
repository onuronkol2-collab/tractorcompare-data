# TractorVS | Mahindra ARJUN four exact OEM models | 21 November 2026

## Verified release and public data checkpoint
- Live Supabase **237 published / 231 draft / 10 archived**; **6180 source-verified specs** in public RLS-safe view.
- Additional +4 published Mahindra ARJUN models, +30 verified public specifications from exact India manufacturer model SPECIFICATIONS tables; **40 original rows** snapshotted in private `tc_backup.tractor_publication_patches`, batch `20261121_mahindra_arjun_four_models_v1`.
- This user-requested continuous round since 221 published / 5997 specs now totals **+16 models and +183 verified public specs**. Three previously completed guarded batches stored **45+85+40** private originals; ARJUN now adds **40**, for **210** backed-up original rows across four protected batches.
- No schema/GRANT/RLS/anon-rights modifications, no photos or paid API calls.

| Exact Mahindra ID | Model | OEM exact manufacturer source | Verified technical rows |
|---|---|---|---:|
| `2c1a6638-fe60-46fd-8a56-ea212ddbbd5b` | ARJUN 555 DI | https://www.mahindratractor.com/tractor/arjun-555-di | 8 |
| `bee5e88f-d217-49a4-b484-4e34b9b60ff9` | ARJUN 605 DI i | https://www.mahindratractor.com/tractors/arjun-605-di-i | 7 |
| `739db984-4cba-4173-bf8c-b022fc2a8f80` | ARJUN 605 DI MS | https://www.mahindratractor.com/tractors/arjun-605-di-ms | 7 |
| `163dbb9b-676d-4b0d-b1f7-17a30bb16c1f` | ARJUN 605 DI MS V1 | https://www.mahindratractor.com/tractors/mahindra-arjun-605-di-ms-v1 | 8 |

### Exactly scoped engineering evidence
- All 4 source model technical tables state **4 engine cylinders @2100 r/min**, but do **not** assert a specific drive type in the Drive Type row; thus `tractors.drivetrain=NULL`, not invented 2WD/4WD. The V1 product feature mention of 4WD axle does not automatically apply to every configuration.
- Distinct maximum torques: **ARJUN 555 DI 187 Nm; ARJUN 605 DI i 217 Nm; ARJUN 605 DI MS 214 Nm; ARJUN 605 DI MS V1 214 Nm**.
- Gearboxes: **555 DI / 605 DI i / 605 DI MS = 8F×2R**, while **605 DI MS V1 = 16F×4R**. Official technical tables state FCM; for **605 DI i** and **605 DI MS**, a feature section mentions *synchromesh* in apparent family marketing copy, so `transmission_type` was **held unverified** for those two: no assumption that the words describe the same exact hardware.
- Rear hitch lifts: 555/605 DI i/605 DI MS **1800 kg** manufacturer stated, and V1 **2200 kg *with adjustments***. The V1 OEM qualification is kept in `measurement_standard`; no unconditional factory weight implied.
- Rear tyre 16.9×28, with optional 14.9×28 where the exact model manufacturer table explicitly provides alternatives.
- OEM landing table's broad **36–50HP or Above 51HP category** is not test-rated exact engine power. Each non-model-specific `engine_power_range` row remains stored and marked unverified; `tractors.horsepower=NULL`. Model-year similarly unproven, kept NULL.
- Manufacturer source/publisher URL, old source values and verification notes preserved; each new `verified_at` issued only for model-specific source-backed fields, no transmission type guessed where OEM text conflicts.

### Reversible guarded transaction
Release was one PostgreSQL `BEGIN/COMMIT` transaction with model status, source identity URL, duplicate publication, existing values, distinct canonical keys, before-state snapshot count and afterwards RLS-safe public-view assertions. The first SQL invocation had a syntax error from an unescaped quote, and **did not execute or change data** (verified 0 rows in the private batch). After correction, second invocation **committed**. Independent follow-up read verified 8+7+7+8 distinct public specs = 30 and 40 protected private originals; all 4 models published with NULL headline horsepower/year/drive. The publication batch is idempotently protected against replay.

Security: `tractorvs_public_specs` view retains `security_invoker=true` and `security_barrier=true`, `anon` cannot SELECT `tractorvs_image_candidates`. No verified commercial image licenses were added.

### Remaining operations
1. GitHub reviewed `site/docs/publication-checkpoints/**` merge triggers the existing zero-cost, anon-public-view-only snapshot sync from 233/6150 to **237/6180**, then Git-connected Cloudflare static rebuild. Verify actual live model pages in **all ten languages** via HTTP SEO smoke test. Number of Google-indexed URLs is a *different* data point; sitemap does not prove indexing.
2. Remaining **231 drafts**: Mahindra (other JIVO/OJA/NOVO), Agrale OEM editions, Antonio Carraro, Belarus, multi-market model/version evidence. Mahindra OJA 2121 2WD header vs 4WD table, JIVO305 540/750 vs 590/755 source wording, and Agrale 540 XT power/weight/hydraulic document-generation conflicts must not be auto-resolved.
3. Photo rights and exact variant match, eight-language encyclopedia PR #127, forum moderation, Google Search Console Page Indexing URL Inspection remain open.

Read-only QA: `supabase/verification/20261121_mahindra_arjun_237_release_audit.sql`.
