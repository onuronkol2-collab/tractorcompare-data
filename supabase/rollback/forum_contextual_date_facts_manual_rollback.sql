-- TractorVS: deliberate rollback of locale-aware date publication QA.
-- Returns to conservative original strict fact comparison (may flag natural FR/CJK dates).
-- Never changes existing translation rows, SEO states, RLS, queue or external providers.
BEGIN;
CREATE OR REPLACE FUNCTION public.tc_forum_review_translation_facts()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  source_row record;
  entity uuid;
  reason text;
begin
  if new.state <> 'ready' then return new; end if;
  if tg_argv[0] = 'topic' then entity := new.topic_id;
  else entity := new.reply_id; end if;

  select title, body, source_hash into source_row
    from public.tc_forum_translation_sources
    where entity_kind = tg_argv[0] and entity_id = entity;
  if not found or source_row.source_hash is distinct from new.source_hash then
    reason := 'source unavailable or changed';
  elsif nullif(btrim(new.reviewed_by_model), '') is null then
    reason := 'missing translation review';
  elsif public.tc_forum_fact_tokens(source_row.body) <> public.tc_forum_fact_tokens(new.body) then
    reason := 'check numbers and model codes in body';
  elsif public.tc_forum_language_issue(source_row.body, new.body, new.locale) is not null then
    reason := public.tc_forum_language_issue(source_row.body, new.body, new.locale);
  elsif tg_argv[0] = 'topic' then
    if public.tc_forum_fact_tokens(source_row.title) <> public.tc_forum_fact_tokens(new.title) then
      reason := 'check numbers and model codes in title';
    end if;
  end if;
  if reason is not null then
    new.state := 'needs_review';
    new.qa_notes := concat_ws(E'\n', nullif(new.qa_notes, ''), reason);
    if tg_argv[0] = 'topic' then new.seo_approved := false; end if;
  end if;
  return new;
end
$function$
;
DROP FUNCTION IF EXISTS public.tc_forum_contextual_facts_equal(text,text,text);
COMMIT;
