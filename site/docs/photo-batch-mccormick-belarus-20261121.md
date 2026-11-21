# TractorVS — licensed model photo batch (2026-11-21)

## Approved published-model photographs

Three already-published TractorVS tractor models lacked an approved model photo. Their
original Wikimedia Commons image metadata and locally mirrored 500-pixel JPEG
derivatives were checked via the one-time source validation run. Each author's
credit and their specific Creative Commons license are preserved. **No generated
tractors or unauthorized manufacturer photos were substituted.**

| Exact published model | Original file page | Photographer | License | Original dimensions | Local 500px thumbnail |
|---|---|---|---|---|---|
| McCormick X4.080 | [Commons](https://commons.wikimedia.org/wiki/File:McCormick_X4.080%2C_Agritechnica_2023%2C_Hanover_%28P1140946%29.jpg) | MB-one | CC BY-SA 4.0 | 3371×2697 | 76,467 B |
| McCormick X8.631 VT-Drive | [Commons](https://commons.wikimedia.org/wiki/File:McCormick_X8.631_VT-Drive_Agritechnica_2023_%28DSC05857%29.jpg) | MarcelX42 | CC BY-SA 4.0 | 7008×3944 | 56,381 B |
| Belarus 952.3 | [Commons](https://commons.wikimedia.org/wiki/File:Belarus_952.3_Tractor_in_Bucharest_2011.jpg) | Gabinho | CC BY-SA 3.0 | 2592×1944 | 69,122 B |

The full file identity, source URL, license URL, original dimensions, artist
field and JPEG SHA-256/byte size are stored in
`site/docs/photo-import-evidence-mccormick-20261121.json`.

Creative Commons license terms:
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
Credit the creator, retain source/license links, and indicate resizing as a
modification. Attribution never implies the photographer endorses TractorVS.

## Rejection: McCormick X5.085

The first-party Wikimedia API lookup did **not** return an unambiguous,
exact-model source matching the proposed candidate. No photo has been added for
McCormick X5.085. A model-family photo or a differently named tractor must not
be used as an unsupported replacement. Further investigation requires a source
that unambiguously names X5.085.

## Safety and SEO expectations

- **Model matching:** McCormick X4.080 and X8.631 VT-Drive are distinct from
  other series/drivetrain configurations. Belarus 952.3 is separate from
  Belarus 952.2 or 952.4. Do not inherit across variants.
- **Gallery:** Existing fixed first-party Worker allowlist maps `*-480.jpg`
  to committed real JPEG assets and `*-960.jpg`/`*-1920.jpg` to the
  **same** reviewed Wikimedia original. No remote URL supplied by visitors.
- **10-language content:** Existing localized image alt text, source credits,
  license URLs, variant-representativeness notices and `ImageObject`
  structured data are reused. Images alone cannot substantiate model year,
  engine specifications, purchase price, performance or test results.
- **Verification:** The photo test checks the exact file IDs, content hashes,
  CC license URLs and `ImageObject` records across ten locales.
  The full pre-merge CI and accessible browser tests must pass.
  A GitHub merge alone does not prove deployment or indexing; verify
  the three tractor model pages, first-party images and image-sitemap
  on the **actual live site** before reporting success.
- **No production data mutation:** Supabase SQL/RLS, forum, indexing policies,
  user analytics/consent and source-linked tractor specifications are unchanged.
  The one-time downloader and write-enabled workflow were removed before this
  batch is proposed for merge.

**Rollback:** Revert the single squash commit containing these three photo
metadata records and JPEG files. The persistent photo automation is separate
and was not modified.
