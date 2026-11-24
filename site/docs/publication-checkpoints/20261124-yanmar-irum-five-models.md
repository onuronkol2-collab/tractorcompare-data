# Yanmar Indonesia and IRUM Romania publication checkpoint — 2026-11-24

User authorized continuation of catalogue publication. Five exact model records were reviewed against four original manufacturer HTML technical tables and published by a serializable guarded transaction. This is a DB publication checkpoint, not a claim of independent laboratory measurements or live Cloudflare deployment.

| Brand/model | Market | Evidence-backed visible spec rows |
|---|---|---:|
| Yanmar EF393T | Indonesia | 24 |
| Yanmar EF494T | Indonesia | 23 |
| Yanmar YM351A | Indonesia | 24 |
| Yanmar YM357A | Indonesia | 24 |
| IRUM TAGRO 102 | Romania | 22 |

Sources:
- https://www.yanmar.com/en_id/agri/products/tractor/ef393t/
- https://www.yanmar.com/en_id/agri/products/tractor/ef494t/
- https://www.yanmar.com/en_id/agri/products/tractor/ym351a_ym357a/specs.html
- https://www.irum.ro/lista-de-utilaje/tagro-102/

Preserved OEM nominal claims, PS vs hp vs kW, PTO vs engine output, kgf/kN vs mass, equipped vs base weights and measurement conditions. YM series data are approximate per OEM. Model year and unknown summary fields remain null. No source text or photos republished as assets. No claim of independent reviewer identity or independently measured performance. The exact model-specific review was performed against original tables under explicit user authorization; no broad approval of other drafts.

Preflight: 5 exact reviewed identities, 117 evidence-linked nonempty unique canonical keys, zero unchecked rows, zero same-identity duplicates, no draft rows exposed in public view. In a single serializable transaction, locked model and specification rows, matched reviewed fingerprints and exact source URLs, backed up 5 tractor +117 spec rows in RLS-protected private `tc_backup.tractor_publication_patches` batch `20261124_yanmar_irum_5_oem_release_v1`, changed only status and updated_at, and verified 117 eligible rows and 5 models under the anon role before commit. No RLS/schema/privilege changes.
Post-commit: 395 published / 387 drafts / 84 final-review candidates, 122 backups confirmed. Restore only the five original statuses from batch snapshots after checking subsequent changes, then resync; never overwrite later facts.
This checkpoint triggers existing zero-paid published-catalog sync on main. Verify PR build/safety, main sync, production deploy and actual live model routes in all ten locales separately. Do not claim those are complete from this file. No paid API calls or new photos.
