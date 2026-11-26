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
-- Only the trusted moderation service can read or change report status.
-- Submitting a report never hides or deletes a post automatically.
COMMIT;
