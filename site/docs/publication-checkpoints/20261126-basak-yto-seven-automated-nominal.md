# Seven-model OEM nominal catalogue publication — 2026-11-26

Decision: automated_evidence_review, existing owner-approved nominal publication protocol (2026-11-25).

## Scope
| Public model | Market / scope | Retained technical facts |
| --- | --- | ---: |
| Başak 2080 BB | Türkiye, 4WD / Stage IIIA / 16F+8R / open platform | 34 |
| Başak 2090 S | Türkiye, Stage IIIA / 24F+24R / cabin | 35 |
| Başak 5075 Red Power | Türkiye, Stage V / 16F+8R | 33 |
| YTO NLX904-1 | International, NLX 12F+4R catalogue | 23 |
| YTO NLX954-1 | International, NLX 12F+4R catalogue | 23 |
| YTO NLX1054-1 | International, NLX 12F+4R catalogue | 23 |
| YTO NLX1104-1 | International, NLX 12F+4R catalogue | 23 |

Exact public manufacturer sources:
- https://basaktraktor.com.tr/urunler/traktorler/bahce-traktorleri/2080-bb
- https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2090-s
- https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5075-red-power
- https://ytocorp.com/5-5-2-90-110hp-tractor-nlx-nly-series.html

Manufacturer nominal claims, not independent measurements. Türkiye product-page configuration is distinguished from other brochures/variants; production model year is not asserted. YTO's contradictory horsepower/kW labels remain withheld (eight claims); no inferred YTO headline horsepower. No photo, forum or unrelated catalogue changes.

## Actual preflight and transaction
- Reviewed OEM source evidence from 2026-11-25; checked exact product-page table evidence again 2026-11-26. The Başak direct endpoint presented bot verification; the publicly indexed exact Turkish product-page tables corroborated the reviewed source evidence. YTO source was retrieved directly.
- Private isolated Astro preview: exact 194-row anonymous-view rollback snapshot, SHA-256 matched before and after; 7 models, 10 locales, noindex + indexed test origin, 140 model HTML page assertions. No private candidate data placed in GitHub artifacts. Public offline toolchain from QA-only #733, source commit 6f7d5c06140ebcdbb8f79a4eac989830ecc8f614. Relevant catalogue release gates and translations from #719/#724 are included. Later unrelated forum/comparison/photo/sitemap changes remain intact and require normal production checks.
- Seven separately reconstructed evidence fingerprints matched the earlier reviewed fingerprints. Actual batch decision: 7 eligible, 0 invalid records, 0 held models, 8 held claims. No duplicate active model identity.
- Serializable exact-UUID transaction locked the models, 202 spec records and their sources; rehearsed anonymous/authenticated publication with an intentional rollback, matched the exact reviewed public snapshot, then backed up 7 model and 202 spec rows in private batch `20261126_nominal_basak_yto_7_private_preview`. Changed only these seven statuses and checked exact anonymous-view snapshot again before commit.
- Post-commit: 479 published (+7), 318 draft (-7), 22 archived; 11,572 anonymous public-view rows (+194). 209 private snapshots. Held claims not exposed. Rollback, if needed, is limited to the seven backed-up model statuses under row locks after checking for subsequent modifications; do not overwrite unrelated work.
- Full site deployment/SEO evidence is pending: existing free publication-autosync should refresh the public catalogue fingerprint; verify actual Cloudflare production and all 70 new model URLs, source links, canonical/hreflang/sitemap. No live-site or indexing claim yet.
