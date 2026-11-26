-- Use only after exporting real reports and disabling ingestion.
BEGIN;
SET LOCAL lock_timeout='5s';
DROP TRIGGER tc_report_review_audit ON public.tc_forum_content_reports;
DROP TABLE tc_forum_reporting_private.review_audit;
DROP TABLE public.tc_forum_content_reports;
DROP FUNCTION tc_forum_reporting_private.enforce_daily_report_quota();
DROP FUNCTION tc_forum_reporting_private.audit_review();
DROP FUNCTION tc_forum_reporting_private.prune_expired_reports();
DROP TABLE tc_forum_reporting_private.daily_report_quota;
DROP TABLE public.tc_forum_moderation_members;
DROP TABLE public.tc_forum_reporting_settings;
DROP SCHEMA tc_forum_reporting_private;
COMMIT;
