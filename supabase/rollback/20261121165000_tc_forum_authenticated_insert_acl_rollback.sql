-- Only use if new member topic/reply submissions must be suspended.
-- Existing rows stay intact and RLS policies remain untouched.
BEGIN;
REVOKE INSERT ON TABLE public.tc_forum_topics,public.tc_forum_replies FROM authenticated;
COMMIT;
