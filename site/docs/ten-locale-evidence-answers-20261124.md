# Source-backed model answers in all ten languages — 2026-11-24

## Problem and scope
The existing six-field answer section only rendered in English and Turkish, while actual search demand also exists in German, Hindi and other locales. The public source records for LS J27 GEAR/HST, Swaraj 735 FE, Steyr 6440 CERVUS CVT and other models are a concrete starting point. No private Search Console metrics are included in this public repository.

Competitive references inspected: TractorData LS J27 https://www.tractordata.com/farm-tractors/008/2/3/8231-ls-j27.html ; LECTURA LS J27 HST https://specs.lectura.de/de/type/landmaschinen/allrad-traktoren-ls/j27-hst-1134842 ; LS J27 Gear https://specs.lectura.de/de/type/landmaschinen/allrad-traktoren-ls/j27-gear-1167135 ; manufacturer Hindi Swaraj page https://www.swarajtractors.com/hi/swaraj-735-fe-tractor . Competitor pages are examples of available content, not confirmed Google rankings or copied data. Only already-reviewed TractorVS public spec rows supply numeric claims.

## Change
Translate actual questions, answers and provenance labels to eight additional locales. Same selection gate, source URL, conflicting measurement rejection, unit rules and max six items. Display original source/measurement notes without silently reinterpreting them. HP remains HP (not PS/CV); kgf is not kg; cc is not implicitly accepted by the existing exact litre answer gate. Never infer rated power from a manufacturer class or summary HP. Short actual variants are included in questions, e.g. J27 GEAR and HST. Only EN/TR have all three term guides; other locales receive a clearly labelled link to the existing English methodology, not nonexistent localized URLs. No new routes, schema, data writes, analytics, photos or title logic.

## Acceptance
Existing geo-evidence tests plus ten-locale parity, exact-source LS and Swaraj fixtures, missing evidence and conflicting values. Preview/live verification should confirm visible localized questions and original source links on the actual German and Hindi routes after deployment. Unit fixtures are not live deployment proof. Recheck Search Console query/page metrics on a comparable later period; no ranking or indexing guarantee. Rollback by reverting this PR only.

## Follow-up: preserve existing EN/TR HTML
The first preview correctly rejected 3,540 significant changes (354 per language), including avoidable EN/TR edits. Preserve existing EN/TR number format, names and methodology link attributes. Variant qualifiers are limited to the eight new languages in this release. The expected upper bound for new-language pages is 8 × 390 = 3,120 of 3,996 existing HTML pages; actual changed count must come from the production-catalog preview. The 85% guard remains entirely unchanged. Re-run all gates on the updated branch, including the new parallel browser test workflow from main. If the preview still rejects, investigate actual render differences rather than bypassing the guard.
