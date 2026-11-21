# Licensed tractor photography — 21 November 2026, Steyr two-model batch

## Approval

Two public model pages already exist in TractorVS and lacked approved
photographs. Their exact third-party Wikimedia Commons files were checked with
the MediaWiki imageinfo API against the model number, author, CC rights, source
resolution, MIME type and a real 500-pixel JPEG derivative, with a recorded
SHA-256 hash.

| Published tractor | Wikimedia file | Author | License |
|---|---|---|---|
| Steyr 4085 KOMPAKT | [Steyr 4085 Kompakti Ecotech.jpg](https://commons.wikimedia.org/wiki/File:Steyr_4085_Kompakti_Ecotech.jpg) | JoachimKohler-HB | CC BY-SA 4.0 |
| Steyr 6340 TERRUS CVT | [Steyr 6340 Terrus CVT Agritechnica 2023.jpg](https://commons.wikimedia.org/wiki/File:Steyr_6340_Terrus_CVT_Agritechnica_2023_%28DSC04861%29.jpg) | MarcelX42 | CC BY-SA 4.0 |

Source/rights evidence and local 500px JPEG checksums:
`site/docs/steyr-photo-source-audit-20261121.json`. The photos are licensed
by their authors, not owned or invented by TractorVS. Correct photo
attribution, the [CC BY-SA 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/)
and a note that the image is a resized derivative remain required.
Year, market, the pictured EcoTech equipment, engine and transmission
configuration are **not** assumed to match the published tractor's specific
technical record. Existing translated configuration notices remain visible.

## Explicitly rejected

The investigated `Steyr Absolut 6240.jpg` has both a public-domain
dedication and a Creative Commons licence statement on the Wikimedia page.
The MediaWiki API returned **Public domain**, not the expected explicit
CC metadata. The original CC/license evidence gate therefore rejected it
rather than trying to infer its right status. Steyr **6240 ABSOLUT CVT**
remains unpictured by this batch; a safer source may be researched later.

## Release checks

- 2 first-party `-480.jpg` true JPEGs; model-specific Commons original URLs
  remain on the fixed allowlist for 960px and 1920px gallery resolution.
- 2 unique approved model keys, 0 ambiguous model-year or market claims.
- SHA-256/byte lengths, author, exact source file and CC rights across ten
  `ImageObject` locale variants tested in `site/tests/tractor-photos.test.mjs`.
- Temporary privileged downloader script and workflow removed from PR.
- Existing security/RLS, unpublished tractors, user/forum/analytics data,
  canonical/hreflang, sitemap architecture and budget unchanged.
- Merge only if Site Build, Golden Rule, production bundle and browser/axe-core
  succeed. Verify live image HTTP 200, source credit, license and image-sitemap
  after deployment. GitHub merge is not live publication or Google indexing.

Rollback: revert PR squash commit (two photos and metadata).
