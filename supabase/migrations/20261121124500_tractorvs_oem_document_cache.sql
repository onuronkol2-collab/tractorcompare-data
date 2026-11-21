-- TractorVS zero-paid OEM document cache; private, source-only, no publication.
-- All API access to this public-schema table is service_role only; RLS defense-in-depth.
BEGIN;
CREATE TABLE IF NOT EXISTS public.tc_oem_document_cache(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_url text NOT NULL UNIQUE CHECK(
   length(source_url) BETWEEN 12 AND 1600 AND source_url LIKE 'https://%'
 ),
 source_host text NOT NULL CHECK(length(source_host) BETWEEN 3 AND 255),
 status text NOT NULL CHECK(status IN(
   'fetched_html','pdf_pending_parse','redirect_review','http_error',
   'unsupported_type','too_large','fetch_error','robots_blocked'
 )),
 http_status integer NULL CHECK(http_status BETWEEN 100 AND 599),
 media_type text NULL CHECK(length(media_type)<=100),
 content_sha256 text NULL CHECK(content_sha256 ~ '^[0-9a-f]{64}$'),
 content_bytes integer NULL CHECK(content_bytes BETWEEN 0 AND 800000),
 excerpt text NULL CHECK(length(excerpt)<=1400),
 model_mention_hint boolean NOT NULL DEFAULT false,
 observed_at timestamptz NOT NULL DEFAULT now(),
 next_check_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tc_oem_document_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_oem_document_cache FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.tc_oem_document_cache TO service_role;
CREATE INDEX IF NOT EXISTS idx_tc_oem_document_cache_next_check
 ON public.tc_oem_document_cache(next_check_at);
COMMENT ON TABLE public.tc_oem_document_cache IS
 'Private-only bounded public manufacturer source cache. No verified technical facts or published model data; Edge service-role only.';
COMMIT;
