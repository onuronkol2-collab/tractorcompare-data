-- Read-only checks after deployment.
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
