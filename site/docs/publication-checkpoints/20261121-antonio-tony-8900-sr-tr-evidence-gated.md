# TractorVS — evidence-gated publication checkpoint: Antonio Carraro TONY 8900 SR / TR

Date: 2026-11-21
Publication backup batch: `20261121_antonio_tony_8900_sr_tr_evidence_gated_v1`
Live database publication: succeeded; independently verified **268 published / 200 draft / 10 archived** at checkpoint.

## Released manufacturer-matched models

| Model | Tractor UUID | Market | Visible sourced specs | Manufacturer source |
| --- | --- | --- | ---: | --- |
| Antonio Carraro TONY 8900 SR | `0ebc6c93-b508-4600-b0e7-e7998759061f` | Europe | 15 | https://www.antoniocarraro.it/en/catalogue/tony-10900-sr |
| Antonio Carraro TONY 8900 TR | `d8be07cc-bcfd-4b79-a7af-3bda85f3c78a` | Australia | 14 | https://www.antoniocarraro.it/au/catalogue/tony-8900-tr |

The public page is a **manufacturer-configured model family** with Stage V engine and separately labelled ROPS vs Air cab weight ranges. Model year is not established by manufacturer evidence; no year fabricated. `horsepower` and `weight_kg` top-level scalar fields remain NULL to avoid treating unlabelled engine testing standards or configuration-specific weights as universal exact figures. Manufacturer-stated 74.2 hp at 2,400 rpm is exposed as `manufacturer_engine_power_unspecified_standard`, not ISO/SAE rated power.

## Audit and rollback

- Original state recorded in private `tc_backup.tractor_publication_patches`: exactly 2 tractor rows and 45 technical-specification rows, with batch id above.
- 28 precisely selected manufacturer-matched spec rows had citations/verification metadata normalized. Legacy rows were not deleted.
- Data publication was performed with locked transaction, prior-state guards and atomic rollback on failure. An initial preflight transaction failed the official-source check and rolled back without changing data; revised source mapping passed.
- Anon public view `tractorvs_public_specs` verified to expose **15 SR** and **14 TR** distinct, source-evidenced concepts. Zero draft leakage. RLS and private backup access rules were not changed.
- This checkpoint file is part of the existing GitHub publish-autosync push trigger. **Creating this file does not demonstrate successful Cloudflare deployment**, public URL HTTP 200, sitemap inclusion or Google indexing. Verify the downstream jobs and production URLs separately.

## Still held, not released

- Deutz-Fahr 5090 D: 2014 Ecoline/Tier 4i and newer Stage V data are mixed in one undifferentiated record.
- Agrale 540 XT: two overlapping draft rows and contradictory manufacturer technical PDF revisions.
- Swaraj 843 XM / 735 XT 4WD and Sonalika GT 22 4WD: model-page and recorded spec contradictions need side-by-side validation.

Do not release remaining drafts without explicit identity, market, model year and specification-standard evidence.