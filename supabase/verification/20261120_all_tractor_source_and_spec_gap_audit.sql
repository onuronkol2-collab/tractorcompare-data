-- TractorVS | reusable complete inventory and quality/coverage audit
-- Controlled owner/Supabase maintenance session ONLY. Contains draft identities:
-- never upload query output publicly, never copy into public GitHub Actions artifacts.
-- Strictly read-only. No automatic publication, no guessed specifications.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

-- 1. Manufacturer model and field coverage by publication state.
WITH coverage AS (
 SELECT t.id,t.status,b.name brand,t.model_name,t.variant,t.market,t.model_year,t.horsepower,
 COUNT(s.id) AS rows,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL
   AND NULLIF(BTRIM(COALESCE(s.evidence_text,'')),'') IS NOT NULL) AS proof_complete,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NULL) AS date_missing,
 COUNT(s.id) FILTER(WHERE s.source_id IS NULL) AS link_missing,
 COUNT(s.id) FILTER(WHERE NULLIF(BTRIM(COALESCE(s.evidence_text,'')),'') IS NULL) AS quote_missing,
 COUNT(DISTINCT s.canonical_key) AS distinct_keys,
 BOOL_OR(s.canonical_key ~* '(engine.*power|horsepower|rated.*power|engine.*model)') AS has_engine,
 BOOL_OR(s.canonical_key ~* '(transmission|gear|shuttle|cvt)') AS has_transmission,
 BOOL_OR(s.canonical_key ~* '(pto|power_take_off)') AS has_pto,
 BOOL_OR(s.canonical_key ~* '(hydraulic|lift|hitch)') AS has_hydraulics,
 BOOL_OR(s.canonical_key ~* '(fuel.*tank|fuel.*capacity|tank_capacity)') AS has_fuel,
 BOOL_OR(s.canonical_key ~* '(weight|mass|operating_weight)') AS has_weight,
 BOOL_OR(s.canonical_key ~* '(length|width|height|wheelbase|track|clearance)') AS has_dimensions,
 BOOL_OR(s.canonical_key ~* '(brake|diff.*lock|steering|axle)') AS has_brakes_axles,
 COUNT(DISTINCT d.source_url) FILTER(WHERE d.source_url ~ '^https://') AS source_url_count
 FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
 LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 LEFT JOIN public.data_sources d ON d.id=s.source_id
 WHERE t.status IN('published','draft')
 GROUP BY t.id,b.name
)
SELECT status,COUNT(*) models,SUM(rows) spec_rows,SUM(proof_complete) fully_evidenced,
 SUM(date_missing) unverified_dates,SUM(quote_missing) missing_quotes,
 COUNT(*) FILTER(WHERE rows=0) models_without_specs,
 COUNT(*) FILTER(WHERE rows>=10 AND rows<25) models_with_10_24,
 COUNT(*) FILTER(WHERE rows>=25) models_with_25_plus,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_engine,false)) missing_engine,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_transmission,false)) missing_transmission,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_pto,false)) missing_pto,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_hydraulics,false)) missing_hydraulics,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_fuel,false)) missing_fuel,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_weight,false)) missing_weight,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_dimensions,false)) missing_dimensions,
 COUNT(*) FILTER(WHERE NOT COALESCE(has_brakes_axles,false)) missing_brakes_axles,
 COUNT(*) FILTER(WHERE rows<>distinct_keys) models_with_duplicate_keys
FROM coverage GROUP BY status ORDER BY status;

-- 2. All published-and-draft identities ranked by missing proof and core
-- technical categories. The regular task should work on as MANY real model
-- families as safely provable per run, not stop after only 3–5 models.
WITH coverage AS (
 SELECT t.id, t.status,b.name brand,t.model_name,t.variant,t.market,t.model_year,
 COUNT(s.id) spec_rows,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND s.source_id IS NOT NULL AND
  NULLIF(trim(coalesce(s.evidence_text,'')),'') IS NOT NULL) full_evidence,
 COUNT(DISTINCT d.source_url) FILTER(WHERE d.source_url LIKE 'https://%') source_count,
 BOOL_OR(s.canonical_key LIKE 'engine%') has_engine,
 BOOL_OR(s.canonical_key ~* '(transmission|gear|cvt|shuttle)') has_transmission,
 BOOL_OR(s.canonical_key ~* '(pto|power_take_off)') has_pto,
 BOOL_OR(s.canonical_key ~* '(hydraulic|lift|hitch)') has_hydraulics,
 BOOL_OR(s.canonical_key ~* '(weight|mass)') has_weight
 FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
 LEFT JOIN public.tractor_specs s ON s.tractor_id=t.id
 LEFT JOIN public.data_sources d ON d.id=s.source_id
 WHERE t.status IN('published','draft') GROUP BY t.id,b.name
)
SELECT status,brand,model_name,variant,market,model_year,spec_rows,full_evidence,
spec_rows-full_evidence gap,source_count,
NOT COALESCE(has_engine,false) engine_missing,
NOT COALESCE(has_transmission,false) gearbox_missing,
NOT COALESCE(has_pto,false) pto_missing,
NOT COALESCE(has_hydraulics,false) hydraulics_missing,
NOT COALESCE(has_weight,false) weight_missing
FROM coverage
ORDER BY CASE WHEN status='published' THEN 0 ELSE 1 END,
 (spec_rows-full_evidence) DESC,
 (NOT COALESCE(has_pto,false)) DESC,
 spec_rows DESC,brand,model_name
LIMIT 200;

-- 3. Exact manufacturer SOURCE FAMILIES. An HTML URL / PDF attachment
-- covering several tractors is not enough: verify each column, year, power
-- scope and mechanical options before issuing any model status UPDATE.
SELECT d.source_url,d.source_type,d.publisher,
 COUNT(DISTINCT t.id) covered_draft_models,
 COUNT(s.id) source_spec_rows,
 COUNT(s.id) FILTER(WHERE s.verified_at IS NOT NULL AND
   NULLIF(BTRIM(COALESCE(s.evidence_text,'')),'') IS NOT NULL) verified_source_rows,
 COUNT(s.id) FILTER(WHERE s.evidence_text ILIKE '%'||t.model_name||'%') evidence_names_model,
 STRING_AGG(DISTINCT b.name,', ' ORDER BY b.name) brands,
 LEFT(STRING_AGG(DISTINCT t.model_name||COALESCE(' ['||t.variant||']',''),', ' ORDER BY
   t.model_name||COALESCE(' ['||t.variant||']','')),600) model_examples
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
JOIN public.tractor_specs s ON s.tractor_id=t.id
JOIN public.data_sources d ON d.id=s.source_id
WHERE t.status='draft' AND d.source_url LIKE 'https://%'
GROUP BY d.id HAVING COUNT(DISTINCT t.id)>=2 AND COUNT(s.id)>=10
ORDER BY source_spec_rows DESC,covered_draft_models DESC LIMIT 80;

-- 4. DATA-TYPE and power/weight problems: actual manufacturer engine hp vs
-- potentially guessed model-number horsepower; kg/HP is a ratio, never kg.
SELECT b.name brand,t.model_name,t.variant,t.status,t.horsepower,t.weight_kg,
s.canonical_key,s.spec_name,s.spec_value,s.unit,d.source_url
FROM public.tractor_specs s JOIN public.tractors t ON s.tractor_id=t.id
JOIN public.brands b ON b.id=t.brand_id LEFT JOIN public.data_sources d ON d.id=s.source_id
WHERE t.status IN('published','draft') AND (
 (s.canonical_key LIKE '%weight%' AND s.unit ~* '(kg/HP|hp/kg)')
 OR (s.canonical_key LIKE '%power%' AND s.unit ~* '(kg|kgf|kN)')
 OR (s.canonical_key LIKE '%lift%' AND s.unit ~* '(kg/HP|HP)')
 OR (s.canonical_key LIKE '%displacement%' AND s.unit ~* '(hp|kW)')
 )
ORDER BY b.name,t.model_name LIMIT 150;

-- 5. Duplicate model identities and SAME-FIELD contradictory values:
-- model year, market, gear variant and trim must remain distinct.
SELECT b.name brand,t.model_name,t.variant,t.market,t.model_year,COUNT(*) overlapping_models
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id WHERE t.status<>'archived'
GROUP BY b.name,t.model_name,t.variant,t.market,t.model_year HAVING COUNT(*)>1
ORDER BY overlapping_models DESC LIMIT 80;
SELECT b.name brand,t.model_name,t.variant,t.market,s.canonical_key,
 COUNT(DISTINCT trim(s.spec_value)) contradictory_values,
 STRING_AGG(DISTINCT trim(s.spec_value),' <> ') values_seen
FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
JOIN public.tractor_specs s ON s.tractor_id=t.id
WHERE t.status IN('published','draft') AND s.canonical_key IS NOT NULL
GROUP BY t.id,b.name,s.canonical_key HAVING COUNT(DISTINCT trim(s.spec_value))>1
ORDER BY b.name,t.model_name LIMIT 80;

-- 6. The public site must NEVER expose unapproved model specs.
SELECT COUNT(*) AS draft_or_archived_public_spec_leaks
FROM public.tractorvs_public_specs v JOIN public.tractors t ON t.id=v.tractor_id
WHERE t.status<>'published';
ROLLBACK;
