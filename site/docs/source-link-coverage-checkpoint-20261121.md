# TractorVS: precise source-link visibility checkpoint (2026-11-21)

This is a **display-only** audit. It does not invent new tractor specifications, republish source text, alter published status, or change the Supabase RLS policy.

## Evidence before this change
- The anonymous published view contains 379 published tractor models and at least one URL-backed, evidence-text-backed, verified-at-backed specification record for each.
- PR #266 measured 374/379 models with visible, approved source links after that change; the missing five are source-URL approval gaps, **not** proof of missing raw database source records.
- Exact outstanding records from the published database source query:
  - Agrale 4125: `https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-4125-1/330/`
  - Agrale 525: `https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-525-1/319/`
  - Agrale 575 Super: `https://pdf.agrale.com.br/2019/ficha-tecnica/en/tractor-agrale-575-super-1/255/`
  - Belarus 920 and 920.2: `https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf`

## Reviewed evidence and restricted rollout
1. The Agrale 525 and 575 Super original product-sheet documents were identified as PDFs at the exact manufacturer-owned `pdf.agrale.com.br` locations; the source titles and model-specific page contents agree with the recorded model identities. Allow only these **exact** already-dated and excerpt-backed source URL values for the **Agrale** brand; do not allow the whole `pdf.agrale.com.br` host.
2. The 2009 original MTZ 900-series operating manual explicitly lists 920 and 920.2 on its cover and is linked from the distributor's public service archive at `https://www.mtzequipment.com/service/older`. The URL **remains a third-party-hosted distributor copy**, never an official manufacturer URL. Allow only this exact original source with recorded `independent_catalog` type; retain independent attribution on the site.
3. **Hold Agrale 4125**: the old PDF endpoint could not be independently inspected in this audit. Do not treat a 525/575 specification sheet or a later 4125 variant as proof for it. Keep its existing published source record intact and investigate the exact document separately.

## Regression and release gates
- Both allowlists require an evidence excerpt, source URL, proper source type, and verification timestamp.
- No query parameters, sibling URLs, unrelated brands, mirror domains, or blank evidence accepted.
- Compare actual production source index counts after merge/deploy; **378/379 is an expected bound, not a confirmed live metric** until checked.
- Browser checks and SEO/sitemap regression must pass before production release; a PR merge is not a verified deployment.

Rollback: revert this source-display-only PR. No database changes are necessary.
