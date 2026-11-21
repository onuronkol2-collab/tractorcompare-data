# TractorVS — Antonio Carraro TIGRE 3800 (non-F) evidence-gated publication

Audit date: 2026-11-21
Batch: `20261121_ac_tigre3800_nonf_evidence_v1`
Public tractor UUID: `fc5f6f1d-a048-41d6-88f6-4ce1cf08d7b4`

## Manufacturer confirmation

**TIGRE 3800** and **TIGRE 3800 F** are separate original OEM models. Their official specification boxes and hydraulic lift values differ. The NON-F model's English and Italian manufacturer websites match on:
- Yanmar three-cylinder Stage V engine, **1331 cc** (distinct from the unresolved 1331/1642 cc source mismatch of TIGRE 3800 F)
- 8 forward / 4 reverse, isodiametric four driven wheels, 275 mm ground clearance, 2870 mm turning radius
- **1050 kg manufacturer-listed weight**, measurement condition unstated; **850 kg lift**, measurement point unstated
- PTO synchronized with all transmission speeds
- Manufacturer power labelled **25.7 HP** on English page versus **25.7 CV** on Italian page. No ISO/SAE test standard; power retained under `manufacturer_engine_power_unspecified_standard`, not a certified rated HP field.

Official manufacturer webpages checked at HTTP 200:
- https://www.antoniocarraro.it/en/catalogue/tigre-3800
- https://www.antoniocarraro.it/it/catalogo/tigre-3800

No production year or sales market was supported by the page metadata; both remain NULL rather than asserting worldwide coverage.

## Transaction and release

- Original 1 draft tractor + 7 existing spec rows snapshotted privately in `tc_backup.tractor_publication_patches` before any edits.
- Seven original facts revised with verified literal OEM excerpts, dated verification and precision labels.
- Eight distinct additional official-source-backed facts inserted; their exact IDs are tagged `__created_in_batch=true` in the private rollback table.
- **15/15** public facts visible, **15 distinct canonical keys**, each with excerpt/source, no duplicate facts and no draft record leakage.
- No RLS, auth grants, private backups, source table schemas, image assets or already published model records changed.
- Independent postflight inventory: **272 published / 196 draft / 10 archived**; the same batch also reviewed MACH 2 R (8900 R), 17 verified facts, and TIGRE 3800 F, 10 verified facts.

## Rollback & website SEO

If a genuine fault is identified, a reviewed transaction should remove only this batch's eight `__created_in_batch=true` rows and restore the original tractor and seven spec rows from private backups, with exact UUID/version guards. No rollback performed.

This checkpoint commits a documented source-review decision and triggers the pre-existing GitHub public catalogue fingerprint refresh. A GitHub workflow completing does not prove Cloudflare deployment or Google indexing. Independently verify live model URL, 10 locales and x-default, canonical, sitemap, robots and mobile behaviour.
