# TractorVS — source-verified bulk publication checkpoint (20 November 2026, 160 published)

## Scope and postflight

This checkpoint records **nine new Supabase publications** promoted with model-UUID-scoped, count-guarded atomic transactions, after a fresh reading of the corresponding model-specific manufacturer technical tables.

- Database project: `aaufxtcvnzgavtlintiv`
- Start: **151 published / 309 draft / 2 archived**.
- End: **160 published / 300 draft / 2 archived**.
- `public.tractorvs_public_specs`: **160 distinct published models / 4,927 source-linked technical rows**, **zero draft-model rows**.
- The nine published models expose **266 technical rows**, all with non-null `source_id`, source URL, model-specific `evidence_text`, and `verified_at`; zero blank dates, evidence texts or source URLs across the nine models.
- This is a **database/public-view publication**, *not* proof that an Astro static rebuild, Cloudflare deployment, sitemap update or Google index update happened.
- Row accounting: nine models have 266 currently published specs; **16 new Swaraj attributes inserted, one exact-key duplicate removed; four unconfirmed Kioti split-hydraulic rows excluded after preservation in review records**. Do not claim all 266 rows were brand-new insertions.

## Manufacturer-family verification

| Source family and exact published records | Models | Published, source-backed spec rows | Primary manufacturer URL |
|---|---:|---:|---|
| ZETOR PROXIMA CL / GP / HS (Stage V, Europe; family/series variant pages, not fabricated individual 100/110/120 model-year claims) | 3 | 66 (22 each) | https://www.zetor.com/zetor-proxima-technical-parameters |
| ZETOR MAJOR CL 80 (Europe Stage V) | 1 | 37 | https://www.zetor.com/zetor-major-technical-parameters |
| ZETOR Series 5 – 5100 (Europe Stage V) | 1 | 31 | https://www.zetor.com/series-5-technical-parameters |
| Swaraj 735 FE, 2WD, India | 1 | 27 | https://www.swarajtractors.com/swaraj-735-fe-tractor |
| KIOTI CX2510 manual/gear US, CX2510H open-station HST US, CX2510H CAB factory cabin US | 3 | 105 (35 each) | https://www.kioti.com/products/tractors/cx/cx2510 ; https://www.kioti.com/products/tractors/cx/cx2510h ; https://www.kioti.com/products/tractors/cx/cx2510hcb |

### Invariants and corrections

- ZETOR PROXIMA: Page columns distinguish CL (12/12 manual mechanical shuttle), GP (16/16, 2-step PowerShift) and HS (24/24, electrohydraulic PowerShuttle, 3-step PowerShift). Manufacturer series model labels 100/110/120 were not misrepresented as ECE R120 rated model power. `market` set to `Europe`; all 66 rows tied to the manufacturer technical table.
- ZETOR MAJOR CL 80: `engine_power` was a **nominal model-label 80 HP** masquerading as actual engine output. Corrected to **75.3 HP rated ECE R120** per manufacturer. Label corrected to `CL 80`. The other source fields retained the exact model's 4-cylinder 2,925 cm³ and 300 Nm, 12F/12R and 50 L/min data.
- ZETOR 5100: 102 HP / 75 kW maximum ISO14396 (not ECE R120) and rated 2,300 rpm, 415 Nm, 24F/24R, 65 L/min are tied to the **5100** manufacturer column, not 5115/5125.
- Swaraj 735 FE: Current exact-model manufacturer page lists **2,734 cm³** in its specification section and model description; earlier stored warning about a 2,592 cm³ inconsistency was stale, and was not repeated as a live conflict. Fifteen/other fields such as 2WD, 8F/2R, 540 rpm PTO, 1,650 kg hitch and 47 L fuel match the page; 16 newly inserted fields are source-linked (bore, stroke, dimensions, tyres, clutch options, etc.). Manufacturer 31–40 HP is a product *power class*, not a certified specific output. Deleted one redundant source-listing power-range duplicate.
- KIOTI: US CX2510 manual 6F/2R, CX2510H hydrostatic two-range and CX2510H CAB factory cab are distinct. The CAB has U3 engine code, 1,272 kg, 2,820 mm length and 2,200 mm height, vs open-station models' U2, 1,047 kg, 2,790 mm and 2,103 mm. All remaining public rows were tied to each separate **US manufacturer live Full Specs page**.
- Current **US** CX2510H product page lists PTO 19.30 HP / 14.40 kW, while an earlier **UK** brochure had 18.8 HP / 14 kW. Two old brochure rows were archived to `tractorvs_spec_review_candidates` (`needs_review`) before updating US records to the US manufacturer values.
- Four additional Kioti implement/steering pump sub-flow rows (26 and 16.9 L/min in the two open-station models) relied on a 17 MB owner manual inaccessible for independent page-level inspection during this run; those rows were **preserved in the RLS-protected review candidate table before removal from live specs**. Each US product page still verifies total pump flow **42.9 L/min**. **Six review candidates** in all retain provenance and issues. There was no undisclosed speculation on source identity.
- Transactions were exact UUID scoped, prechecked counts, raised errors on mismatches, and ran with rollback semantics. RLS on `tractors`, `tractor_specs` and `data_sources` remains enabled. Public view check showed zero draft-model exposure.

## Deployment and further work

The site uses **Astro static output**. Database `status='published'` alone does not generate new static paths; after a GitHub main merge/production build, independently check model routes, all language page counts, sitemap, robots and canonical/hreflang. Do not claim an index change without Search Console confirmation. This release note does **not** authorize paid Gemini or TinyFish research.

Next backlog priority: free manufacturer-backed draft families (Swaraj model-specific product pages, ZETOR remaining Series 5 variants, Antonio Carraro, Mahindra OJA, etc.). Continue grouped research and guarded publication; do not re-publish the above nine.
