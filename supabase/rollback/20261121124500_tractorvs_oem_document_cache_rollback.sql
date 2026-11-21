-- Safe rollback refuses to delete any collected documents.
BEGIN;
DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.tc_oem_document_cache LIMIT 1) THEN
  RAISE EXCEPTION 'OEM cache has records; export and review before removing it.';
 END IF;
END $$;
DROP TABLE IF EXISTS public.tc_oem_document_cache;
COMMIT;
