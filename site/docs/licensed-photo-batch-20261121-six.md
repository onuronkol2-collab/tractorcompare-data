# Licensed tractor photo batch — 2026-11-21

## Scope and publication policy

Six previously photo-less **published** TractorVS models were checked against their
individual Wikimedia Commons file pages. This batch contains original third-party
photographs, **not AI-generated illustrations** or images downloaded from manufacturer
marketing pages. TractorVS does not claim copyright ownership.

The photo catalog uses exact brand/model matching. Variants and regional
configurations **may differ** from the pictured tractor, and the existing
10-language representative-configuration warning remains visible.

## Evidence ledger

| Published brand + model | Commons source file | Author | Original size | License |
|---|---|---|---|---|
| Belarus 1220.4 | [Belarus 1220.4.jpg](https://commons.wikimedia.org/wiki/File:Belarus_1220.4.jpg) | Dgolnik | 2048 × 1536 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Belarus 1221.3 | [Belarus MTZ-1221 3 tractor.jpg](https://commons.wikimedia.org/wiki/File:Belarus_MTZ-1221_3_tractor.jpg) | Homoatrox | 2197 × 1824 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Belarus 622 | [Belarus 622 tractor.jpg](https://commons.wikimedia.org/wiki/File:Belarus_622_tractor.jpg) | Homoatrox | 5393 × 3595 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Belarus 920.2 | [Belarus 920.2 tractor.jpg](https://commons.wikimedia.org/wiki/File:Belarus_920.2_tractor.jpg) | Homoatrox | 4000 × 6000 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Belarus 952.4 | [Belarus 952.4 tractor.jpg](https://commons.wikimedia.org/wiki/File:Belarus_952.4_tractor.jpg) | Homoatrox | 4058 × 4000 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| Steyr 4120 PLUS | [Steyr 4120 Plus Agritechnica 2023 (DSC05974).jpg](https://commons.wikimedia.org/wiki/File:Steyr_4120_Plus_Agritechnica_2023_%28DSC05974%29.jpg) | MarcelX42 | 6918 × 3893 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

Sources checked: **2026-11-21**. The record is evidence for source claims at the
time checked; licenses or URLs must be rechecked if Wikimedia metadata changes.

## Asset and deployment validation

- Six Commons 500px JPEG derivatives were retrieved and inserted as
  `site/public/images/tractors/<photo-id>-480.jpg` for static, fast thumbnails.
- For all six files the Commons CDN **960px and 1920px** variants independently
  returned HTTP 200 and valid JPEG signatures (2026-11-21).
- The existing fixed-allowlist Worker photo route serves approved first-party
  960/1920 paths; no arbitrary user-controlled remote URL is introduced.
- Site tests enforce local 480px JPEG presence, exact-model identity,
  photo-specific Commons licensing link, photographer and 10-language
  `ImageObject` metadata. New photos must not be called live until Cloudflare
  has deployed a build containing this commit and the first-party photo routes
  respond successfully.

## Copyright and SEO safeguards

Preserve each photographer's credit, file-specific Commons attribution URL,
license URL and the nonidentical-variant warning. Cropping/scaling is a
derivative; indicate resizing/modification as appropriate to the CC license
when reusing a file outside TractorVS. No fabricated year, market, exact trim,
price, review/rating or performance claim follows from a photograph. One
model page remains one canonical page with ten supported language routes;
image-sitemap and structured-data entries follow only verified publication.
