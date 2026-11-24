# Bulk OEM research throughput — 2026-11-24

Purpose: obtain more useful model-specific research from the existing free source budget. This change is source discovery and collection, not an automatic model/specification publisher.

## Source transport changes
- Preserve 3 documents per collector run, HTTPS exact manufacturer scope, robots checks, no redirects, no paid API, private cache, and source-only write boundaries.
- Select uncached documents before expired cache entries, then rank by distinct associated draft IDs rather than repeated specification rows. At most one document per manufacturer and normalized hostname per run.
- Batch draft and spec lookups with deterministic paginated spec-link reads. The draft cap matches the existing queue scan ceiling; fail closed on scan overflow. Do not increase network source requests.
- Expand exact approved hosts based on publicly accessible manufacturer/authorized-market catalogues: https://www.tumosan.com.tr/tr/urun-kategori/traktor, https://erkunttraktor.com.tr/Modeller, https://www.hattattraktor.com.tr/traktorler, https://www.bobcat.com/eu/en/equipment/compact-tractors, https://www.solisturkiye.com/urunlerimiz/. These are discovery sources, not evidence of all variants, image reuse rights, or publication approval.

## Publication and next phase
- Use the existing private readiness view and grouped source-family triage to prioritize HUMAN_RELEASE_REVIEW and other explicitly classified drafts. Source identity, exact model column, market, variant, evidence, measurement standard, rollback/transaction guards, RLS, SEO, and independent review remain mandatory.
- Larger PDF parsing and newly discovered model import remain a separate pilot; do not simply raise the byte cap or invent extracted values. Reuse document hashes and preserve private data isolation.
- Measure unique source documents, distinct model associations, actually verified technical records and actually published models separately. Photo rights and visual identity remain separately verified. The change makes no daily throughput guarantee.
- Acceptance: offline collector and source selection tests, security review and CI, then controlled authenticated production collector smoke with aggregate receipt, no paid calls, no publication/spec changes. A branch or passing unit tests alone is not proof of deployment. Roll back the collector code if production safety or coverage regresses; no DB schema or model record mutation is required.
