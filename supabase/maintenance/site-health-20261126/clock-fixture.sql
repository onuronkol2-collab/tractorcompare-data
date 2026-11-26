-- Extend disposable assisted publication fixture to match live timestamp shape.
ALTER TABLE public.tc_forum_topics ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
-- The legacy assisted fixture omits reply RLS because it only exercises
-- topic publication. Mirror production's owner visibility for this fixture.
ALTER TABLE public.tc_forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY clock_fixture_reply_read ON public.tc_forum_replies FOR SELECT TO authenticated USING(author_id=(SELECT auth.uid()));
CREATE POLICY clock_fixture_reply_insert ON public.tc_forum_replies FOR INSERT TO authenticated WITH CHECK(author_id=(SELECT auth.uid()));
