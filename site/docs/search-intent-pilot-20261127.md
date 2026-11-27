# Search-intent pilot — 27 November 2026

Status: prepared, not tested or released. No private analytics counts are published.

## Candidate public references (individual page checks pending)
- [TractorData](https://www.tractordata.com/compare/): two-model comparison and full specification links.
- [LECTURA Specs](https://specs.lectura.de/de/type/landmaschinen/allrad-traktoren-ls/j27-gear-1167135): transmission-specific German technical page; Gear and HST are not interchangeable.
- [Tractor Junction](https://www.tractorjunction.com/hi/compare-tractors/): Hindi comparison intent; local-market price claims must not be inferred.
- [Tractorsheet](https://tractorsheet.com/): filter, compare, shortlist and serial-number tools.
- [Tractor-Info](https://tractor-info.com/about): normalized technical data and cross-model comparison.
- [Heavy Equipment Specs](https://www.heavyequipmentspecs.com/): comparison and sample-size context.
- [TractorSpy](https://tractorspy.com/): specification database.
- [Wikitractor](https://wikitractor.com/about): model history and comparison.
- [Tractor Data](https://tractor-data.com/): specification/pricing and comparison.
- [Traktorpool](https://www.traktorpool.de/gebraucht/a-Traktoren/24/): German marketplace, different transactional intent.
- [TAFE Turkey](https://tafetractors.tr/products/tafe-6028m-4wd): official product, configuration and comparisons.
- [Tümosan](https://www.tumosan.com.tr/tr/urunler/8095): official model specifications and comparison.
- [Sonalika International](https://international.sonalika.com/product/sonalika-125/): international listing; do not infer Indian availability or measured rated engine power.
- [Meksanlar](https://meksanlar.com/traktor/tumosan-8095): dealer model page and purchasing intent.

These are research leads, not a verified 30-domain competitor audit. The feature descriptions and exact public links require independent page-by-page revalidation before external use. The Search Console landing-page evidence in the follow-up is separate and was actually checked. No competitor text, specifications or media are copied.

## Change
Use the already-present model comparison action in the search description of twelve selected landing pages across EN/TR/DE/HI/PT-BR only where the entire existing evidence-aware description and a short localized sentence fit within the existing advisory length. Do not change URLs, exact model or market, numerical claims, source provenance, visible copy, JSON-LD, or out-of-pilot pages. Empty specification records are excluded.

## Acceptance after explicit TEST
Review against then-current main and open PRs; run existing required checks and the new pilot regression. Check rendered metadata for the 12 pilot URLs and matched unchanged control pages. A cue may legitimately be omitted where space is insufficient. Verify all languages and live comparison actions through existing release gates. Measure page-level CTR and impressions over comparable settled periods, controlling for changes in rank and device, with no traffic guarantee. If the pilot is unhelpful, remove the bounded change. No release or test on DEVAM.


## Follow-up evidence — 2026-11-27
All original eleven pilot URLs were matched exactly to the settled Search Console page report (19–25 November). The additional German LS J27 HST page at /de/tractors/ls-tractor-j27-19685234/ and GEAR page at /de/tractors/ls-tractor-j27-e424cd0c/ returned HTTP 200, indexable metadata and distinct transmission-specific titles in the live read-only audit. Their existing description lengths allow a short German variant comparison cue in principle; actual rendered output must be checked after TEST. No private analytics counts are recorded here. Existing related-model ranking already prioritizes the same model's variants. Leave TractorDetail and related-tractors unchanged because active PRs #775, #758 and #757 touch those paths. Scope remains metadata only, and no new indexable comparison URL is created. The original generic comparison cue remains for other pilot pages. No tests or publication initiated.

## Verified reference pages — 27 November 2026
Live Firecrawl retrieval returned HTTP 200 for [TractorData comparison](https://www.tractordata.com/compare/) (two-model basic comparison and full detail links), [Tractorsheet](https://tractorsheet.com/) (its homepage describes dimension illustrations, filters, comparison and saved models), and [Pine Plains compact tractor comparison](https://www.pineplainstractor.com/compact-tractor-specifications-loader-lift-comparison) (dealer educational resource distinguishing weight and dimension definitions). These are observations of those specific pages, not a market-wide feature audit or endorsement of their figures. A candidate LECTURA category URL returned 404 after redirect; Tractor Junction retrieval failed. They remain unverified, as do other candidate references. Based on the observed user task, add an original ten-language physical-fit checklist to the existing selection guide: measure actual access, inspect fitted dimensions and compare weight definitions, without assuming safe clearance, stability or load capacity. No third-party text, images or model specifications imported. No new public route or test execution.
