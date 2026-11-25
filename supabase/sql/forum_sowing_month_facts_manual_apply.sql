-- Narrow lexical correction: exclude only the evidenced sowing/harvest phrase from October counting.
-- No publication-state changes, grants, source edits, or provider calls.
BEGIN;
SET LOCAL lock_timeout = '5s';
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
        case when v_i=10 then regexp_replace(source_body, '\müretim giderini ekim döneminde karşılıyor ancak hasat döneminde\M', 'üretim giderini tohum ekme döneminde karşılıyor ancak hasat döneminde', 'g') else source_body end, '\m'||v_months[v_i]||'\M', 'gi') r;
      v_source := v_source || repeat(' '||v_i::text||'月',v_count);
    end loop;
 end if;
 return public.tc_forum_fact_tokens(v_source) = public.tc_forum_fact_tokens(v_target);
end
$function$
;
DO $check$
BEGIN
 IF NOT public.tc_forum_contextual_facts_equal('Çiftçiler birçok üretim giderini ekim döneminde karşılıyor ancak hasat döneminde fiyatı bilmiyor. Ekim 2026.', '農家は播種期に費用を負担する。2026年10月。','ja')
 OR NOT public.tc_forum_contextual_facts_equal('Çiftçiler birçok üretim giderini ekim döneminde karşılıyor ancak hasat döneminde fiyatı bilmiyor. Ekim 2026.', '农民在播种期承担费用。2026年10月。','zh')
 OR public.tc_forum_contextual_facts_equal('Çiftçiler birçok üretim giderini ekim döneminde karşılıyor ancak hasat döneminde fiyatı bilmiyor. Ekim 2026.', '農家は播種期に費用を負担する。2026年11月。','ja')
 OR public.tc_forum_contextual_facts_equal('10 Ekim 2026. 75 hp.', '2026年10月11日。75 hp。','zh')
 OR public.tc_forum_contextual_facts_equal('10 Ekim 2026. 75 hp.', '2026年10月10日。75 PS。','zh')
 OR public.tc_forum_contextual_facts_equal('Ekim 2026. 75 hp.', '2026年。75 hp。','ja')
 OR public.tc_forum_contextual_facts_equal('Çiftçiler birçok üretim giderini ekim döneminde karşılıyor ancak hasat döneminde fiyatı bilmiyor.', '農家は2026年10月に費用を負担する。','ja')
 THEN RAISE EXCEPTION 'Calendar/quantity regression'; END IF;
 IF has_function_privilege('anon','public.tc_forum_contextual_facts_equal(text,text,text)','EXECUTE')
 OR has_function_privilege('authenticated','public.tc_forum_contextual_facts_equal(text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'Private comparator exposed'; END IF;
END
$check$;
COMMIT;
