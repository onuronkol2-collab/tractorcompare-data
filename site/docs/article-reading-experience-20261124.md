# Article reading experience and language coverage — 24 November 2026

## Baseline and verified scope

Inspection of the current main branch shows ten localized archive routes. Two full texts (selection guide and Başak 2075 BK review) already exist in every locale; four other guides have full content only in English and Turkish. The reviewed Deutz-Fahr GS comparison is also EN/TR only. The eight other archive languages list six resources, two with local full text and four with English full text; EN/TR list seven local resources. A translated card is not a translated full article. The existing draft glossary localization PR #127 and separate technical research and global layout work are intentionally not modified.

## Implemented

- SSR archive coverage sentence and reading-language indicator for every card, native HTML radio filters for the eight locales that have English fallbacks, combined search + language filtering, correct visible category counts, localized empty-state recovery, and deterministic Turkish dotted/dotless-i and Unicode normalization. All original source-backed links remain in SSR HTML, filter changes create no indexable URL or fake translation. Archive ItemList, canonicals, hreflang and original link targets unchanged.
- Cards appear before the editorial methodology block; preserve all trust and source disclosures. Reduced excess mobile header/section spacing, 16px descriptions, 44px controls, wrapping for long translated headings and breadcrumbs, existing green palette.
- A common no-JS contents navigation for the genuine ten-language selection and Başak review pages: use each actual section title, stable anchors, direct jumps to technical tables and sources, visible keyboard focus and 44px targets; do not rewrite technical claims, model variants, dates, evidence or existing table semantics.
- The four institutional references in the selection guide now have descriptions in every supported language; the original resource links remain the same and are clearly labelled (EN), not invented localized documents. Article authors, evidence dates and citation URLs are retained.

## Verification and limits

Browser tests cover archive card/language counts, filter and reset, no-JS reading, mobile reflow, native source/section jumps for 20 article routes, and original destination integrity. Use existing unit, production SEO/release, CodeQL, Cloudflare and multi-browser/axe workflows. Expected mobile/desktop environment skips in pre-existing suites must be reported separately. Do not claim ranking/indexing changes or improved real-user task completion without measurements. Rollback: revert this PR; no Supabase changes, analytics consent changes, translation publication or new URLs.

The four bilingual guides are still not fully translated in eight additional languages (32 missing combinations). Translation work requires full paragraphs, tables, numerical and unit parity, safety caveats and independent language/technical review before it can enter sitemap/hreflang. The Deutz-Fahr comparison requires a separate source-scoped localization check. No fake local full-text pages or thin placeholders.

## Official sources consulted

- Google Search Central: https://developers.google.com/search/docs/specialty/international/localized-versions
- Google multilingual site guidance: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites/
- Google Article markup: https://developers.google.com/search/docs/appearance/structured-data/article
- W3C WAI structure: https://www.w3.org/WAI/tutorials/page-structure/
- WCAG reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow
