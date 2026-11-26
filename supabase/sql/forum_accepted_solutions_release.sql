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

COMMIT;
