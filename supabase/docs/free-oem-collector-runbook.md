# TractorVS automatic zero-paid OEM document collector

Security: the private research queue stays in Supabase. GitHub Actions never downloads a private draft manifest. It sends the existing anon JWT plus x-queue-secret to a verify_jwt=true Supabase Edge Function. The worker uses the existing DB_SECRET_KEY in private server environment. No Gemini, Firecrawl credits, or paid third-party parsing API is used.

## Components
- Supabase Edge Function: tractor-oem-free-collector, separate from paid research.
- Private table: public.tc_oem_document_cache, RLS enabled, no anon/authenticated grants.
- Scheduled workflow: .github/workflows/tractorvs-free-oem-collector.yml, every two hours and after first main merge.
- Authentication: existing queue secret PLUS gateway JWT check, no browser CORS.
- Scans eligible draft tractors only, already linked source URLs and narrowly approved, exact manufacturer hosts.
- Per run: at most three documents and one URL per OEM hostname, 14-day cache for repeated sources.
- Transport controls: HTTPS only, credentials/IP/port/unreviewed hostname denied, no automatic redirect, robots.txt consulted (fail-closed), 8/12 second timeouts, 256 KB HTML and 800 KB PDF caps.
- Stores ONLY SHA-256 digest, HTTP status, mime, response length, up to 1,400 plain-text characters and a model-mention discovery hint. Raw HTML, full PDF, photographs, member data and tokens are not persisted.
- PDF text parsing is not yet part of this worker; PDF hashes are recorded as pdf_pending_parse only.
- Does NOT approve technical evidence, modify tractor_specs, modify queue claims, publish models, invoke AI or generate SEO pages.
- Paid Gemini research watchdog remains dry_run=true; never turn it on to compensate for a missing official source.

## Limits
This is a real source-fetching and private-caching worker, not an offline simulation.
It automatically handles sources ALREADY linked in the database and on approved
manufacturer hosts. It does NOT yet discover missing OEM URLs, parse protected PDFs,
or resolve model/year/market variants; thus not all 187 queued draft targets are
guaranteed to progress. Add reviewed producer hosts and discovery modules incrementally,
never trust unreviewed domains or silently follow redirects.

## Verification and safety
Run: node --test scripts/tractor-oem-free-collector.test.mjs
Use: supabase/verification/verify_oem_document_cache.sql
Check scheduled GitHub Actions receipts: paid_ai_calls=0, published=0,
specifications_modified=0. Compare before/after counts for tractors/specs.
The presence of a document does not prove technical values or manufacturer consent;
respect official terms, robots and copyright. The optional excerpt is private only.

## Failure and rollback
If Edge env secrets or GitHub encrypted secrets are absent, fail closed.
Do not paste secrets into chat. Pause schedule before rolling back worker.
Schema rollback refuses to destroy nonempty provenance cache; review retained
records before any manual export/removal.
