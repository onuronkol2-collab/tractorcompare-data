# Hattat and Başak six-model publication checkpoint — 2026-11-24

Six exact Türkiye catalogue records published after direct OEM technical review. 245 evidence-backed public specs including 83 newly added rows, 168 private rollback snapshots in batch 20261124_hattat_basak_six_oem_release_v1. Verified under anon role before commit; post-commit per-model counts rechecked.

| Model | Public specs |
|---|---:|
| Başak 2055 4WD | 39 |
| Hattat B 3055 | 42 |
| Hattat B 3065 | 42 |
| Hattat B 3085 | 42 |
| Hattat B 3095 | 40 |
| Hattat B 3105 | 40 |

Original sources:
- https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/2055
- https://www.hattattraktor.com.tr/Upload/Sayfa/Hattat%20B3000%20Spec%20-%20Stage%20V-1.pdf
- https://www.hattattraktor.com.tr/Upload/Sayfa/3000B_STAGEV_EN.pdf
- https://www.hattattraktor.com/Upload/Sayfa/3000B_STAGEV_EN.pdf (manufacturer mirror used for visual inspection after .tr screenshot timeout)
- https://www.hattattraktor.com.tr/stage-v-fiyat-listesi (exact Turkish ROPS/4WD/12F+12R configurations)
Independent contextual corroboration: https://www.jaltest.com/en/coverage/6/488/veicolo-agricolo-diagnosi/hattat/ and https://emlakkulisi.com/tarlasina-traktor-alacak-ciftciler-hemen-bakin-basak-traktorde-bu-fiyatlari-kacirmayin-pes-pese-aciklandi/759017. Not independent measurements or reliability evidence.

Five Hattat variants normalized to Stage V · 4WD · ROPS · 12F/12R. Shipping weight and dimensions sourced from five-model PDF, not used as operating weight. Front PTO fitment not inferred. Corrected label for brake-triggered 4WD engagement (not independently measured braking performance); Başak disc-brake wording corrected to match source. Başak promotional vs table gearbox count discrepancy retained under review, no added gear count. Model years not inferred. Reviewed fingerprints and exact source URLs guarded in a serializable transaction; private backup permissions checked. No schema, RLS, photo or paid API changes. Rollback only exact changes after checking intervening work.

Post-commit 442 published, 347 drafts, 37 final-review candidates, 13,617 spec rows, 46 brands. Previous PR #614 merged after 3 successful checks. Checkpoint triggers existing public catalogue sync after CI; production HTML and all ten locales not yet verified (live sitemap retrieval unavailable). Solis S26 HST source timed out and held.
