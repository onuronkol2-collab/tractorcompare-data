# Eicher and Farmtrac India — 2026-11-24 publication checkpoint

Four previously drafted exact model/variant records published in Supabase following direct OEM technical review and user-authorized release. Public anon role verified in the same serializable transaction: 4 model records, 56 sourced rows. 60 private rollback snapshots, batch 20261124_farmtrac_eicher_4_oem_release_v1. Fingerprints, exact source URLs, evidence, duplicate identity and backup access checks passed before commit. No schema, RLS, or photo changes.

| Model | Market / variant | Verified specs |
|---|---|---:|
| Eicher 380 | India / PRIMA G3 2WD | 14 |
| Eicher 380 | India / PRIMA G3 4WD | 14 |
| Farmtrac 45 Powermaxx | India / 2WD 8F+2R | 15 |
| Farmtrac 60 Powermaxx | India / 2WD T20 16F+4R | 13 |

Original manufacturer sources checked:
- https://eichertractors.in/eicher-prima-g3/
- https://eichertractors.in/eichertractors/eicher-tractor-380-4wd-prima-g3
- https://farmtrac.escortskubota.com/powermaxx/powermaxx-45
- https://farmtrac.escortskubota.com/powermaxx/powermaxx-60

Eicher 40 hp is a manufacturer advertised power range/category, not measured rated power; removed legacy header horsepower on both records, preserving sourced specifications. Farmtrac nominal category kept separate from exact rated power. Farmtrac 60 variant-dependent lift remains conditional; inconsistent engine displacement omitted. PREET old links returned 404; JCB 6260 CTIS applicability requires resolution (current JCB page specifies 6300); not included. No independent measurement or reliability claim. No new photo approvals. 

Post-commit DB count 399 published, 383 drafts, 80 review candidates. Existing checkpoint sync from PR #605 also sees the current public data fingerprint. This checkpoint provides traceability and a safe sync trigger; no claim of completed Cloudflare deployment or 10-locale live verification. Rollback only scoped records against private snapshots after checking subsequent changes; avoid overwriting later work.
