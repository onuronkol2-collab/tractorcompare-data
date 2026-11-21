-- Safe read-only post-deployment guard.
SELECT
 to_regclass('public.tc_oem_document_cache') IS NOT NULL table_exists,
 c.relrowsecurity rls_enabled,
 NOT has_table_privilege('anon','public.tc_oem_document_cache','SELECT') anon_denied,
 NOT has_table_privilege('authenticated','public.tc_oem_document_cache','SELECT') auth_denied,
 has_table_privilege('service_role','public.tc_oem_document_cache','INSERT') service_can_write,
 (SELECT count(*) FROM public.tc_oem_document_cache) documents_cached
FROM pg_class c WHERE c.oid='public.tc_oem_document_cache'::regclass;
SELECT status,count(*) FROM public.tc_oem_document_cache GROUP BY status ORDER BY status;
