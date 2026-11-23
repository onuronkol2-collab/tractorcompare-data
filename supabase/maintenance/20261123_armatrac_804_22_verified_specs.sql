-- 2026-11-23: model-exact, producer-backed ArmaTrac Fruit Garden source-only supplement.
-- Safe, transactional and fail-closed: no tractor status/ID/summary edits or RLS changes.
-- Run once after PR CI is green. Do NOT infer disputed 804 cabin displacement/torque.
-- ROLLBACK: select only rows with these exact tractor UUIDs and exact brochure source IDs
-- AND the batch-specific evidence marker before removing anything; never bulk-delete other research.
DO $batch$
DECLARE
  cab constant uuid := '619e4fd9-1155-4927-b488-4f55c95ee739';
  rops constant uuid := '362ad12b-7e89-4adf-83df-841b96b0362e';
  cab_url constant text := 'https://armatrac.com/shared/files/804cabinfruitgarden_1760621707.pdf';
  rops_url constant text := 'https://armatrac.com/shared/files/80248044fg_1514187919.pdf';
  cab_source uuid;
  rops_source uuid;
  existing integer;
  created integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('tractorvs-armatrac-804-reviewed-20261123',0));
  IF (SELECT count(*) FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
      WHERE b.name='ArmaTrac' AND t.status='published'
      AND ((t.id=cab AND t.model_name='804 Fruit Garden Cabin' AND t.variant ILIKE '%cab%')
        OR (t.id=rops AND t.model_name='804.4 Fruit Garden ROPS' AND t.variant ILIKE '%ROPS%'))) <> 2 THEN
    RAISE EXCEPTION 'Exact two published ArmaTrac 804 Fruit Garden variant IDs are not present';
  END IF;

  WITH wanted(model_code,canonical_key,spec_name,spec_value,unit,measurement_standard,evidence_text,comparison_class) AS (
    VALUES
    ('cab', 'engine_cylinders', 'Engine cylinders', '4', NULL, '4 cylinders; motor displacement in same sheet is internally inconsistent with its bore/stroke, and therefore excluded', 'ENGINE: Number of cylinders / cubic capacity, four cylinders', 'engine'),
    ('cab', 'transmission_type', 'Transmission type', 'ZF T-537', NULL, 'Manufacturer 804 Fruit Garden Cabin brochure; precise series/variant gearbox', 'TRANSMISSION: Type ZF T-537', 'drivetrain'),
    ('cab', 'transmission_gears', 'Transmission gears', '16 forward / 8 reverse', NULL, 'Manufacturer 804 Fruit Garden Cabin brochure; forward and reverse counts, not powershift claim', 'TRANSMISSION: Gears forwards/reverse, 16/8', 'drivetrain'),
    ('cab', 'pto_type', 'PTO type', 'Independent', NULL, 'Manufacturer brochure lists PTO as independent; no PTO clutch actuation extrapolation', 'PTO SHAFT: Type Independent', 'pto'),
    ('cab', 'rear_lift_capacity', 'Rear hitch lift capacity', '2800', 'kg', 'Manufacturer 804 Fruit Garden Cabin specification; lift measurement point not stated; not front-loader or ISO 24-inch rating', 'HYDRAULICS: Lift capacity 2800 kg', 'hydraulics'),
    ('cab', 'hydraulic_main_flow', 'Main hydraulic pump flow', '48.5', 'L/min', 'At manufacturer stated 2400 rpm; not an idle-flow rating or combined steering flow', 'HYDRAULICS: Pump capacity 48.5 L/min at 2400 rpm', 'hydraulics'),
    ('cab', 'wheelbase', 'Wheelbase', '2250', 'mm', 'Manufacturer brochure; axle and tyre configuration unspecified', 'DIMENSIONS: B-Wheelbase 2250 mm', 'dimensions_weights'),
    ('cab', 'overall_width', 'Overall width', '1680', 'mm', 'Manufacturer brochure; width for the illustrated/documented configuration, may vary with tyre/track', 'DIMENSIONS: E-Width 1680 mm', 'dimensions_weights'),
    ('cab', 'ground_clearance', 'Ground clearance', '285', 'mm', 'Manufacturer brochure; tyre/drive condition unspecified; not ground clearance with trailer', 'DIMENSIONS: F-Ground clearance 285 mm', 'dimensions_weights'),
    ('cab', 'operating_weight_cab', 'Weight with cab, without extra ballast', '3100', 'kg', 'Unballasted, Cab variant of 804 Fruit Garden; NOT ROPS; do not infer ISO operating weight', 'DIMENSIONS: Tractor weight [Unballast], Cab 3100 kg', 'dimensions_weights'),
    ('rops', 'engine_model', 'Engine model', 'Perkins 1104D-44T', NULL, 'Manufacturer brochure column 804.4 FG; parenthetical factory code not treated as a separate market trim', 'ENGINE: Model PERKINS / 1104D-44T', 'engine'),
    ('rops', 'engine_cylinders', 'Engine cylinders', '4', NULL, 'Manufacturer 804.4 FG ROPS brochure; explicit four cylinder count', 'ENGINE: Number of cylinders 4', 'engine'),
    ('rops', 'engine_displacement', 'Engine displacement', '4.4', 'L', 'Manufacturer 804.4 FG ROPS brochure; 4.4 L and 105 x 127 mm bore/stroke agree', 'ENGINE: Cubic capacity 4.4 liters', 'engine'),
    ('rops', 'transmission_type', 'Transmission type', 'ZF T-537', NULL, 'Manufacturer 804.4 FG ROPS brochure; ZF T-537, not a CRD5 model', 'TRANSMISSION: Type ZF T-537', 'drivetrain'),
    ('rops', 'transmission_gears', 'Transmission gears', '16 forward / 8 reverse', NULL, 'Manufacturer 804.4 FG ROPS brochure; actual 16F/8R gearing', 'TRANSMISSION: Gears forwards/reverse, 16/8', 'drivetrain'),
    ('rops', 'pto_type', 'PTO type', 'Independent', NULL, 'Manufacturer 804.4 FG ROPS brochure; excludes optional speed assumptions', 'PTO SHAFT: Type Independent', 'pto'),
    ('rops', 'rear_lift_capacity', 'Rear hitch lift capacity', '2800', 'kg', 'Manufacturer 804.4 FG ROPS; 3-point lift point not specified; not a front loader', 'HYDRAULICS: Lift capacity 2800 kg', 'hydraulics'),
    ('rops', 'hydraulic_main_flow', 'Main hydraulic pump flow', '48.5', 'L/min', 'At manufacturer stated 2400 rpm; not system capacity at other engine speeds', 'HYDRAULICS: Pump capacity 48.5 L/min at 2400 rpm', 'hydraulics'),
    ('rops', 'wheelbase', 'Wheelbase', '2250', 'mm', '804.4 FG column only; do not reuse 802.4 FG 2220 mm', 'DIMENSIONS: B-Wheelbase 2250 mm (804.4 FG column)', 'dimensions_weights'),
    ('rops', 'overall_width', 'Overall width', '1680', 'mm', '804.4 FG brochure; nominal width, tyre/track variations may alter', 'DIMENSIONS: E-Width 1680 mm (804.4 FG column)', 'dimensions_weights'),
    ('rops', 'ground_clearance', 'Ground clearance', '285', 'mm', '804.4 FG column only; 802.4 FG is a different clearance; not with trailer', 'DIMENSIONS: F-Ground clearance 285 mm (804.4 FG)', 'dimensions_weights'),
    ('rops', 'operating_weight', 'Weight without ballast (ROPS)', '2850', 'kg', 'Unballasted ROPS weight for 804.4 FG, NOT cabin version and not full-fuel operating mass', 'DIMENSIONS: Tractor Weight [Unballast] Rollbar 2850 kg (804.4 FG)', 'dimensions_weights')
  )
  SELECT count(*) INTO existing
  FROM wanted w JOIN public.tractor_specs s
  ON s.tractor_id=(CASE w.model_code WHEN 'cab' THEN cab ELSE rops END)
  AND s.canonical_key=w.canonical_key;
  IF existing>0 THEN RAISE EXCEPTION 'Existing canonical keys overlap with the 22-row batch (% rows); no values overwritten', existing; END IF;

  INSERT INTO public.data_sources(publisher,source_url,source_type,source_priority,accessed_at,notes)
  SELECT 'ArmaTrac / Erkunt (manufacturer)',cab_url,'official_model_brochure',100,now(),
    '804 Fruit Garden Cabin; historic brochure has 3.3 L vs 105x127x4 geometric inconsistency and 310Nm vs 307Nm product-page conflict; disputed displacement, torque, hydraulic pressure and power excluded'
  WHERE NOT EXISTS(SELECT 1 FROM public.data_sources WHERE source_url=cab_url);
  INSERT INTO public.data_sources(publisher,source_url,source_type,source_priority,accessed_at,notes)
  SELECT 'ArmaTrac / Erkunt (manufacturer)',rops_url,'official_model_brochure',100,now(),
    '802.4 FG vs 804.4 FG manufacturer table: ONLY 804.4 FG right-hand model column used; disputed power-standard and hydraulic-pressure values excluded'
  WHERE NOT EXISTS(SELECT 1 FROM public.data_sources WHERE source_url=rops_url);

  SELECT id INTO cab_source FROM public.data_sources WHERE source_url=cab_url ORDER BY accessed_at DESC NULLS LAST,id LIMIT 1;
  SELECT id INTO rops_source FROM public.data_sources WHERE source_url=rops_url ORDER BY accessed_at DESC NULLS LAST,id LIMIT 1;
  IF cab_source IS NULL OR rops_source IS NULL THEN RAISE EXCEPTION 'Official brochure sources missing'; END IF;

  WITH wanted(model_code,canonical_key,spec_name,spec_value,unit,measurement_standard,evidence_text,comparison_class) AS (
    VALUES
    ('cab', 'engine_cylinders', 'Engine cylinders', '4', NULL, '4 cylinders; motor displacement in same sheet is internally inconsistent with its bore/stroke, and therefore excluded', 'ENGINE: Number of cylinders / cubic capacity, four cylinders', 'engine'),
    ('cab', 'transmission_type', 'Transmission type', 'ZF T-537', NULL, 'Manufacturer 804 Fruit Garden Cabin brochure; precise series/variant gearbox', 'TRANSMISSION: Type ZF T-537', 'drivetrain'),
    ('cab', 'transmission_gears', 'Transmission gears', '16 forward / 8 reverse', NULL, 'Manufacturer 804 Fruit Garden Cabin brochure; forward and reverse counts, not powershift claim', 'TRANSMISSION: Gears forwards/reverse, 16/8', 'drivetrain'),
    ('cab', 'pto_type', 'PTO type', 'Independent', NULL, 'Manufacturer brochure lists PTO as independent; no PTO clutch actuation extrapolation', 'PTO SHAFT: Type Independent', 'pto'),
    ('cab', 'rear_lift_capacity', 'Rear hitch lift capacity', '2800', 'kg', 'Manufacturer 804 Fruit Garden Cabin specification; lift measurement point not stated; not front-loader or ISO 24-inch rating', 'HYDRAULICS: Lift capacity 2800 kg', 'hydraulics'),
    ('cab', 'hydraulic_main_flow', 'Main hydraulic pump flow', '48.5', 'L/min', 'At manufacturer stated 2400 rpm; not an idle-flow rating or combined steering flow', 'HYDRAULICS: Pump capacity 48.5 L/min at 2400 rpm', 'hydraulics'),
    ('cab', 'wheelbase', 'Wheelbase', '2250', 'mm', 'Manufacturer brochure; axle and tyre configuration unspecified', 'DIMENSIONS: B-Wheelbase 2250 mm', 'dimensions_weights'),
    ('cab', 'overall_width', 'Overall width', '1680', 'mm', 'Manufacturer brochure; width for the illustrated/documented configuration, may vary with tyre/track', 'DIMENSIONS: E-Width 1680 mm', 'dimensions_weights'),
    ('cab', 'ground_clearance', 'Ground clearance', '285', 'mm', 'Manufacturer brochure; tyre/drive condition unspecified; not ground clearance with trailer', 'DIMENSIONS: F-Ground clearance 285 mm', 'dimensions_weights'),
    ('cab', 'operating_weight_cab', 'Weight with cab, without extra ballast', '3100', 'kg', 'Unballasted, Cab variant of 804 Fruit Garden; NOT ROPS; do not infer ISO operating weight', 'DIMENSIONS: Tractor weight [Unballast], Cab 3100 kg', 'dimensions_weights'),
    ('rops', 'engine_model', 'Engine model', 'Perkins 1104D-44T', NULL, 'Manufacturer brochure column 804.4 FG; parenthetical factory code not treated as a separate market trim', 'ENGINE: Model PERKINS / 1104D-44T', 'engine'),
    ('rops', 'engine_cylinders', 'Engine cylinders', '4', NULL, 'Manufacturer 804.4 FG ROPS brochure; explicit four cylinder count', 'ENGINE: Number of cylinders 4', 'engine'),
    ('rops', 'engine_displacement', 'Engine displacement', '4.4', 'L', 'Manufacturer 804.4 FG ROPS brochure; 4.4 L and 105 x 127 mm bore/stroke agree', 'ENGINE: Cubic capacity 4.4 liters', 'engine'),
    ('rops', 'transmission_type', 'Transmission type', 'ZF T-537', NULL, 'Manufacturer 804.4 FG ROPS brochure; ZF T-537, not a CRD5 model', 'TRANSMISSION: Type ZF T-537', 'drivetrain'),
    ('rops', 'transmission_gears', 'Transmission gears', '16 forward / 8 reverse', NULL, 'Manufacturer 804.4 FG ROPS brochure; actual 16F/8R gearing', 'TRANSMISSION: Gears forwards/reverse, 16/8', 'drivetrain'),
    ('rops', 'pto_type', 'PTO type', 'Independent', NULL, 'Manufacturer 804.4 FG ROPS brochure; excludes optional speed assumptions', 'PTO SHAFT: Type Independent', 'pto'),
    ('rops', 'rear_lift_capacity', 'Rear hitch lift capacity', '2800', 'kg', 'Manufacturer 804.4 FG ROPS; 3-point lift point not specified; not a front loader', 'HYDRAULICS: Lift capacity 2800 kg', 'hydraulics'),
    ('rops', 'hydraulic_main_flow', 'Main hydraulic pump flow', '48.5', 'L/min', 'At manufacturer stated 2400 rpm; not system capacity at other engine speeds', 'HYDRAULICS: Pump capacity 48.5 L/min at 2400 rpm', 'hydraulics'),
    ('rops', 'wheelbase', 'Wheelbase', '2250', 'mm', '804.4 FG column only; do not reuse 802.4 FG 2220 mm', 'DIMENSIONS: B-Wheelbase 2250 mm (804.4 FG column)', 'dimensions_weights'),
    ('rops', 'overall_width', 'Overall width', '1680', 'mm', '804.4 FG brochure; nominal width, tyre/track variations may alter', 'DIMENSIONS: E-Width 1680 mm (804.4 FG column)', 'dimensions_weights'),
    ('rops', 'ground_clearance', 'Ground clearance', '285', 'mm', '804.4 FG column only; 802.4 FG is a different clearance; not with trailer', 'DIMENSIONS: F-Ground clearance 285 mm (804.4 FG)', 'dimensions_weights'),
    ('rops', 'operating_weight', 'Weight without ballast (ROPS)', '2850', 'kg', 'Unballasted ROPS weight for 804.4 FG, NOT cabin version and not full-fuel operating mass', 'DIMENSIONS: Tractor Weight [Unballast] Rollbar 2850 kg (804.4 FG)', 'dimensions_weights')
  ), added AS (
    INSERT INTO public.tractor_specs(tractor_id,canonical_key,spec_name,spec_value,unit,
      source_id,verified_at,last_verified_at,source_priority,measurement_standard,evidence_text,comparison_class,managed_by_ai)
    SELECT CASE w.model_code WHEN 'cab' THEN cab ELSE rops END,w.canonical_key,w.spec_name,w.spec_value,w.unit,
      CASE w.model_code WHEN 'cab' THEN cab_source ELSE rops_source END,
      now(),now(),100, w.measurement_standard,
      'ArmaTrac 804 source-check 2026-11-23; '||w.evidence_text,w.comparison_class,false
    FROM wanted w RETURNING id
  )
  SELECT count(*) INTO created FROM added;
  IF created<>22 THEN RAISE EXCEPTION 'Unexpected inserted count: %, rolled back',created; END IF;
END
$batch$;