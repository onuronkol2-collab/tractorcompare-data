# Bulk offline manufacturer catalogue review (2026-11-24)

This is a bounded local, no-AI/no-network review index, not a crawler, table-to-database engine or automatic publication gate. It is complementary to the existing source cache and free-first triage. Use a lawfully obtained manufacturer PDF in an isolated environment without credentials, with Poppler pdfinfo/pdftotext installed; do not bypass robots, rate limits, licensing or source-access restrictions.

```sh
python3 scripts/tractor-pdf-review.py \
  --pdf /secure/private/catalogue.pdf \
  --model B3055 --model B3065 --model B3085 --model B3095 --model B3105 \
  --output /secure/private/new-review.json
```

One immutable byte snapshot and SHA-256; at most 32 MiB, 120 pages, 100 explicitly named models, 20 location hints per model; parser CPU, address-space, output and wall-time limits. No persistent document text, no private input paths on stdout, no writes to the repository, no overwriting output, no credentials, database changes or paid calls. Output is private 0600 JSON with page/line locations and unapproved status. Textless pages, absent hits and caps are not evidence of model absence; do not silently ignore them. The actual PDF must be rendered and each column, row, variant, year, market, units, measurement standard, options and footnotes reviewed independently. The tool cannot prove table-cell assignment or rights. Do not OCR or guess absent values. Only then pass reviewed claims through the existing private evidence triage and publication gate.

First measured opportunity: database readiness review on 24 November found 50 HUMAN_RELEASE_REVIEW candidates (not approvals); Bobcat 16, Solis 12, Hattat 5, Başak 4, other brands 13. Hattat B3000 Stage V manufacturer documents provide a multi-model table:
- https://www.hattattraktor.com.tr/Upload/Sayfa/3000B_STAGEV_EN.pdf
- https://www.hattattraktor.com.tr/Upload/Sayfa/Hattat%20B3000%20Spec%20-%20Stage%20V-1.pdf
The first table has five model headers; the second has three. Parsed public source text was retrieved, but the PDF page image requests failed (cache miss); no production model/spec or status was changed on this basis. A live source acquisition and visual column check is still necessary. Do not conflate Stage 3A and Stage V variants. Price-list pages are identity/offer leads, not detailed technical evidence.

Tests: python3 scripts/tractor-pdf-review.test.py -v (synthetic real PDF only, no external manufacturer requests). PR CI must pass before merge. This does not deploy a Supabase function or automatically process the 11 oversized cached sources. Subsequent bounded document acquisition and table review integration must be separately tested and authorized. Rollback: revert this PR; no schema/data/publication change.
