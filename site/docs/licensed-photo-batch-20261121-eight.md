# TractorVS — Eight exact-model CC BY-SA tractor photographs (21 Nov 2026)

## Publishable scope

The eight images listed below were sourced individually from **Wikimedia Commons**
and underwent the one-time, source-based evidence gate committed as
`site/docs/photo-review-evidence-20261121.json`. This is third-party
photography under CC BY-SA 4.0; TractorVS **does not own the copyrights** and
never claims these are rendered by AI or exact year/market/configuration
reference photos.

| Published tractor | Wikimedia Commons source title | Photographer | License |
|---|---|---|---|
| Steyr 4075 KOMPAKT | [Steyr 4075 Kompakt.jpg](https://commons.wikimedia.org/wiki/File:Steyr_4075_Kompakt.jpg) | JoachimKohlerBremen | CC BY-SA 4.0 |
| Steyr 4095 KOMPAKT | [Steyr 4095 Kompakt mit Kuhn BRP28 Mulch- und Häckselgerät.jpg](https://commons.wikimedia.org/wiki/File:Steyr_4095_Kompakt_mit_Kuhn_BRP28_Mulch-_und_H%C3%A4ckselger%C3%A4t.jpg) | JoachimKohler-HB | CC BY-SA 4.0 |
| Steyr 4105 KOMPAKT | [2018-06-28 (801) Steyr 4105 Kompakt.jpg](https://commons.wikimedia.org/wiki/File:2018-06-28_%28801%29_Steyr_4105_Kompakt_in_Kirchberg_an_der_Pielach.jpg) | GT1976 | CC BY-SA 4.0 |
| Steyr 4115 KOMPAKT | [Steyr Kompakt 4115.jpg](https://commons.wikimedia.org/wiki/File:Steyr_Kompakt_4115.jpg) | JoachimKohler-HB | CC BY-SA 4.0 |
| Steyr 4130 EXPERT CVT | [Steyr 4130 Expert CVT agra 2024.jpg](https://commons.wikimedia.org/wiki/File:Steyr_4130_Expert_CVT_agra_2024_%28DSC01621%29.jpg) | MarcelX42 | CC BY-SA 4.0 |
| Steyr 4140 EXPERT CVT | [Steyr 4140 Expert CVT Agritechnica 2023.jpg](https://commons.wikimedia.org/wiki/File:Steyr_4140_Expert_CVT_Agritechnica_2023_%28DSC05407%29.jpg) | MarcelX42 | CC BY-SA 4.0 |
| Steyr 6280 ABSOLUT CVT | [Steyr 6280 Absolut CVT agra 2024.jpg](https://commons.wikimedia.org/wiki/File:Steyr_6280_Absolut_CVT_agra_2024_%28DSC02603%29.jpg) | MarcelX42 | CC BY-SA 4.0 |
| Zetor 6170 | [Zetor 6170 Agritechnica 2025.jpg](https://commons.wikimedia.org/wiki/File:Zetor_6170_Agritechnica_2025_%28DSC05468%29.jpg) | MarcelX42 | CC BY-SA 4.0 |

Each original source filename, pixel dimensions, photographer name, Wikimedia
license metadata and local 500px JPEG SHA-256 checksum are recorded in the JSON
evidence file. The full licence terms are at
https://creativecommons.org/licenses/by-sa/4.0/ and require attribution,
linking the license and indicating modifications. Downsizing is a modification;
the source and credited license must remain visible wherever these derived
photographs are displayed.

## Evidence and safeguards

- All eight entries were required to have a valid MIME `image/jpeg`, a
  500px source-rendered preview, JPEG SOI and EOI signatures, a bounded byte
  size, verified dimensions, exact model identity and a verifiable author.
  These aren't estimates; evidence is in the GitHub Action log and checked-in
  SHA-256 ledger.
- The 500px derivative is checked in as an efficient `*-480.jpg` website
  asset. The existing first-party, fixed-allowlist Cloudflare Worker proxies
  only preapproved `-960.jpg` and `-1920.jpg` remote sources.
- The website's existing 10-language representative-photo warning remains
  mandatory. The photo of a particular model does not prove its year, market
  equipment configuration, emissions standard, price, or real-world test.
- The page remains in the same established canonical/hreflang/robot/sitemap
  framework. `ImageObject.creator`, `license`,
  `acquireLicensePage`, image alt text and the photo credit must match.
- Source names are exact. A vetted inverse-title exception was allowed for
  `Steyr Kompakt 4115.jpg` = Steyr 4115 KOMPAKT. The general matching
  algorithm stays strict against unrelated or misleading variant names.
- **Belarus 922.3 not included:** The MediaWiki file identity lookup did not
  independently resolve an exact source filename; evidence is incomplete.
  It remains unpictured in this batch. A visible image search result alone
  does not authorize publication.
- Temporary photo-fetch tools and write-enabled GitHub workflow were
  explicitly deleted from the feature branch before merging. No credential,
  scheduled paid task, SQL, RLS, forum or tracking configuration changed.

## Publication gate / rollback

Before merge, `Site build validation`, `Golden Rule integrity`,
`Production bundle safety`, and `browser/axe accessibility baseline`
must all be green for this PR. The local 500px JPEG signatures and SHA-256
hashes, model identity, ImageObject links and translations have explicit
automated assertions.

Merge is **not** Cloudflare publication. After deployment, verify each
published model page, real HTTP 200 JPEG in first-party `-480.jpg` paths,
credit/attribution links, and image-sitemap. Do not promise Google image
indexing from a GitHub merge. Undo all changes by reverting the squash merge.
