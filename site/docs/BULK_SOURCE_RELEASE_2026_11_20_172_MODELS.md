# TractorVS — 20 November 2026 manufacturer-verified bulk source publication (172 public models)

## Audited production checkpoint
- Supabase: `aaufxtcvnzgavtlintiv`
- Initial live status **160 published / 300 draft / 2 archived**; final **172 published / 288 draft / 2 archived** (total catalogue stays 462).
- Public view `public.tractorvs_public_specs`: **172 distinct published models / 5,273 source-backed technical specification rows**, zero linked draft-model rows in postflight check.
- Exactly **12 new published Swaraj models** in the three guarded atomic publication groups below. These 12 currently expose **346** technical rows, of which **344 pre-existing** rows were independently rechecked, evidence-dated and source-linked, while **two additional** exact-manufacturer sourced values were inserted (855 FE 2WD rear track 1,430 mm, 724 XM cylinder bore 110 mm).
- All 346 released rows have an original manufacturer URL, populated evidence and a verification timestamp. This is not a declaration that all 346 data values are newly discovered or that Google has indexed the models.
- **Only confirmed database/public view results**. `https://tractorvs.com/tractors/`, `/tr/tractors/`, sitemap and robots could not be fetched with the available web client. Astro static pages require their own successful build + Cloudflare deploy and independent live verification.

## Batch 1 — manufacturer individual FE / XT pages, five models

| Tractor | Released technical rows | Manufacturer exact-model table |
| --- | ---: | --- |
| Swaraj 735 XT 2WD | 27 | https://www.swarajtractors.com/swaraj-735-xt-tractor |
| Swaraj 744 FE 2WD | 29 | https://www.swarajtractors.com/swaraj-744-fe-tractor |
| Swaraj 744 FE 4WD | 29 | https://www.swarajtractors.com/swaraj-744-fe-4wd-tractor |
| Swaraj 855 FE 2WD | 29 | https://www.swarajtractors.com/swaraj-855-fe-tractor |
| Swaraj 855 FE 4WD | 29 | https://www.swarajtractors.com/swaraj-855-fe-4wd-tractor |

142 original specs were checked. The 855 FE's own 2WD page lists **rear wheel track 1,430 mm**, absent in the initial data, which was inserted as one new source-and-date-linked technical record. 2WD and 4WD model records are separate; producer gearbox options, tyres, PTO optional multi-speed, clutch and axle choices must not be presented as universal standard. Power-category bands 41–45 HP / 46–50 HP are labeled **manufacturer segments, not exact ECE rated motor HP**. Manufacturer 744 FE 4WD webpage's *tyre section label* says 2WD despite 4WD page; 4WD-specific axle and model identity govern. 735 XT 4WD is intentionally **not published** due to inconsistent copied 2WD section in its current official page.

## Batch 2 — older XM / Orchard models, four models

| Tractor | Released technical rows | Manufacturer exact-model table |
| --- | ---: | --- |
| Swaraj 724 XM | 30 | https://www.swarajtractors.com/swaraj-724-xm-tractor |
| Swaraj 724 XM ORCHARD | 30 | https://www.swarajtractors.com/swaraj-724-xm-orchard-tractor |
| Swaraj 724 XM ORCHARD NT | 30 | https://www.swarajtractors.com/swaraj-724-xm-orchard-nt-tractor |
| Swaraj 825 XM | 29 | https://www.swarajtractors.com/swaraj-825-xm-tractor |

118 original technical rows independently checked and one exact 724 XM engine cylinder-bore row **110 mm** newly sourced from the manufacturer's specific engine table. Never confuse the variants: 724 XM standard 8F/2R/1670 kg; Orchard 6F/2R/1435 kg, Orchard NT 6F/2R/1530 kg with narrower track. For 724 XM, the manufacturer page short summary calls displacement 1824 cm³ but its detailed engine table states **1823 cm³**; 1823 is retained with explicit manufacturer discrepancy note. The short summary also contradicts the detailed page's 540 rpm standard PTO and standard dry-disc brake; detail controls with note. For 825 XM the manufacturer *detailed* page states displacement **1537 cm³** but also gives 170 mm bore × 136 mm stroke, which is mathematically incompatible; the bore was **not inserted**. 724 XM Orchard NT overall width 1110 mm per the exact technical table differs from an unexplained 1092 mm marketing statement; retain provenance note and do not silently merge metrics.

## Batch 3 — newer XT / Protek maker technical pages, three models

| Tractor | Released technical rows | Manufacturer exact-model table |
| --- | ---: | --- |
| Swaraj 742 XT 2WD | 29 | https://www.swarajtractors.com/swaraj-742-xt-tractor |
| Swaraj 744 XT 2WD | 29 | https://www.swarajtractors.com/swaraj-744-xt |
| Swaraj 855 FE Protek (explicitly 2WD and 4WD configurations) | 26 | https://www.swarajtractors.com/swaraj-855-fe-protek-tractor |

84 prior spec rows released. 855 FE Protek is a manufacturer product range with **separate 2WD and 4WD dimensions** (length 3580/3730 mm), wheelbase varies with tyre configuration, and 12F+3R standard vs optional 12F+12R; retain in one model record only with explicit configuration labels. **Do not** flatten into one vehicle specification.

## Atomic controls and what to do next

- Each batch validated known brand, specific draft UUID, model name, expected existing row count, distinct canonical keys, critical powertrain/weight/displacement/drivetrain values, and exact manufacturer source URLs before changing status. A mismatch raises an exception and rolls back the entire transaction. All original evidence was retained and supplemented; original date stamps were preserved.
- `tractors`, `tractor_specs`, and `data_sources` RLS policies were not modified. Postflight public view had **zero draft rows**.
- Remaining unpublished verified/source-partial family priorities: ZETOR 5110 / 5120 legacy names (do not confuse with current manufacturer 5115 / 5125!), Swaraj 843 XT (2WD/4WD composite model), Swaraj 843 XM (**manufacturer 1,650 kg vs database 1,500 kg and other conflicting dimensions**, must review), Swaraj 735 XT 4WD official page copied 2WD specs, further Mahindra, Iseki, Kioti, Antonio Carraro/Sonalika drafts. Avoid republishing these 12.
- **Zero paid Gemini / TinyFish calls**. Continue other manufacturer families by exact model/market/variant, cite source and validate every row; do not inflate published count by blindly stamping `verified_at`.
- Static-SEO follow-up: GitHub `site/src/data/public-catalog-sync.json` still showed **151 published / 4,661 technical rows** at inspection (a stale previous-build trigger); ensure free public-view autosync updates its checksum based on actual anon JSON and that Cloudflare produces the 172 live model URLs, 10-language `hreflang`/canonical and sitemap correctly. Do not invent a checksum or claim deployment without live build evidence.
