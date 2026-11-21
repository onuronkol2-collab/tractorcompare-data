# TractorVS · Mahindra JIVO exact-model publication and source conflicts — 21 November 2026

## Verified publication checkpoint

**Supabase after atomic transaction:** 233 published tractors, 235 drafts, 10 archived; **6,150** verified evidence-gated public technical specification rows (3 newly published JIVO models, +37 public specs compared with 230/6,113).

Previous transaction `20261121_mahindra_oja3132_3136_3140_india_v1` and `20261121_mahindra_jivo_yuvraj_six_models_v1` released +9 models and +116 public specs (private original backups 45+85). This add-on transaction `20261121_mahindra_jivo245di_305_305vineyard_v1` released **3 models, +37 public specs, 40 protected original records** (3 source tractors+37 spec rows). Thus this research round delivered **12 published Mahindra models and 153 additional source-backed spec rows**, 170 private backed-up originals.

| Brand/model identity | UUID | OEM exact source | Verified source-backed fields |
|---|---|---|---:|
| Mahindra JIVO 245 DI, India 4WD / 8F×4R | `c93fae3a-b63e-44e0-94d4-3b56815d8ce3` | https://www.mahindratractor.com/tractors/jivo-245-di-4wd | 13 |
| Mahindra JIVO 305 DI 4WD / 8F×4R | `ec2e914e-0c05-4646-ac94-de20eb56741b` | https://www.mahindratractor.com/tractors/mahindra-jivo-305-di-4wd | 12 |
| Mahindra JIVO 305 DI 4WD VINEYARD / 8F×4R | `ac32976d-97ea-4d36-852f-e92c57c19bf0` | https://www.mahindratractor.com/tractors/jivo-305-di-4wd-vineyard | 12 |

### Manufacturer and measurement caveats
- **JIVO 245 DI**: manufacturer exact technical `Drive Type: 4WD`, independent of original missing draft field. Old `engine_torque: 85 Nm` corrected to manufacturer `81 Nm`. Old `PTO 540/540E` updated to exact OEM technical table `540/750`; the `540E` claim was an unsupported category copied from an unrelated trim.
- **JIVO 305 DI 4WD / VINEYARD**: both model-specific technical tables identify **89 Nm**, 2500 r/min, 2 cylinders, 4WD, Sliding Mesh, 8F×4R, 750 kg lift. OEM website has an *internal contradiction*: its SPECIFICATIONS section lists **PTO 540/750**, while the feature section says **590/755**. **No PTO row was published for either 305 variant**, and no assumption that the modes are equivalent was made. Model pages also contain conflicting marketed power 27HP vs 24.5HP. No exact nominal engine or PTO hp is inferred. 
- The web page’s **21–35 HP** value belongs to the broad Mahindra product range. The old model draft `engine_power_range` row remains stored but **unverified** (`verified_at=NULL`) and is not released as exact model rated power. All three tractor headlines have `horsepower=NULL`, and `model_year=NULL`.
- `rear_lift_capacity` measuring point, sold regional packages, and original loading/ballast state are not in these source pages. Avoid asserting particular measurement standards.

### Transaction verification and RLS
The production SQL committed under exact model, manufacturer source ID/URL, unchanged draft identity, distinct canonical keys, numeric critical-field and prior batch id guards; all original records were privately backed up first. Independent follow-up SELECT verified 3 published models with source-linked evidence counts **13/12/12**, all 37 rows exposed only through `public.tractorvs_public_specs`; private backup rows **40**; public view keeps `security_invoker=true, security_barrier=true`; `anon` cannot read private `tractorvs_image_candidates`. No RLS/grants/Auth/photo/SEO slug table changes.

### Release sequence — do not claim unmeasured Google indexing
1. Merge this reviewed `site/docs/publication-checkpoints/**` report after CI green. Existing trusted-main, anonymous-RLS-only, zero-paid GitHub catalog fingerprint sync should then update from **230 models / 6,113 public specs** to **233 models / 6,150 public specs**.
2. Check actual Git-connected Cloudflare deployed model pages in **10 locales**, each canonical/hreflang and sitemap metadata after the new build; do not assume the 2330 statically generated pages are live until the audit confirms.
3. The Google Search Console sitemap last reported 1,830 URLs on 19 November 2026; the deprecated `indexed` field is not the genuine indexed-page count. Check GSC **Page Indexing** and URL Inspection separately.
4. Further investigation: contradictory Mahindra **OJA 2121** 2WD headline vs 4WD tech table, 305 PTO/engine power; 235 remaining drafts; Agrale 540 XT conflicting OEM editions; model-exact licensed photos and PR #127 eight-language encyclopedia QA.

Independent **read-only** SQL: `supabase/verification/20261121_mahindra_233_jivo_audit.sql`. Never automatically revert/delete published models without downstream URL/user FK review and snapshot-based exact replacement plan.
