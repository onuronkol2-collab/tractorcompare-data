-- Public member directory is opt-in; do not expose private/unlisted profiles
-- through direct PostgREST reads of tc_member_profiles.
-- Keep existing show_leaderboard choices and owner access intact.
BEGIN;

ALTER TABLE public.tc_member_profiles
  ALTER COLUMN show_leaderboard SET DEFAULT false;

DROP POLICY IF EXISTS tc_member_profile_read ON public.tc_member_profiles;
CREATE POLICY tc_member_profile_read ON public.tc_member_profiles
  FOR SELECT TO anon,authenticated
  USING ((show_leaderboard IS TRUE) OR (id = (select auth.uid())));

COMMENT ON COLUMN public.tc_member_profiles.show_leaderboard IS
  'Explicit opt-in for public member listings. New and neutral profiles default private.';

COMMIT;
