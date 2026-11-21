# TractorVS licensed photo batch — 2026-11-21 (three published models)

## Publication boundary and evidence

This batch adds **three** exact-brand/model photographs to the current published
TractorVS catalogue. They are third-party photographs licensed by their authors,
**not** generated or owned by TractorVS. Country-specific, engine, year, cab and
equipment configurations may differ from the version in the site's technical
record. The existing 10-language "photographed equipment may differ" notice and
photo-specific attribution must remain visible.

| Published identity | Commons file page | Photographer | Native pixels | License |
|---|---|---|---|---|
| Belarus 892 | [Tractor arando la tierra para cultivo.jpg](https://commons.wikimedia.org/wiki/File:Tractor_arando_la_tierra_para_cultivo.jpg) | Ivan2010 | 2654 × 1880 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Belarus 892.2 | [Belarus 892.2, 2025 Dunapataj.jpg](https://commons.wikimedia.org/wiki/File:Belarus_892.2%2C_2025_Dunapataj.jpg) | Globetrotter19 | 2592 × 1944 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| Belarus 952 | [Belarus 952.jpg](https://commons.wikimedia.org/wiki/File:Belarus_952.jpg) | Fraxinus Croat | 2048 × 1536 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |

All three file identities, artists, Creative Commons license URL and image
dimensions were checked on **2026-11-21** through Wikimedia Commons metadata by a
one-time, branch-scoped GitHub Actions download. It rejected any other host,
non-JPEG content, incorrect license or size, and committed only the audited
500-pixel thumbnails as first-party `-480.jpg` catalog assets.

| First-party file ID | Bytes | SHA-256 |
|---|---:|---|
| `belarus-892-ivan2010-2013` | 76181 | `4412d1015324be161b611658d7ca0197a15eb932097afa6ca718c8a250253b73` |
| `belarus-892-2-globetrotter19-2025` | 61173 | `b6cc0abc6f890882ccc63866c0e32ace5595ed5044b5898673d45c3f8de3cf25` |
| `belarus-952-fraxinus-croat-2011` | 71983 | `5c96819a5f3b96b7d2361b7f6a679b2432f9028bec5b4f56b54780b0b31e5010` |

The one-time privileged download workflow and script were removed from the
feature branch immediately after successful source validation and binary
commit. Neither is part of the final production change set.

## Explicitly rejected / not published

- **Belarus 922.3:** A promising Commons file search result exists, but its
  identity could not be independently resolved through the strict MediaWiki
  file API during the batch. No photo, license claim or imaginary visual is
  published for this model. Research can resume in a separate batch.
- **McCormick X7.621:** Some photos do not identify P6-Drive versus VT-Drive.
  Neither variant is assigned a non-specific photo without stronger evidence.

## Final release checks

- Current `tractor-photos.test.mjs` verifies exact brand/model matching,
  author/license, fixed allowlist, local thumbnail JPEG signatures, ten locales
  and model-specific `ImageObject` reuse/credit links.
- Confirm GitHub build, production bundle check, Golden Rule integrity and
  Playwright/axe-core pass **on the final PR commit**.
- After the site's actual Cloudflare build is deployed, check each model URL,
  all three first-party `-480.jpg` assets and `-960.jpg`/`-1920.jpg`
  Worker routes (HTTP 200 + valid image JPEG), source credits, and public
  image-sitemap/canonical consistency. Do not conflate PR merge with
  deployment or Google indexing.
- No Supabase DDL, SQL, RLS, forum, marketing analytics or unpublished
  tractor state was changed. A merge can be safely reverted.
