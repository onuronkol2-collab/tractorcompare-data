# TractorVS licensed photo batch — November 22, 2026

Scope: **Belarus 510** and **Belarus 922.3**, both already published as model identities in Supabase. This PR adds no model record and performs no production deployment.

## New independent source photographs

- **Belarus 510:** [Wikimedia Commons File: Belarus 510 (open day 2017) 1.jpg](https://commons.wikimedia.org/wiki/File:Belarus_510_(open_day_2017)_1.jpg), Homoatrox, CC BY-SA 4.0, 2484 × 2748 original. The photographed canopy is illustrative, not proof of the catalogue market/vintage or standard equipment.
- **Belarus 922.3:** [Wikimedia Commons File: Алматы, Беларус-922.3 на Кулымбетова-Бруно.jpg](https://commons.wikimedia.org/wiki/File:Алматы,_Беларус-922.3_на_Кулымбетова-Бруно.jpg), Nikolai Bulykin, CC BY-SA 4.0, 5077 × 3385 original. The attached saw is not standard equipment. Earlier indexed title ending in `(1).jpg` returned `missing=true` in the live Commons API and was not used.

### Verified artifacts

The isolated GitHub Actions run [#45013195070](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45013195070) finished successfully. It checked live Commons metadata, JPEG MIME, original model-specific file identity, copyright/creator, licenses and original dimensions; downloaded three real first-party JPEG files per photo and recorded SHA-256 and byte size for each.

The machine-readable ledger is [photo-evidence-belarus-510-9223-20261122.json](photo-evidence-belarus-510-9223-20261122.json). New binaries are in `site/public/images/tractors/`; scaling derivatives from Commons are **not** original unmodified photographs. Keep original File page, author and CC BY-SA 4.0 hyperlink in visible attribution and JSON-LD, and denote resizing when describing modifications.

### Release gate

This branch and preview are not production. Before merge verify: latest site unit/build, exact-model non-leakage tests, 10-language ImageObject, JPEG SHA checks, production bundle, Playwright/axe and copyright source proof, main-sitemap consistency and real preview image HTTP 200 + `image/jpeg`. After merge, separately verify actual `tractorvs.com` JPEGs and indexed image sitemap; do not claim Google indexing. Any failed gate blocks merge and can be resolved within this PR; avoid bypasses or changing RLS.

No Supabase image candidate was marked `approved`; no unlicensed or manufacturer image was copied.
