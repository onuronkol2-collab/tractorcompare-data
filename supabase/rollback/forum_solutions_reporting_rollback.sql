-- Only roll back this additive feature after exporting any real user records.
BEGIN;
SET LOCAL lock_timeout='5s';
DROP TABLE public.tc_forum_content_reports;
DROP FUNCTION tc_forum_reporting_private.enforce_daily_report_quota();
DROP TABLE tc_forum_reporting_private.daily_report_quota;
DROP SCHEMA tc_forum_reporting_private;
DROP TABLE public.tc_forum_accepted_solutions;
COMMIT;
