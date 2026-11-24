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


## Optional strict column extraction (phase 2)

After legally obtaining the PDF, run the original page index. In an isolated offline environment, examine the actual PDF page and its pdftotext -layout representation. Prepare a private JSON manifest outside the repository containing schema=1, sha256 equal to the exact PDF snapshot, and tables with one-based page, header_line and header_label, columns with model and zero-based start / exclusive end character positions, and rows with one-based line and the exact visible label. No numeric unit or scope is inferred. All listed models must also be requested with --model. The header and labels must match; overlapping columns, out-of-scope models, wrong hash, repeated row references and token-crossing boundaries are rejected. Empty cells, placeholders and unexpected text block the affected row instead of borrowing a neighboring value.

Use the original command with --table-manifest /secure/private/table-manifest.json and a new private output filename. The single PDF extraction now yields raw source-label / cell-value / exact page, line and column position review candidates. The manifest is capped at 128 KiB, candidates at 10,000. Stdout remains aggregate counts only. The report is private and unapproved. The reviewer must independently check model-year/market/variant, measurement standards, merged cells, footnotes, units, original rendered layout and conflicts. A syntactically well-aligned value is not a verified fact. Existing evidence triage, protected SQL transaction and publication gates remain mandatory. No automatic database import, live publication, paid AI or new external network activity is added.

Synthetic regressions cover exact columns, composite values, missing cells, drift, wrong document, swapped header, duplicate rows, and private manifest bounds. Live Hattat PDF page rendering was still unavailable (web screenshot cache miss on 24 November); this is not a successful live technical table extraction.


## Phase 3 — private Supabase review packet

The existing production `public.tractorvs_spec_review_candidates` table was inspected read-only on 24 November. RLS is enabled, anon/authenticated have neither SELECT nor INSERT, and the existing unique key is (tractor_id, canonical_key, spec_value, source_url). Reuse that table; no new schema, grants, APIs or public data path.

Create a private explicit JSON plan (schema=1) with document_sha256, source_url, source_publisher, observed_at, targets (model, model_name, tractor_id, brand, market, variant, model_year), and fields (page, layout_line, source_label, canonical_key, spec_name, unit, comparison_class, measurement_standard). Null variant/year/unit/standard must be explicit. Model names must match exactly; no aliases or inferred conversion. All selected model × field cells must exist, match their labels, and remain unapproved. Cap: 1,000 review rows per packet.

Run `python3 scripts/tractor-pdf-review-packet.py --report /secure/private/review.json --plan /secure/private/plan.json --output /secure/private/preflight.sql`. The generated SQL defaults to ROLLBACK. It locks only intended tractor IDs and rechecks exact draft identity and previously linked source URL/publisher, asserts private table RLS and no visitor read/write privileges, inserts review candidates with needs_review and exact PDF hash/page/line/column evidence, and rejects existing candidate conflicts rather than overwriting. Exact duplicates are preserved. SQL values are encoded as data, not interpolated syntax. No changes to tractors, specs, source records, queues or publication state. Output file mode 0600, outside repo, no overwrite, no private input or data on stdout.

After authorized independent inspection and rollback-only preflight using a secure SQL connection, generate a separate --stage output if appropriate. This creates a COMMIT SQL file, not an execution or approval. Do not upload private packets or run against production until CI and disposable database transaction validation pass. Actual PDF column, exact identity, measurement conditions and source rights still require independent evidence review; staging never makes a value public. An unlinked/new source or new model must enter the existing source/model creation workflow separately. No actual production staging or publication was performed by this change; no measured throughput gain yet.
