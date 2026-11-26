-- Extend disposable assisted publication fixture to match live timestamp shape.
ALTER TABLE public.tc_forum_topics ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
