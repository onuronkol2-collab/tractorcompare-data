# Solis five Stage V models — 2026-11-24 publication checkpoint

Five Türkiye sales configurations published after direct assistant technical review of manufacturer nominal claims and user-authorized continuation. No independent human signoff or independent measured performance is claimed.

| Model | Public specs |
|---|---:|
| 50 Stage V ROPS | 33 |
| 60 HVAC Stage V | 32 |
| 60 Stage V ROPS | 31 |
| 75 HVAC Stage V | 32 |
| 90 HVAC Stage V | 34 |

Original sources inspected:
- https://www.solisturkiye.com/solis-50-stage-5/
- https://www.solisturkiye.com/solis-60-stage-v-ropslu/
- https://www.yanmar.com/tr/agri/products/solis_tractor/s60-stage5-cabin/
- https://www.yanmar.com/tr/agri/products/solis_tractor/s75-stage5/
- https://www.yanmar.com/tr/agri/products/solis_tractor/s90-stage5/
- https://www.solisturkiye.com/solis-90-hvac-stage-5/
- https://www.solisturkiye.com/solis-traktor-fiyat-listesi/ (August 2026 listing: exact 2025/2026 model-year, 4WD, cab/ROPS and radial-tire sales variants; 90 20+20 separately listed)
Dealer corroboration https://olmeztraktor.com/urunler; no independent field test asserted.

15 new nominal specifications (mechanical hitch control, top-link sensing, air filter where specified, 50 block heater), 32 additional uncertain claims held (tire package, dependent dimensions, conflicting 75 lift, 90 height and unladen mass). Existing 19 holds retained. Hydraulic flow unit ambiguity and 75 displacement conflict not normalized. 90 AdBlue 12 L linked to exact Solis Türkiye page. HVAC variants match listed original air-conditioned cabin and 12F/12R technical table, not 20F/20R. No photo changes.

Serializable transaction checked exact identities, reviewed fingerprints, source types and URLs, duplicate model names, private backup permissions. 203 before-state snapshots in batch 20261124_solis_stagev_five_oem_release_v1; anon role verified 5 models, 162 public rows and no unverified direct-table access before commit. No schema/RLS or paid API change. Prior #616 merged following three successful CI workflows. Checkpoint triggers existing catalog refresh following required CI and merge. Live sitemap fetch unavailable in this session; deployment and all-ten-locale live verification remain outstanding. Restore only scoped snapshots/new rows after checking later edits.
