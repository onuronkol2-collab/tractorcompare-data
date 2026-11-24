# Bulk glossary translation review

The 96 original glossary IDs are split into 14 core entries with four drafted fields in eight languages and 82 remaining entries with drafted names in eight languages. This is 768 translated name drafts, not 768 complete entries. German and French each have 82 additional complete entry drafts (492 fields combined); 276 of 768 full entries are drafted. The other six languages still need 1,476 prose fields. Existing 24 technical-guide body translations and 192 shared UI strings are preserved. These drafts are not public routes.

## One exchange, not per-term jobs

From the repository root, run `node site/scripts/prepare-glossary-review-batch.mjs export > /tmp/glossary-review.json`. By default the CLI exports only locales with incomplete prose drafts; append explicit locale codes to prepare a re-review packet including German. The verifier must pass before export. The selected packet includes all original text, target term names, stable IDs, source Git blob hash, and a SHA-256 packet identifier. No external network or paid API call occurs. For a completed translation return, keep the packet identifiers, schema 1, `state: draft-needs-independent-editorial-review`, `notForPublication: true`, `reviewed: false`. Return `jobs` with the same locales, each containing `entries` with exactly `id`, `definition`, `example`, and `caution`. Run `node site/scripts/prepare-glossary-review-batch.mjs check-return /tmp/translated.json` with the same locale selection. The verifier rejects missing entries, duplicates, stale hashes, English copies, placeholders and HTML. It does not save, publish or automatically approve content.

## Review and release

A structural pass is not proof of meaning, correct units, safety warning fidelity or independent review. Compare every field with its original, verify numbers, unit conventions, factual caveats, regional terminology and safety warnings. Integrate only complete reviewed locales with real route, source, canonical, hreflang and sitemap checks. No partial glossary fallback pretending to be translated. Existing glossary PR #127 is untouched; reconcile overlapping work before release. DeepL supported languages were checked, but the available connector did not expose a verified cost/quota; no translation requests were made. Do not activate paid or automatic provider jobs without authorization.

## Offline alternative: Argos Translate (24 November 2026)

Primary upstream sources: https://github.com/argosopentech/argos-translate and https://github.com/argosopentech/argospm-index/blob/main/index.json (index blob c64b1a1664df1a3dd1c213b693fbfe18de2efebb). The index exposes direct English-to-target packages for all eight languages, including Brazilian Portuguese code pb, not generic pt. The adapter requires exact package versions, rejects pivot translation, and never downloads or installs models itself.

After separately checking model licences, dependency versions, download hashes and available local compute, an operator may install reviewed model packages on an isolated machine with networking disabled for inference. Export the review packet as above, then run:

    python3 site/scripts/translate-glossary-argos-offline.py /tmp/glossary-review.json /tmp/argos-draft.json
    node site/scripts/prepare-glossary-review-batch.mjs check-return /tmp/argos-draft.json

The output is an unreviewed candidate packet, not approved translated content. Use the matching explicit locale selection on export and check-return if needed. Sentence chunking is disabled; every input is one bounded glossary field. Check for omitted meaning, numeric/technical errors, safety warnings and regional fluency; compare with trusted independent sources and obtain required editorial review. No secret, paid API, new scheduled workflow, production database, site route, or auto-publication is involved. The current chat environment lacks Argos and cannot resolve the download host, so no real model inference has occurred. Contract tests use synthetic data, not linguistic evaluation. Do not report a successful model run until observed.

Other possibilities: Helsinki-NLP OPUS-MT local models (model-card-specific licences and direction checks); Google Cloud Translation's monthly free credit and Azure Translator free tier (billing/account/quota verification required before use); DeepL connector (cost/quota unverified). Prefer existing free local compute over enabling a paid service, and never revive disabled forum automation.
