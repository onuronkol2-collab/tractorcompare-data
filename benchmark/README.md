# TractorCompare AI — Multi-model PDF benchmark

This benchmark is isolated from production. It does not call Supabase, update the research queue, approve findings, or publish specifications.

## Verified models and standard prices (2026-11-15)

| Provider | API model ID | Input / output per 1M tokens |
|---|---|---:|
| Anthropic | claude-sonnet-5-5 | $2 / $10 |
| OpenAI | gpt-6.1-sol | $2 / $10 |
| Google | gemini-3.8-flash | $0.75 / $3.75 through 2026-12-31; $1.50 / $7.50 from 2027-01-01 |

Prices are provider-published rates and can change. Re-check provider billing before the full run.

## Recommended now: free Gemini-only mode

The runner defaults to BENCHMARK_PROVIDERS=gemini, so it calls only Gemini unless you explicitly select other providers. Free-tier input and output are free within Google's model limits and quotas. Confirm the selected project is marked Free Tier in Google AI Studio and has no paid billing account linked.

Google states that Free Tier content may be used to improve its products. This benchmark uses public tractor brochures/manuals; do not submit private, confidential, or customer data.

GEMINI_BILLING_TIER=free is only a reporting label. It does not control Google billing. Set it only after checking the project's actual Free Tier status in AI Studio. If not verified, leave it unset so the runner reports a conservative paid list-price estimate.

Claude and OpenAI remain supported for later, once the site can cover API costs.

## Fair comparison

All models receive the exact same PDF bytes (one download per PDF, same SHA-256), identical model/variant/market metadata, the same extraction prompt and field list, provider-default sampling settings (to avoid unsupported cross-provider parameters), and a 12,000-token output limit. Calls run sequentially.

Each finding must contain the value, unit, measurement scope, exact variant column, PDF page, and a verbatim evidence quote. The model must explicitly report missing or ambiguous information rather than guess.

## Starter dataset

Twenty distinct official manufacturer PDF/manual documents are curated in the manifest, spanning Case IH, New Holland, Kubota, TYM, John Deere, Fendt, DEUTZ-FAHR, Lamborghini Trattori, and Massey Ferguson. The set covers compact, utility, midrange, and high-horsepower tractors, as well as varied brochure layouts and one operator manual. Duplicate temporary Carraro links and irrelevant Agrale privacy/noise documents were excluded.

SELECT DISTINCT ON (d.source_url)
    b.name AS manufacturer,
    COALESCE(t.model_name, r.requested_model) AS model,
    COALESCE(t.variant, r.requested_variant) AS variant,
    COALESCE(t.market, r.requested_market) AS market,
    d.source_url AS pdf_url,
    d.source_type,
    d.http_status,
    d.source_priority,
    d.identity_evidence_model_key,
    d.identity_evidence_variant_key,
    d.notes
FROM public.ai_research_documents d
LEFT JOIN public.ai_research_runs r ON r.id = d.run_id
LEFT JOIN public.tractors t ON t.id = r.tractor_id
LEFT JOIN public.brands b ON b.id = COALESCE(r.brand_id, t.brand_id)
WHERE d.http_status = 200
  AND (
      lower(COALESCE(d.source_type, '')) LIKE '%pdf%'
      OR d.source_url ~* '\.pdf([?#]|$)'
  )
ORDER BY d.source_url, d.source_priority DESC NULLS LAST
LIMIT 100;

We will pick 20 distinct first-party PDFs across manufacturers, tractor classes, model variants, and document layouts. Exclude duplicates, third-party mirrors, generic brochures with no exact target column, and ambiguous model identities.

## API keys

For the current free Gemini-only test, only GEMINI_API_KEY is required. Claude and OpenAI keys are optional and needed only for a future paid multi-model run.

Keep keys in a secure local environment or secret manager. Never put them in this manifest, SQL, GitHub, or ChatGPT messages.

## Run with Deno 2.x

The example manifest already contains 20 curated cases. Copy benchmark/manifest.example.json to benchmark/manifest.json.

### Free Gemini smoke test (PowerShell)

1. Create an API key in Google AI Studio: https://aistudio.google.com/.
2. Confirm the project is marked Free Tier in AI Studio. The billing label in the script does not change the actual project billing tier.
3. In PowerShell, set the following variables:

$env:GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
$env:BENCHMARK_PROVIDERS = "gemini"
$env:GEMINI_BILLING_TIER = "free"
$env:BENCHMARK_LIMIT = "1"

Then run:

deno run --allow-read=./benchmark --allow-write=./benchmark/out --allow-net --allow-env=GEMINI_API_KEY,GEMINI_MODEL,BENCHMARK_LIMIT,BENCHMARK_PROVIDERS,GEMINI_BILLING_TIER ./benchmark/model_benchmark.ts ./benchmark/manifest.json

After the first PDF succeeds, set BENCHMARK_LIMIT to 20 and repeat for the full Gemini-only run. The runner downloads each PDF once and saves raw answers, parsed JSON, token usage, declared billing tier, price estimate, latency, and PDF checksum under benchmark/out.

### Optional paid comparison later

When the site earns revenue and you choose to pay for a broader comparison, explicitly set BENCHMARK_PROVIDERS to anthropic,openai,gemini and provide all three API keys. Gemini-only remains the default, so paid providers are not called accidentally.

## Ground truth and scoring

Do not pick a winning model based only on valid JSON. For each PDF, manually verify a gold sheet from the official table: exact model/variant column, values, units, measurement scope, page references, and supporting quotes.

Suggested score weighting:
- Value + unit correctness: 40%
- Model/variant/market identity: 25%
- Page and evidence-quote correctness: 20%
- Coverage/completeness: 10%
- JSON validity: 5%

Penalize unsupported or cross-variant values heavily. Compare false-positive rate, cost per correct finding, and latency. Accuracy is more important than speed.

All outputs remain separate from ai_research_findings and tractor_specs. No benchmark output can approve or publish a production specification.
