# TractorVS forum Cloudflare Workers AI pilot — zero external calls (22 November 2026)

## Goal and verified sources
Add Cloudflare's M2M100 multilingual model as an alternative translation provider in the existing Supabase Edge function. Do not deploy it or infer a zero-charge subscription merely because the model is shown in the user's Cloudflare model catalog.

Official model/API schema:
https://developers.cloudflare.com/workers-ai/models/m2m100-1.2b/

Official Workers AI Free versus Paid charging rules:
https://developers.cloudflare.com/workers-ai/platform/pricing/

Cloudflare advertises 10,000 Neurons per day free allocation, reset at 00:00 UTC. Workers Paid can bill above the free allocation; Neurons are not characters. The actual user account plan must be verified later. The user's explicit budget is ZERO and billing checks are deferred until after code-only work.

## Double lock and secrets
The new provider uses these PRIVATE Supabase Edge Function environment values:

- TC_TRANSLATION_PROVIDER = cloudflare (defaults to cloudflare in new code)
- CLOUDFLARE_AI_TRANSLATION_ENABLED = true (OFF by default)
- CLOUDFLARE_AI_FREE_PLAN_VERIFIED = true (OFF by default, only after checking this account)
- CLOUDFLARE_AI_ACCOUNT_ID (private)
- CLOUDFLARE_AI_API_TOKEN (private, least-privilege Workers AI Run)

Never paste the API token into GitHub, a screenshot, a public frontend, a forum topic or the conversation.

Only when BOTH flags are explicitly true AND both private credentials exist can a paid-capable model call be made. The gate is checked before the queue's recovery/claim/processing; a merge or deployment alone cannot begin translation. Cloudflare 403/429/quota failures do not fall back to Gemini/Azure/other paid services. The manual GitHub workflow_dispatch ONAY policy remains unchanged, as does read-only KONTROL. No schedule, automatic job, Worker deployment, or real provider call is introduced.

## Technical contract
Server-side REST endpoint uses the documented account AI run model URL; model ID is @cf/meta/m2m100-1.2b. Requests are POST JSON with text, source_lang and target_lang. Responses must be success=true and have result.translated_text as a nonempty bounded string. Use only supported locale map: tr/en/zh/hi/pt/fr/de/ru/ja/es. pt-br maps to generic Portuguese until independent Brazil-specific language QA is available.

Reuse the tested deterministic Markdown scanner so headings, list separators, table pipes and lines, code, brand names and source URLs remain protected. Worker keeps its preexisting checks for numeric facts, source URLs, brand terminology, length, markdown tables, headings, source-hash, consent and text-only content.

Each section is capped at 2,600 source characters, 24 separate provider calls, 85 seconds in total and 9 seconds per request. These are guardrails, NOT proof of a globally free bill. Long or difficult articles can require further optimisation; they must fail closed instead of truncating or publishing incomplete content.

## Publication requirements
Model success does not equal proof of correct translation. Cloudflare output uses private needs_review, seo_approved=false with source-bound chunk checkpoints. It is never automatically marked ready or indexed without a separate verified native language/agronomic review. Do not combine source chunks previously translated by another provider. Neither a GitHub merge nor a test result proves actual translation or live Cloudflare URL.

## Later validation, with the user's approval
First inspect the actual Workers subscription in Cloudflare Account Billing and verify non-billable free-tier limitations. Then provision the private token only in Supabase secrets. Only then, if explicitly authorized, test a synthetic short technical sentence with the account's usage monitor open. Confirm no billing, compare actual technical translation, test one opted-in private section, and separately design independent QA before publication.

## Rollback
Keep the two flags unset/false to block calls. If deployment is later performed, disable the enabled flag to stop before DB/network work. Review concurrent changes before any code revert; preserve RLS, forum source, queue, draft state, Cloudflare Workers, analytics consent, canonicals, hreflang and sitemap.
