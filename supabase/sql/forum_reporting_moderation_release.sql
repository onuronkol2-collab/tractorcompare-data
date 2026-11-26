-- Staged report-only release; never reapply the combined candidate.
BEGIN;
SET LOCAL lock_timeout='5s';
-- Reports remain private to the trusted moderation service. One report per
-- member and target, fixed reason codes, no free-text personal information.
CREATE TABLE public.tc_forum_content_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
 topic_id uuid NOT NULL REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 reply_id uuid REFERENCES public.tc_forum_replies(id) ON DELETE CASCADE,
 reason text NOT NULL CHECK(reason IN ('spam','abuse','unsafe','off_topic','other')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE NULLS NOT DISTINCT(reporter_id,topic_id,reply_id)
);
ALTER TABLE public.tc_forum_content_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_content_reports FROM PUBLIC,anon,authenticated;
GRANT INSERT(topic_id,reply_id,reason) ON public.tc_forum_content_reports TO authenticated;
GRANT ALL ON public.tc_forum_content_reports TO service_role;
CREATE INDEX tc_forum_reports_pending_idx ON public.tc_forum_content_reports(status,created_at);
CREATE INDEX tc_forum_reports_topic_idx ON public.tc_forum_content_reports(topic_id);
CREATE INDEX tc_forum_reports_reply_idx ON public.tc_forum_content_reports(reply_id) WHERE reply_id IS NOT NULL;
-- Explicit, initially disabled release switch, readable but never writable by members.
CREATE TABLE public.tc_forum_reporting_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 enabled boolean NOT NULL DEFAULT false
);
INSERT INTO public.tc_forum_reporting_settings(singleton) VALUES(true);
ALTER TABLE public.tc_forum_reporting_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_reporting_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_forum_reporting_settings TO anon,authenticated;
GRANT ALL ON public.tc_forum_reporting_settings TO service_role;
CREATE POLICY tc_reporting_settings_read ON public.tc_forum_reporting_settings FOR SELECT TO anon,authenticated USING(true);
-- Explicit moderator enrollment by the trusted administrator, no self-service grants.
CREATE TABLE public.tc_forum_moderation_members (
 member_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.tc_forum_moderation_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_moderation_members FROM PUBLIC,anon,authenticated;
GRANT SELECT(member_id,active) ON public.tc_forum_moderation_members TO authenticated;
GRANT ALL ON public.tc_forum_moderation_members TO service_role;
CREATE POLICY tc_moderation_members_self ON public.tc_forum_moderation_members FOR SELECT TO authenticated
USING(member_id=(SELECT auth.uid()) AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false');
CREATE POLICY tc_report_submit ON public.tc_forum_content_reports FOR INSERT TO authenticated
WITH CHECK (
 reporter_id=(SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL
 AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND nullif((SELECT auth.jwt())->>'email','') IS NOT NULL
 AND status='pending'
 AND EXISTS(SELECT 1 FROM public.tc_forum_reporting_settings s WHERE s.singleton AND s.enabled)
 AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published')
 AND (reply_id IS NULL OR EXISTS(SELECT 1 FROM public.tc_forum_replies r WHERE r.id=reply_id AND r.topic_id=tc_forum_content_reports.topic_id AND r.status='published'))
);
-- Atomic daily quota. The private counter is never writable by API clients.
-- Increment participates in the report transaction: failed/duplicate inserts
-- including ON CONFLICT DO NOTHING do not consume a slot. A successful report cannot refund its quota.
CREATE SCHEMA tc_forum_reporting_private;
REVOKE ALL ON SCHEMA tc_forum_reporting_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE tc_forum_reporting_private.daily_report_quota (
 reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 report_day date NOT NULL,
 reports_submitted integer NOT NULL CHECK(reports_submitted BETWEEN 1 AND 10),
 PRIMARY KEY(reporter_id,report_day)
);
ALTER TABLE tc_forum_reporting_private.daily_report_quota ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tc_forum_reporting_private.daily_report_quota FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION tc_forum_reporting_private.enforce_daily_report_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $quota$
DECLARE caller uuid:=auth.uid();
BEGIN
 IF caller IS NULL OR NEW.reporter_id IS DISTINCT FROM caller
    OR coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
    OR nullif(auth.jwt()->>'email','') IS NULL
 THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 INSERT INTO tc_forum_reporting_private.daily_report_quota AS q(reporter_id,report_day,reports_submitted)
 VALUES(caller,(now() AT TIME ZONE 'UTC')::date,1)
 ON CONFLICT(reporter_id,report_day) DO UPDATE SET reports_submitted=q.reports_submitted+1
 WHERE q.reports_submitted<10;
 IF NOT FOUND THEN RAISE EXCEPTION 'Daily report limit reached' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END
$quota$;
REVOKE ALL ON FUNCTION tc_forum_reporting_private.enforce_daily_report_quota() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER tc_forum_daily_report_quota AFTER INSERT ON public.tc_forum_content_reports
FOR EACH ROW EXECUTE FUNCTION tc_forum_reporting_private.enforce_daily_report_quota();

-- Reports may be reviewed only by explicitly enrolled moderators. Reporter identity
-- is not granted to any browser role. Queue decisions do not change topic/reply status.
GRANT SELECT(id,topic_id,reply_id,reason,status,created_at),UPDATE(status) ON public.tc_forum_content_reports TO authenticated;
CREATE POLICY tc_report_moderator_read ON public.tc_forum_content_reports FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.tc_forum_moderation_members m WHERE m.member_id=(SELECT auth.uid()) AND m.active AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'));
CREATE POLICY tc_report_moderator_review ON public.tc_forum_content_reports FOR UPDATE TO authenticated
USING(status='pending' AND EXISTS(SELECT 1 FROM public.tc_forum_moderation_members m WHERE m.member_id=(SELECT auth.uid()) AND m.active AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'))
WITH CHECK(status IN ('reviewed','dismissed') AND EXISTS(SELECT 1 FROM public.tc_forum_moderation_members m WHERE m.member_id=(SELECT auth.uid()) AND m.active AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'));
CREATE TABLE tc_forum_reporting_private.review_audit (
 report_id uuid PRIMARY KEY REFERENCES public.tc_forum_content_reports(id) ON DELETE CASCADE,
 reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 decision text NOT NULL CHECK(decision IN ('reviewed','dismissed')),
 reviewed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tc_forum_reporting_private.review_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tc_forum_reporting_private.review_audit FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION tc_forum_reporting_private.audit_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $audit$
DECLARE caller uuid:=auth.uid();
BEGIN
 IF OLD.status<>'pending' OR NEW.status NOT IN ('reviewed','dismissed')
 OR caller IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
 OR NOT EXISTS(SELECT 1 FROM public.tc_forum_moderation_members m WHERE m.member_id=caller AND m.active)
 THEN RAISE EXCEPTION 'Unauthorized review transition' USING ERRCODE='42501'; END IF;
 INSERT INTO tc_forum_reporting_private.review_audit(report_id,reviewer_id,decision) VALUES(NEW.id,caller,NEW.status);
 RETURN NEW;
END
$audit$;
REVOKE ALL ON FUNCTION tc_forum_reporting_private.audit_review() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER tc_report_review_audit AFTER UPDATE OF status ON public.tc_forum_content_reports
FOR EACH ROW WHEN(OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION tc_forum_reporting_private.audit_review();
-- Retention is deliberately an administrator-only scheduled operation.
-- Retain pending reports at most 90 days, resolved reports at most 30 days from review.
CREATE FUNCTION tc_forum_reporting_private.prune_expired_reports()
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $prune$
DECLARE removed bigint;
BEGIN
 DELETE FROM public.tc_forum_content_reports r
 WHERE (r.status='pending' AND r.created_at<now()-interval '90 days')
 OR (r.status IN ('reviewed','dismissed') AND EXISTS(
  SELECT 1 FROM tc_forum_reporting_private.review_audit a WHERE a.report_id=r.id AND a.reviewed_at<now()-interval '30 days'));
 GET DIAGNOSTICS removed=ROW_COUNT;
 DELETE FROM tc_forum_reporting_private.daily_report_quota WHERE report_day<(now() AT TIME ZONE 'UTC')::date-7;
 RETURN removed;
END
$prune$;
REVOKE ALL ON FUNCTION tc_forum_reporting_private.prune_expired_reports() FROM PUBLIC,anon,authenticated,service_role;
-- Submitting a report never hides or deletes a post automatically.
COMMIT;
