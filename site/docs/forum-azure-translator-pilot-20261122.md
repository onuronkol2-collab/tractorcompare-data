# Forum: Azure Translator alternative pilot (22 November 2026)

## Decision
Use Microsoft Azure Translator Text API v3 (TR -> EN, ZH-Hans, HI, PT-BR,
FR, DE, RU, JA, ES) as an **optional Gemini-independent** forum translation
provider. The published public forum source and translation_consent=true source
hash gates must still pass before any outgoing request.

Microsoft official references:
- https://learn.microsoft.com/en-us/azure/ai-services/translator/text-translation/reference/v3/translate
- https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support
- https://azure.microsoft.com/en-us/pricing/details/translator/

As of 22 November 2026, F0 lists 2 million standard translated characters
per month. It is a SERVICE PLAN, not a promised free entitlement on this
account: check actual resource tier, billing controls and region before use.

## Safe prerequisites
1. Create/select an Azure Translator Text F0 resource only after verifying
   the actual Azure subscription and billing terms; no new paid resource is
   created as part of this PR.
2. Add AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION as private Supabase
   Edge Function environment secrets. Do NOT paste them in GitHub, issue, chat,
   browser or frontend source.
3. TC_TRANSLATION_PROVIDER=azure is the default in the updated Edge source.
   Missing Azure credentials MUST stop before claiming a queued job. There
   is NO automatic fallback to Gemini; Gemini is only available on explicit
   provider setting, not used by this pilot.
4. The GitHub translation worker remains user-triggered only:
   workflow_dispatch onay=ONAY. KONTROL is read-only; no schedule is added.
5. Do not deploy until offline tests, security, source consent, queue state and
   full-source preview have been reviewed.

## Technical limits
- The existing service-role key stays exclusively in Supabase Edge.
- Only source author-consented, published forum TEXT (no private media) is sent
  to Azure; this third-party processing requires applicable user notice.
- The adapter preserves original line breaks, Markdown heading/list/table
  delimiters, URLs, inline code, code blocks and specified manufacturer terms.
- Calls use bounded batches, 26-second total budget, explicit TR as source and
  supported target codes. It never logs text, subscription key or raw replies.
- Existing numeric, URLs, brands, table/heading and source-hash checks still run.
- Partial chunks remain NEEDS_REVIEW and SEO_APPROVED=false.
- AZURE_TRANSLATION_COMPLETE is *not* an independent linguistic QA result;
  even successfully completed machine translations remain private
  NEEDS_REVIEW, NOT ready, until a separate verified reviewer/approval stage.
- Existing Gemini-created checkpoints are NOT combined with Azure-created
  checkpoints. Accepted legacy source chunks are not overwritten silently.
- A queue receipt never proves Cloudflare production deployment or indexing.

## Rollback
- If a live Azure pilot fails or billing/privacy cannot be verified, keep
  GitHub onay queue paused, revert the PR or redeploy the last approved Edge
  Function (v11 on 22 November), and preserve consented source and private
  partial records. Do NOT bulk requeue or publish without independent QA.

## Verification evidence required before declaring the pilot works
- Offline Deno API/schema/locale/Markdown/negative tests PASS (no paid call).
- Real Azure auth and F0 tier confirmed **privately**, with a synthetic
  no-personal-data one-sentence API request under explicit budget control.
- At most one author-consented published forum section translated privately
  with successful numeric, URL, Markdown and language checks.
- Azure pilot creates PRIVATE segments, does not emit a public URL, and
  does not expose user data to Google/Bing until independent QA approved.
- After later independent review, verify ready row -> public sync -> actual
  Cloudflare URL -> hreflang/canonical/sitemap; never infer Google indexing.
