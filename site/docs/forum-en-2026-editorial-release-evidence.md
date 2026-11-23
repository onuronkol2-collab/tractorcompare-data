# TractorVS English forum release — 2026 dealer satisfaction (22 Nov 2026)

## Scope

Original public Turkish topic ID: `713ab252-a925-4ab7-b2c8-a30ce5b86706`. Immutable source MD5 verified `0102e8edcd864b285733fb30cad4d8f1`. Public original title: "2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar". **Only** target `en` may be released in this phase. `de,fr,es,pt-br,ru,zh,ja,hi` remain private and excluded from sitemap/hreflang.

The user explicitly approved: finish the final English language QA and release English before other languages. Release includes an English-language **model-assisted** editorial review, not a human native-speaker signoff.

## Source and independent cross-engine evidence

- Verified Turkish original is `published`, `translation_consent=true`, source hash matches.
- Actual Google Translate engine used in the owner's private Google Sheet, first `tr→en` on all 9 full-text chunks, then `en→tr` on all 9 chunks from the complete original ChatGPT English draft. Both sets returned actual translations without errors. English source/draft chunks were compared back to live Supabase content.
- Separately reviewed every returned Turkish backtranslation against the corresponding original section. No substantive regional survey claims, brand associations, numerical facts, date ranges, safety warnings or research limitations were found missing. The backtranslation itself mistranslated proper-brand `Same` as Turkish `Aynı` in one Markdown table; the **existing English original correctly retained the brand Same** and must not be replaced with Google's translated table.
- Corrections applied to the private English draft on 22 Nov: replaced a nonparallel introductory sentence with an accurate three-part description; changed the awkward phrasing `highest dealer assessment` to `highest dealer rating`. No change to numbers, sources, Markdown structure or assertions.
- Explicitly **not claimed**: that a human editor reviewed the text, that Google Translate alone certified fluency, or that the eight other locales have passed semantic review.

## Source fact checks (sources published in 2026)

1. [CLIMMAR 2026 press release](https://www.climmar.com/news/climmar-presents-dealer-satisfaction-index-at-eima): DSI 2026 average 12.5, released at EIMA Bologna 10 Nov.
2. [Mechaman 18 Nov 2026](https://www.mechaman.nl/artikel/20261118/trekkerdealers-minder-tevreden-over-fabrikanten-john-deere-enige-stijger/): ranking SAME 13.7, Deutz-Fahr 13.2, CLAAS 13.1, John Deere 13.0, Case IH/Fendt 12.3, Kubota 12.2, New Holland 11.8, Massey Ferguson 11.1. Scope differences between CLIMMAR's 10 countries and Mechaman's eight countries/561 dealer answers are described as different scopes, not conflated.
3. [FADA DSS 2026 coverage](https://www.rushlane.com/indias-largest-auto-brands-arent-no-1-in-dealer-satisfaction-fada-study-12554950.html): Swaraj 788/1,000; 2,045 dealer responses covered all surveyed vehicle classes.
4. [NAEDA 2026 coverage](https://www.equipmentdealermagazine.com/naeda-announces-2026-dealers-choice-and-gold-level-award-winners/): Yanmar Dealer's Choice and TYM Gold Level. Do not confuse Gold Level with a reliability failure rate; TYM's independent overall satisfaction criterion does not change NAEDA category award.
5. The article states dealer satisfaction is **not** a measure of mechanical breakdown rate; different regional survey scales cannot be combined as a global league table.

## Release quality gates

Before any public update:
- Compare source and target numerical/model-code tokens, 21 headings, Markdown table (11 rows), nine brand/rank/score pairs, source URLs (4), full-length body and title.
- Recheck `public.tc_forum_language_issue`, `reviewed_by_model`, `ready`/SEO approval, and original topic consent.
- Database publication trigger and RLS security-invoker public projection must expose exactly **`tr` and `en`**; other eight locales must remain private. This was tested in a transaction and **rolled back**, before final change.
- For audit transparency `reviewed_by_model` names the Google Translate independent machine roundtrip and GPT-6 final editorial adjudication. It must not be interpreted as a human signature.
- Only publish if source hash and all checks are unchanged; rollback file included.
- Supabase public visibility is **not proof** of successful static Cloudflare deployment. After release, check automated moderated forum fingerprint workflow, successful site build/deployment, real EN HTTP 200, self-canonical, reciprocal TR/EN hreflang, sitemap inclusion, mobile rendering and no appearance of unapproved locales. Search indexing remains the search engine's choice.
- Do not enable paid translation providers, weaken RLS or publish other locales.

## Files

- `supabase/sql/forum_release_en_dealer_satisfaction_2026.sql` (guarded one-locale release; apply only after PR/CI)
- `supabase/verification/verify_forum_en_only_live.sql` (read-only post-release)
- `supabase/rollback/forum_release_en_dealer_satisfaction_2026_rollback.sql` (one-locale rollback)
