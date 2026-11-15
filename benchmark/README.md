# TractorCompare AI — Multi-model PDF benchmark

This benchmark is isolated from production. It does not call Supabase, update the research queue, approve findings, or publish specifications.

## Verified models and standard prices (2026-11-15)

| Provider | API model ID | Input / output per 1M tokens |
|---|---|---:|
| Anthropic | claude-sonnet-5-5 | $2 / $10 |
| OpenAI | gpt-6.1-sol | $2 / $10 |
| Google | gemini-3.8-flash | $0.75 / $3.75 through 2026-12-31; $1.50 / $7.50 from 2027-01-01 |

Prices are provider-published rates and can change. Re-check provider billing before the full run.

## Fair comparison

All models receive the exact same PDF bytes (one download per PDF, same SHA-256), identical model/variant/market metadata, the same extraction prompt and field list, temperature zero where supported, and a 12,000-token output limit. Calls run sequentially.

Each finding must contain the value, unit, measurement scope, exact variant column, PDF page, and a verbatim evidence quote. The model must explicitly report missing or ambiguous information rather than guess.

## Starter dataset

Three official PDFs already known in TractorCompare are included:
1. Case IH Farmall 110A
2. DEUTZ-FAHR 6165 TTV
3. Case IH Puma 150 EMEA

We need 17 more unique official PDFs for a 20-document dataset. To find documents already stored in the project, run this read-only SQL in Supabase SQL Editor and send me its result (URLs and source metadata only):

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

Required local environment variables:
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- GEMINI_API_KEY

Keep keys in a secure local environment or secret manager. Never put them in this manifest, SQL, GitHub, or ChatGPT messages.

## Run with Deno 2.x

Copy manifest.example.json to manifest.json, add 17 more cases, then from repository root run:

deno run --allow-read=./benchmark --allow-write=./benchmark/out --allow-net --allow-env=ANTHROPIC_API_KEY,OPENAI_API_KEY,GEMINI_API_KEY,ANTHROPIC_MODEL,OPENAI_MODEL,GEMINI_MODEL,BENCHMARK_LIMIT ./benchmark/model_benchmark.ts ./benchmark/manifest.json

The runner processes up to 20 cases sequentially and saves raw answers, parsed JSON, token usage, estimated API cost, latency, and PDF checksums under benchmark/out.

Use BENCHMARK_LIMIT=1 for an initial connectivity smoke test before the full 20-PDF run.

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
