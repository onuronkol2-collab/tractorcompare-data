-- TractorVS forum locale-aware date-fact QA.
-- Run manually only after verifying the current database trigger and function versions.
-- 2026-11-22 | Source: AGENTS.md golden integration rule. No API calls.
-- IMPORTANT: Deploy only with a verified read-only preview and rollback.
BEGIN;

CREATE OR REPLACE FUNCTION public.tc_forum_contextual_facts_equal(source_body text, target_body text, target_locale text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE STRICT
 SET search_path TO ''
AS $function$
declare
  v_source text := source_body;
  v_target text := target_body;
  v_months text[] := array['ocak','şubat','mart','nisan','mayıs','haziran',
    'temmuz','ağustos','eylül','ekim','kasım','aralık'];
  v_fr_months text[] := array['janvier','février','mars','avril','mai','juin',
    'juillet','août','septembre','octobre','novembre','décembre'];
  v_names text := '(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)';
  v_fr_names text := '(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)';
  v_source_dates text[];
  v_target_dates text[];
  v_source_ranges text[];
  v_target_ranges text[];
  v_count integer;
  v_i integer;
begin
 if target_locale in ('fr','zh','ja') then
    -- Canonical date triplets prevent swapping day, month or year values.
    select coalesce(array_agg(d order by d),array[]::text[]) into v_source_dates
    from (
      select m[3]||'-'||lpad(array_position(v_months,lower(m[2]))::text,2,'0')
            ||'-'||lpad(m[1],2,'0') as d
      from regexp_matches(source_body,
        '([0-9]{1,2})[[:space:]]+'||v_names||'[[:space:]]+([0-9]{4})','gi') m
    ) q;
    select coalesce(array_agg(d order by d),array[]::text[]) into v_source_ranges
    from (
      select m[3]||'-'||lpad(array_position(v_months,lower(m[1]))::text,2,'0')
        ||'-'||lpad(array_position(v_months,lower(m[2]))::text,2,'0') as d
      from regexp_matches(source_body,
        v_names||'[[:space:]]*[–-][[:space:]]*'||v_names||'[[:space:]]+([0-9]{4})','gi') m
    ) q;
 end if;

 if target_locale='fr' then
    select coalesce(array_agg(d order by d),array[]::text[]) into v_target_dates
    from (
      select m[4]||'-'||lpad(array_position(v_fr_months,lower(m[3]))::text,2,'0')
        ||'-'||lpad(m[1],2,'0') as d
      from regexp_matches(target_body,
        '([0-9]{1,2})(er)?[[:space:]]+'||v_fr_names||'[[:space:]]+([0-9]{4})','gi') m
    ) q;
    select coalesce(array_agg(d order by d),array[]::text[]) into v_target_ranges
    from (
      select m[3]||'-'||lpad(array_position(v_fr_months,lower(m[1]))::text,2,'0')
        ||'-'||lpad(array_position(v_fr_months,lower(m[2]))::text,2,'0') as d
      from regexp_matches(target_body,
        v_fr_names||'[[:space:]]+et[[:space:]]+'||v_fr_names||'[[:space:]]+([0-9]{4})','gi') m
    ) q;
    if v_source_dates is distinct from v_target_dates
       or v_source_ranges is distinct from v_target_ranges then
       return false;
    end if;
    -- Transform only a first-day ordinal with a recognized French month and year.
    v_target := regexp_replace(v_target,
      '\m1er[[:space:]]+'||v_fr_names||'[[:space:]]+([0-9]{4})\M',
      '1 \1 \2','gi');
 elsif target_locale in ('zh','ja') then
    select coalesce(array_agg(d order by d),array[]::text[]) into v_target_dates
    from (
      select m[1]||'-'||lpad(m[2],2,'0')||'-'||lpad(m[3],2,'0') as d
      from regexp_matches(target_body,
        '([0-9]{4})年([0-9]{1,2})月([0-9]{1,2})日','g') m
    ) q;
    select coalesce(array_agg(d order by d),array[]::text[]) into v_target_ranges
    from (
      select m[1]||'-'||lpad(m[2],2,'0')||'-'||lpad(m[4],2,'0') as d
      from regexp_matches(target_body,
        '([0-9]{4})年([0-9]{1,2})月(至|から)([0-9]{1,2})月','g') m
    ) q;
    if v_source_dates is distinct from v_target_dates
       or v_source_ranges is distinct from v_target_ranges then
       return false;
    end if;
    -- Add each spelled Turkish month as a source fact rather than dropping target facts.
    for v_i in 1..12 loop
      select count(*)::integer into v_count from regexp_matches(
        source_body, '\m'||v_months[v_i]||'\M', 'gi') r;
      v_source := v_source || repeat(' '||v_i::text||'月',v_count);
    end loop;
 end if;
 return public.tc_forum_fact_tokens(v_source) = public.tc_forum_fact_tokens(v_target);
end
$function$
;
REVOKE ALL ON FUNCTION public.tc_forum_contextual_facts_equal(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tc_forum_contextual_facts_equal(text,text,text) TO service_role;

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

  select title, body, source_hash, source_locale into source_row
    from public.tc_forum_translation_sources
    where entity_kind = tg_argv[0] and entity_id = entity;
  if not found or source_row.source_hash is distinct from new.source_hash then
    reason := 'source unavailable or changed';
  elsif nullif(btrim(new.reviewed_by_model), '') is null then
    reason := 'missing translation review';
  elsif not (
    case when source_row.source_locale='tr' and new.locale in ('fr','zh','ja')
      then public.tc_forum_contextual_facts_equal(source_row.body,new.body,new.locale)
      else public.tc_forum_fact_tokens(source_row.body) = public.tc_forum_fact_tokens(new.body)
    end
  ) then
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
COMMIT;
