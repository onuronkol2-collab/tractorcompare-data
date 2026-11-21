-- Conservative review signals for substantial prose. Script presence cannot
-- establish fluency or distinguish languages that share a writing system.
create or replace function public.tc_forum_language_issue(source_body text, target_body text, target_locale text)
returns text language sql immutable strict set search_path = '' as $$
 with letters as (
   select regexp_replace(lower(normalize(source_body,NFKC)), '[^[:alpha:]]', '', 'g') as original,
          regexp_replace(lower(normalize(target_body,NFKC)), '[^[:alpha:]]', '', 'g') as translated
 )
 select case
   when length(original)>=24 and original=translated then 'body appears copied from source'
   when length(translated)>=24 and case target_locale
     when 'ru' then translated collate "C" !~ '[А-Яа-яЁё]'
     when 'hi' then translated collate "C" !~ '[ऀ-ॿ]'
     when 'zh' then translated collate "C" !~ '[㐀-䶿一-鿿]'
     when 'ja' then translated collate "C" !~ '[ぁ-ヿ㐀-䶿一-鿿]'
     else false end then 'check target language script'
   else null end from letters
$$;
revoke all on function public.tc_forum_language_issue(text,text,text) from public,anon,authenticated;
grant execute on function public.tc_forum_language_issue(text,text,text) to service_role;

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
$$;

-- Synthetic reference passages exercise the signals without publishing posts.
do $$
declare
 source_text text := '5075E ilk çalıştığında basınç 125 bar. Yağ ısınınca basınç düşüyor ama uyarı ışığı yanmıyor. Bunun nedenini henüz bilmiyorum.';
 sample record;
begin
 for sample in select * from (values
   ('en','On the 5075E the pressure is 125 bar at startup. It drops once the oil warms up, but the warning light stays off. I don’t know why yet.'),
   ('de','Beim 5075E liegt der Druck nach dem Start bei 125 bar. Sobald das Öl warm ist, sinkt der Druck, aber die Warnleuchte bleibt aus. Die Ursache kenne ich noch nicht.'),
   ('fr','Sur le 5075E, la pression est de 125 bar au démarrage. Elle baisse quand l’huile chauffe, mais le voyant reste éteint. Je ne sais pas encore pourquoi.'),
   ('es','En el 5075E, la presión al arrancar es de 125 bares. Baja cuando se calienta el aceite, pero el testigo no se enciende. Todavía no sé por qué.'),
   ('pt-br','No 5075E, a pressão é de 125 bar na partida. Ela cai quando o óleo esquenta, mas a luz de alerta não acende. Ainda não sei a causa.'),
   ('ru','На 5075E при запуске давление составляет 125 бар. Когда масло прогревается, давление падает, но сигнальная лампа не загорается. Причину пока не знаю.'),
   ('hi','5075E को चालू करते समय दबाव 125 बार होता है। तेल गर्म होने पर दबाव घट जाता है, लेकिन चेतावनी की बत्ती नहीं जलती। अभी मुझे इसकी वजह पता नहीं है।'),
   ('zh','5075E 刚启动时压力为 125 巴。油温升高后压力会下降，但警告灯没有亮。我还不知道是什么原因。'),
   ('ja','5075E の始動直後の圧力は 125 バールです。オイルが温まると圧力が下がりますが、警告灯は点灯しません。原因はまだ分かりません。')
 ) as samples(locale,body) loop
   if public.tc_forum_language_issue(source_text,sample.body,sample.locale) is not null or
      public.tc_forum_fact_tokens(source_text) <> public.tc_forum_fact_tokens(sample.body) then
     raise exception 'Reference passage rejected for %',sample.locale;
   end if;
 end loop;
 if public.tc_forum_language_issue(source_text,source_text,'en') is null or
    public.tc_forum_language_issue(source_text,'The pressure falls after the oil warms up.','ru') is null then
   raise exception 'Expected review signal missing';
 end if;
end $$;
