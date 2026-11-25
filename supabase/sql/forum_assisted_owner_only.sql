
BEGIN;
CREATE TABLE public.tc_forum_assisted_eligible (
 owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.tc_forum_assisted_eligible ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_assisted_eligible FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT(owner_id) ON public.tc_forum_assisted_eligible TO authenticated;
CREATE POLICY tc_assisted_eligible_self ON public.tc_forum_assisted_eligible FOR SELECT TO authenticated USING(owner_id=(SELECT auth.uid()));
INSERT INTO public.tc_forum_assisted_eligible(owner_id)
SELECT id FROM auth.users WHERE id=current_setting('tc.assisted_owner_id')::uuid AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND NOT coalesce(is_anonymous,false);
DO $guard$ BEGIN IF (SELECT count(*) FROM public.tc_forum_assisted_eligible)<>1 THEN RAISE EXCEPTION 'Owner not verified'; END IF; END $guard$;
UPDATE public.tc_forum_assisted_grants g SET revoked=true WHERE NOT revoked AND NOT EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=g.owner_id);
ALTER POLICY tc_assisted_create ON public.tc_forum_assisted_grants WITH CHECK (
 owner_id=(SELECT auth.uid()) AND NOT revoked
 AND EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=tc_forum_assisted_grants.owner_id)
 AND nullif((SELECT auth.jwt())->>'email','') IS NOT NULL
 AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
);
ALTER POLICY tc_assisted_read ON public.tc_forum_assisted_grants USING(owner_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=tc_forum_assisted_grants.owner_id));
ALTER POLICY tc_assisted_revoke ON public.tc_forum_assisted_grants USING(owner_id=(SELECT auth.uid()) AND NOT revoked AND EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=tc_forum_assisted_grants.owner_id)) WITH CHECK(owner_id=(SELECT auth.uid()) AND revoked AND EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=tc_forum_assisted_grants.owner_id));
DO $patch$
DECLARE src text; old_guard text := 'IF NOT FOUND OR g.revoked OR g.expires_at<=clock_timestamp() THEN RAISE EXCEPTION ''No active owner authorization''; END IF;';
BEGIN
 SELECT pg_get_functiondef('tc_assisted_private.publish_topic(uuid,uuid,text,text,text,text,uuid)'::regprocedure) INTO src;
 IF strpos(src,old_guard)=0 THEN RAISE EXCEPTION 'Publisher definition changed'; END IF;
 EXECUTE replace(src,old_guard,old_guard||' IF NOT EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=g.owner_id) THEN RAISE EXCEPTION ''No active owner authorization''; END IF;');
END $patch$;
DO $guard$ BEGIN
 IF has_any_column_privilege('anon','public.tc_forum_assisted_eligible','SELECT') OR has_any_column_privilege('authenticated','public.tc_forum_assisted_eligible','INSERT') OR has_any_column_privilege('authenticated','public.tc_forum_assisted_eligible','UPDATE') OR has_table_privilege('authenticated','public.tc_forum_assisted_eligible','DELETE') THEN RAISE EXCEPTION 'Eligibility ACL invalid'; END IF;
 IF EXISTS(SELECT 1 FROM public.tc_forum_assisted_grants g WHERE NOT g.revoked AND NOT EXISTS(SELECT 1 FROM public.tc_forum_assisted_eligible e WHERE e.owner_id=g.owner_id)) THEN RAISE EXCEPTION 'Unauthorized grant remains'; END IF;
END $guard$;
NOTIFY pgrst,'reload schema';
COMMIT;
