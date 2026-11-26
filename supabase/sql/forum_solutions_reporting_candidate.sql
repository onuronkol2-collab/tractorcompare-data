-- Additive candidate. Apply only after isolated CI, review and production preflight.
-- No existing table, policy, content, translation or publication status is modified.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE TABLE public.tc_forum_accepted_solutions (
 topic_id uuid PRIMARY KEY REFERENCES public.tc_forum_topics(id) ON DELETE CASCADE,
 reply_id uuid NOT NULL REFERENCES public.tc_forum_replies(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tc_forum_accepted_solutions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tc_forum_accepted_solutions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.tc_forum_accepted_solutions TO anon,authenticated;
GRANT INSERT(topic_id,reply_id),UPDATE(reply_id),DELETE ON public.tc_forum_accepted_solutions TO authenticated;
GRANT ALL ON public.tc_forum_accepted_solutions TO service_role;
CREATE INDEX tc_forum_accepted_solutions_reply_idx ON public.tc_forum_accepted_solutions(reply_id);
CREATE POLICY tc_solution_public_read ON public.tc_forum_accepted_solutions FOR SELECT TO anon,authenticated
USING (
 EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.status='published' AND t.category IN ('questions','maintenance'))
 AND EXISTS(SELECT 1 FROM public.tc_forum_replies r WHERE r.id=reply_id AND r.topic_id=tc_forum_accepted_solutions.topic_id AND r.status='published')
);
-- The owner can replace/remove a stale selection after a reply is moderated.
-- This reveals only the selection the owner made, not the hidden reply body.
CREATE POLICY tc_solution_owner_read ON public.tc_forum_accepted_solutions FOR SELECT TO authenticated
USING (
 (SELECT auth.uid()) IS NOT NULL AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.author_id=(SELECT auth.uid()) AND t.status='published' AND t.category IN ('questions','maintenance'))
);
CREATE POLICY tc_solution_owner_insert ON public.tc_forum_accepted_solutions FOR INSERT TO authenticated
WITH CHECK (
 (SELECT auth.uid()) IS NOT NULL AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.author_id=(SELECT auth.uid()) AND t.status='published' AND t.category IN ('questions','maintenance'))
 AND EXISTS(SELECT 1 FROM public.tc_forum_replies r WHERE r.id=reply_id AND r.topic_id=tc_forum_accepted_solutions.topic_id AND r.status='published')
);
CREATE POLICY tc_solution_owner_update ON public.tc_forum_accepted_solutions FOR UPDATE TO authenticated
USING (
 (SELECT auth.uid()) IS NOT NULL AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.author_id=(SELECT auth.uid()) AND t.status='published' AND t.category IN ('questions','maintenance'))
)
WITH CHECK (
 (SELECT auth.uid()) IS NOT NULL AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.author_id=(SELECT auth.uid()) AND t.status='published' AND t.category IN ('questions','maintenance'))
 AND EXISTS(SELECT 1 FROM public.tc_forum_replies r WHERE r.id=reply_id AND r.topic_id=tc_forum_accepted_solutions.topic_id AND r.status='published')
);
CREATE POLICY tc_solution_owner_delete ON public.tc_forum_accepted_solutions FOR DELETE TO authenticated
USING (
 (SELECT auth.uid()) IS NOT NULL AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND EXISTS(SELECT 1 FROM public.tc_forum_topics t WHERE t.id=topic_id AND t.author_id=(SELECT auth.uid()) AND t.status='published' AND t.category IN ('questions','maintenance'))
);

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
CREATE POLICY tc_report_submit ON public.tc_forum_content_reports FOR INSERT TO authenticated
WITH CHECK (
 reporter_id=(SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL
 AND coalesce((SELECT auth.jwt())->>'is_anonymous','false')='false'
 AND nullif((SELECT auth.jwt())->>'email','') IS NOT NULL
 AND status='pending'
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

-- Only the trusted moderation service can read or change report status.
-- Submitting a report never hides or deletes a post automatically.
COMMIT;
