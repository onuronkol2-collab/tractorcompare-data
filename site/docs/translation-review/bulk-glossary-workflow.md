# Bulk glossary translation review

The 96 original glossary IDs are split into 14 core entries with four drafted fields in eight languages and 82 remaining entries with drafted names in eight languages. This is 768 translated name drafts, not 768 complete entries. The remaining 1,968 prose fields must still be translated. Existing 24 technical-guide body translations and 192 shared UI strings are preserved. These drafts are not public routes.

## One exchange, not per-term jobs

From the repository root, run `node site/scripts/prepare-glossary-review-batch.mjs export > /tmp/glossary-review.json`. Select a subset of locales by appending their locale codes. The packet includes all original text, target term names, stable IDs, source Git blob hash, and a SHA-256 packet identifier. No external network or paid API call occurs. For a completed translation return, keep the packet identifiers, schema 1, `state: draft-needs-independent-editorial-review`, `notForPublication: true`, `reviewed: false`. Return `jobs` with the same locales, each containing `entries` with exactly `id`, `definition`, `example`, and `caution`. Run `node site/scripts/prepare-glossary-review-batch.mjs check-return /tmp/translated.json` with the same locale selection. The verifier rejects missing entries, duplicates, stale hashes, English copies, placeholders and HTML. It does not save, publish or automatically approve content.

## Review and release

A structural pass is not proof of meaning, correct units, safety warning fidelity or independent review. Compare every field with its original, verify numbers, unit conventions, factual caveats, regional terminology and safety warnings. Integrate only complete reviewed locales with real route, source, canonical, hreflang and sitemap checks. No partial glossary fallback pretending to be translated. Existing glossary PR #127 is untouched; reconcile overlapping work before release. DeepL supported languages were checked, but the available connector did not expose a verified cost/quota; no translation requests were made. Do not activate paid or automatic provider jobs without authorization.
