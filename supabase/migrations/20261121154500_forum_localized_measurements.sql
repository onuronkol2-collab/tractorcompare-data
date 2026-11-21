-- Match a measurement as one token before considering bare numbers or model IDs.
-- Spelled-out or ambiguous units without a curated equivalent remain for review.
create or replace function public.tc_forum_fact_tokens(input_text text)
returns text[] language sql immutable strict set search_path = '' as $$
  with normalized as (
    select translate(normalize(input_text, NFKC), '०१२३४५६७८९−', '0123456789-') as body
  ), matches as (
    select parts from normalized cross join lateral regexp_matches(body,
      '([-+]?[0-9]+(?:[.,][0-9]+)*)[[:space:]]*(bar|bars|bares|barlık|бар|бара|баров|バール|巴|बार|kPa|кПа|キロパスカル|千帕|MPa|МПа|メガパスカル|兆帕|psi|kW|кВт|キロワット|千瓦|किलोवाट|hp|PS|CV|ch|rpm|r/min|rev/min|tr/min|giri/min|U/min|dev/dk|d/dk|об/мин|回転/分|转/分|आरपीएम|N[·⋅ ]?m|Н[·⋅ ]?м|牛[·⋅]?米|kg|кг|キログラム|公斤|千克|किलोग्राम|mm|мм|ミリメートル|毫米|मिमी)(?![A-Za-z0-9])|([A-Za-z]+[-.]?[0-9]+(?:[-.][A-Za-z0-9]+)*[A-Za-z]*|[-+]?[0-9]+(?:[.,][0-9]+)*(?:[A-Za-z]+[0-9]*)?)',
      'gi') as parts
  ), tokens as (
    select case when parts[1] is null then lower(replace(parts[3], ',', '.'))
      else replace(parts[1], ',', '.') || ':' || case
        when parts[2] ~* '^(bar|bars|bares|barlık|бар|бара|баров|バール|巴|बार)$' then 'bar'
        when parts[2] ~* '^(kPa|кПа|キロパスカル|千帕)$' then 'kpa'
        when parts[2] ~* '^(MPa|МПа|メガパスカル|兆帕)$' then 'mpa'
        when parts[2] ~* '^(psi)$' then 'psi'
        when parts[2] ~* '^(kW|кВт|キロワット|千瓦|किलोवाट)$' then 'kw'
        when parts[2] ~* '^(hp)$' then 'hp'
        when parts[2] ~* '^(PS|CV|ch)$' then 'ps'
        when parts[2] ~* '^(rpm|r/min|rev/min|tr/min|giri/min|U/min|dev/dk|d/dk|об/мин|回転/分|转/分|आरपीएम)$' then 'rpm'
        when parts[2] ~* '^(N[·⋅ ]?m|Н[·⋅ ]?м|牛[·⋅]?米)$' then 'nm'
        when parts[2] ~* '^(kg|кг|キログラム|公斤|千克|किलोग्राम)$' then 'kg'
        when parts[2] ~* '^(mm|мм|ミリメートル|毫米|मिमी)$' then 'mm'
      end end as token from matches
  )
  select coalesce(array_agg(token order by token collate "C"), array[]::text[]) from tokens
$$;
do $$
declare sample record;
begin
  for sample in select * from (values
    ('125bar', '１２５ バール', true),
    ('125 bar', '125 бар', true),
    ('125 bar', '१२५ बार', true),
    ('2,9 kW', '2.9千瓦', true),
    ('540 dev/dk', '540 tr/min', true),
    ('540 U/min', '540 об/мин', true),
    ('160 N·m', '160 Nm', true),
    ('65 kW', '65 hp', false),
    ('75 hp', '75 PS', false),
    ('125 bar 30 psi', '30 bar 125 psi', false),
    ('HX1302ATC', 'HX1402ATC', false),
    ('5075E', '5075M', false),
    ('-5 mm', '5 mm', false),
    ('−5 мм', '-5mm', true)
  ) as cases(original, translated, equivalent) loop
    if (public.tc_forum_fact_tokens(sample.original) = public.tc_forum_fact_tokens(sample.translated)) <> sample.equivalent then
      raise exception 'Unexpected forum measurement comparison: % / %', sample.original, sample.translated;
    end if;
  end loop;
end $$;
