-- TractorVS / P0 forum posting ACL repair, 2026-11-21.
-- Public reading is permitted; public anonymous writes MUST stay disabled.
-- Authenticated writes are protected by existing author_id=auth.uid(),
-- status='pending', moderation and anti-abuse triggers.
BEGIN;
DO $guard$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tc_forum_topics'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.tc_forum_replies'::regclass) THEN
    RAISE EXCEPTION 'Forum RLS is required before allowing authenticated INSERT';
  END IF;
  IF NOT EXISTS(
      SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='tc_forum_topics' AND cmd='INSERT'
        AND 'authenticated'=ANY(roles)
        AND with_check LIKE '%pending%' AND with_check LIKE '%auth.uid%'
  ) OR NOT EXISTS(
      SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='tc_forum_replies' AND cmd='INSERT'
        AND 'authenticated'=ANY(roles)
        AND with_check LIKE '%pending%' AND with_check LIKE '%auth.uid%'
  ) THEN RAISE EXCEPTION 'Required pending/ownership INSERT policies missing'; END IF;
END
$guard$;
GRANT INSERT ON TABLE public.tc_forum_topics,public.tc_forum_replies TO authenticated;
REVOKE INSERT ON TABLE public.tc_forum_topics,public.tc_forum_replies FROM anon;
COMMIT;
