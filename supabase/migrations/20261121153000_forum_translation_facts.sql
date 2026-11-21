-- Keep factual tokens intact across localized forum posts. Uncertain output
-- remains available to moderators through the existing needs_review state.
create or replace function public.tc_forum_fact_tokens(input_text text)
returns text[] language sql immutable strict set search_path = '' as $$
  select coalesce(array_agg(token order by token collate "C"), array[]::text[])
  from (
    select lower(replace(m[1], ',', '.')) as token
    from regexp_matches(
      translate(normalize(input_text, NFKC), '०१२३४५६७८९−', '0123456789-'),
      '([A-Za-z]+[-.]?[0-9]+(?:[-.][A-Za-z0-9]+)*[A-Za-z]*|[-+]?[0-9]+(?:[.,][0-9]+)*(?:[A-Za-z]+[0-9]*)?)',
      'g') as m
    union all
    -- Attach a pressure unit to its value so swapping two readings is caught.
    select replace(m[1], ',', '.') || ':' || case lower(m[2])
      when 'бар' then 'bar' when 'バール' then 'bar' when '巴' then 'bar'
      when 'bars' then 'bar' when 'bares' then 'bar' when 'barlık' then 'bar'
      when 'кпа' then 'kpa' when 'мпа' then 'mpa' else lower(m[2]) end
    from regexp_matches(
      translate(normalize(input_text, NFKC), '०१२३४५६७८९−', '0123456789-'),
      '([-+]?[0-9]+(?:[.,][0-9]+)*)[[:space:]]*(barlık|bares|bars|bar|бар|バール|巴|kpa|mpa|кпа|мпа|psi)(?![a-z])',
      'gi') as m
  ) as tokens
$$;

create or replace function public.tc_forum_review_translation_facts()
returns trigger language plpgsql security invoker set search_path = '' as $$
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
$$;

create or replace trigger tc_forum_review_topic_facts before insert or update
on public.tc_forum_topic_translations for each row
execute function public.tc_forum_review_translation_facts('topic');
create or replace trigger tc_forum_review_reply_facts before insert or update
on public.tc_forum_reply_translations for each row
execute function public.tc_forum_review_translation_facts('reply');
revoke all on function public.tc_forum_fact_tokens(text), public.tc_forum_review_translation_facts() from public, anon, authenticated;
grant execute on function public.tc_forum_fact_tokens(text) to service_role;
