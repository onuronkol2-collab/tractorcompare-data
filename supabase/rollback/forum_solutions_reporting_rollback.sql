-- Only roll back this additive feature after exporting any real user records.
BEGIN;
SET LOCAL lock_timeout='5s';
DROP TABLE public.tc_forum_content_reports;
DROP TABLE public.tc_forum_accepted_solutions;
COMMIT;
