-- Belarus 920/920.2 exact-model OEM operating manual supplements, 2026-11-23.
-- Fail closed on any overlapping model-specific canonical key; no existing row/tractor changes.
-- Full manual: https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf
-- Original manual indexed as independent_catalog because published by the MTZ distributor.
DO $block$
DECLARE
  model920 constant uuid := '21e79b33-189b-44c1-a1e2-703ad8836d92';
  model9202 constant uuid := '1e1d7219-8921-44fe-83a6-c88514c1224a';
  manualSource constant uuid := '1ca19926-c9ca-4440-8b11-038a58921d43';
  overlaps integer;
  inserted_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('tractorvs-mtz-920-9202-spec-review-20261123',0));
  IF (SELECT count(*) FROM public.tractors t JOIN public.brands b ON b.id=t.brand_id
      WHERE b.name='Belarus' AND t.status='published'
      AND ((t.id=model920 AND t.model_name='920' AND t.variant ILIKE '%front axle 72%')
        OR (t.id=model9202 AND t.model_name='920.2' AND t.variant ILIKE '%front axle 822%'))) <> 2 THEN
    RAISE EXCEPTION 'Belarus 920/920.2 identities/status/variant no longer match reviewed source';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.data_sources
        WHERE id=manualSource AND source_url='https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf') THEN
    RAISE EXCEPTION 'Exact original manual data source is missing or modified';
  END IF;
  WITH wanted(model_code,canonical_key,spec_name,spec_value,unit,measurement_standard,evidence_text,comparison_class) AS (
    VALUES
-- MTZ_BELARUS_920_VALUES_BEGIN
    ('920', 'front_tire_size', 'Standard front tyre size', '13.6-20', NULL, 'Manufacturer manual main tyre; not all optional sizes; front/rear matched pairs required', 'Manual printed p.31 Wheels FRONT: MTZ-920/952 main fitment 13.6-20', 'dimensions_weights'),
    ('920', 'rear_tire_size', 'Standard rear tyre size', '16.9R38', NULL, 'Manufacturer manual main tyre only; not all markets or options; compatible 4WD pair must be checked', 'Manual printed p.31 Wheels REAR: MTZ-920/952 main fitment 16.9R38', 'dimensions_weights'),
    ('920', 'front_axle_reduction', 'Front drive axle reduction design', 'Portal; sliding bevel-reduction housings', NULL, 'Exact MTZ-920 model only: 920 sliding bevel vs 920.2 rigid planetary; no other front-axle variant extrapolation', 'Manual printed p.30 Front driving axle: 920/952 sliding bevel, 920.2/952.2/920.3/952.3 non-sliding bar planetary', 'drivetrain'),
    ('920', 'hydraulic_system_type', 'Hydraulic hitch architecture', 'Separate, independent hydraulic power cylinder', NULL, 'Exact MTZ-920 variant; not hydraulic pressure or lifting capacity', 'Manual printed p.30 Hydraulic system Type: MTZ-900/920 independent cylinder; MTZ-920.2/920.3 hydraulic lift with two self-contained cylinders', 'hydraulics'),
    ('920', 'pto_type', 'PTO drive configuration (independent and synchronous)', 'Independent two-speed + ground-speed synchronous', NULL, 'Manual describes two independent PTO speeds and wheel-travel synchronized mode; no exact 920.2 engine-rpm assumption', 'Manual printed p.30 PTO shaft drive Type: independent two-speed and synchronous', 'pto'),
    ('920', 'pto_shaft_splines', 'PTO shaft spline specification', '6 splines at 540 rpm / 21 splines at 1000 rpm', NULL, 'Manufacturer manual SAE coupler ends; two mutually distinct end types; not rear PTO power', 'Manual printed p.30 Removable PTO coupler shank SAE: 6 splines for 540 rpm; 21 splines for 1000 rpm', 'pto'),
    ('920', 'hydraulic_service_outlets', 'Hydraulic external outlet arrangement', '2 side + 1 rear; drain outlet optional', NULL, 'Manufacturer manual common 900-series arrangement; drain output explicitly optional', 'Manual printed p.30 Hydraulic system outlets: two side and one rear outlets (drain one optional)', 'hydraulics'),
    ('920', 'rear_hitch_category', 'Rear three-point linkage category', 'Category 2', NULL, 'Manufacturer manual rear mounted three-point attachment; not hitch-lift mass or front-loader capacity', 'Manual printed p.30 Rear mounted attachment: three-point mounted system category 2', 'hydraulics'),
    ('920', 'service_brakes', 'Service brake design (dry standard; oil-bath optional)', 'Rear-wheel dry 2/3-disc brakes; optional 8-disc oil-bath', NULL, 'Manual describes alternative wet discs as optional, NOT standard equipment; no variant year inferred', 'Manual printed p.30 Service brakes: dry two/three-disk rear wheel mechanical servo; eight disc oil bath optional', 'brakes'),
    ('920', 'manufacturer_engine_power_unspecified_standard', 'Manufacturer-stated engine power (test standard unspecified)', '59.6', 'kW', 'Manufacturer manual states 59.6 kW at 2200 rpm for D-243 / D-243S but no SAE/ISO test protocol. Do not populate headline HP or equate Kazakhstan dealer rounded 60 kW.', 'Manual printed p.6 model overview MTZ-920 and MTZ-920.2 both D-243/D-243S 59.6 kW / 2200 rpm', 'engine'),
    ('920.2', 'front_tire_size', 'Standard front tyre size', '360/70R24', NULL, 'Manufacturer manual main tyre; not all optional sizes; front/rear matched pairs required', 'Manual printed p.31 Wheels FRONT: MTZ-920.2/920.3/952.2/952.3 main fitment 360/70R24', 'dimensions_weights'),
    ('920.2', 'rear_tire_size', 'Standard rear tyre size', '18.4R34 (Φ-11)', NULL, 'Manufacturer manual main tyre only; not all markets or options; compatible 4WD pair must be checked', 'Manual printed p.31 Wheels REAR: MTZ-920.2/920.3/952.2/952.3 main fitment 18.4R34 (Φ-11)', 'dimensions_weights'),
    ('920.2', 'front_axle_reduction', 'Front drive axle reduction design', 'Portal; non-sliding bar with planetary wheel reduction', NULL, 'Exact MTZ-920.2 model only: 920 sliding bevel vs 920.2 rigid planetary; no other front-axle variant extrapolation', 'Manual printed p.30 Front driving axle: 920/952 sliding bevel, 920.2/952.2/920.3/952.3 non-sliding bar planetary', 'drivetrain'),
    ('920.2', 'hydraulic_system_type', 'Hydraulic hitch architecture', 'Hydraulic lift with two self-contained cylinders', NULL, 'Exact MTZ-920.2 variant; not hydraulic pressure or lifting capacity', 'Manual printed p.30 Hydraulic system Type: MTZ-900/920 independent cylinder; MTZ-920.2/920.3 hydraulic lift with two self-contained cylinders', 'hydraulics'),
    ('920.2', 'pto_type', 'PTO drive configuration (independent and synchronous)', 'Independent two-speed + ground-speed synchronous', NULL, 'Manual describes two independent PTO speeds and wheel-travel synchronized mode; no exact 920.2 engine-rpm assumption', 'Manual printed p.30 PTO shaft drive Type: independent two-speed and synchronous', 'pto'),
    ('920.2', 'pto_shaft_splines', 'PTO shaft spline specification', '6 splines at 540 rpm / 21 splines at 1000 rpm', NULL, 'Manufacturer manual SAE coupler ends; two mutually distinct end types; not rear PTO power', 'Manual printed p.30 Removable PTO coupler shank SAE: 6 splines for 540 rpm; 21 splines for 1000 rpm', 'pto'),
    ('920.2', 'hydraulic_service_outlets', 'Hydraulic external outlet arrangement', '2 side + 1 rear; drain outlet optional', NULL, 'Manufacturer manual common 900-series arrangement; drain output explicitly optional', 'Manual printed p.30 Hydraulic system outlets: two side and one rear outlets (drain one optional)', 'hydraulics'),
    ('920.2', 'rear_hitch_category', 'Rear three-point linkage category', 'Category 2', NULL, 'Manufacturer manual rear mounted three-point attachment; not hitch-lift mass or front-loader capacity', 'Manual printed p.30 Rear mounted attachment: three-point mounted system category 2', 'hydraulics'),
    ('920.2', 'service_brakes', 'Service brake design (dry standard; oil-bath optional)', 'Rear-wheel dry 2/3-disc brakes; optional 8-disc oil-bath', NULL, 'Manual describes alternative wet discs as optional, NOT standard equipment; no variant year inferred', 'Manual printed p.30 Service brakes: dry two/three-disk rear wheel mechanical servo; eight disc oil bath optional', 'brakes'),
    ('920.2', 'manufacturer_engine_power_unspecified_standard', 'Manufacturer-stated engine power (test standard unspecified)', '59.6', 'kW', 'Manufacturer manual states 59.6 kW at 2200 rpm for D-243 / D-243S but no SAE/ISO test protocol. Do not populate headline HP or equate Kazakhstan dealer rounded 60 kW.', 'Manual printed p.6 model overview MTZ-920 and MTZ-920.2 both D-243/D-243S 59.6 kW / 2200 rpm', 'engine')
-- MTZ_BELARUS_920_VALUES_END
  )
  SELECT count(*) INTO overlaps FROM wanted w JOIN public.tractor_specs s
    ON s.tractor_id=(CASE w.model_code WHEN '920' THEN model920 ELSE model9202 END)
    AND s.canonical_key=w.canonical_key;
  IF overlaps<>0 THEN RAISE EXCEPTION 'Detected % already present canonical keys, aborting all 20 inserts',overlaps; END IF;
  WITH wanted(model_code,canonical_key,spec_name,spec_value,unit,measurement_standard,evidence_text,comparison_class) AS (
    VALUES
-- MTZ_BELARUS_920_VALUES_BEGIN
    ('920', 'front_tire_size', 'Standard front tyre size', '13.6-20', NULL, 'Manufacturer manual main tyre; not all optional sizes; front/rear matched pairs required', 'Manual printed p.31 Wheels FRONT: MTZ-920/952 main fitment 13.6-20', 'dimensions_weights'),
    ('920', 'rear_tire_size', 'Standard rear tyre size', '16.9R38', NULL, 'Manufacturer manual main tyre only; not all markets or options; compatible 4WD pair must be checked', 'Manual printed p.31 Wheels REAR: MTZ-920/952 main fitment 16.9R38', 'dimensions_weights'),
    ('920', 'front_axle_reduction', 'Front drive axle reduction design', 'Portal; sliding bevel-reduction housings', NULL, 'Exact MTZ-920 model only: 920 sliding bevel vs 920.2 rigid planetary; no other front-axle variant extrapolation', 'Manual printed p.30 Front driving axle: 920/952 sliding bevel, 920.2/952.2/920.3/952.3 non-sliding bar planetary', 'drivetrain'),
    ('920', 'hydraulic_system_type', 'Hydraulic hitch architecture', 'Separate, independent hydraulic power cylinder', NULL, 'Exact MTZ-920 variant; not hydraulic pressure or lifting capacity', 'Manual printed p.30 Hydraulic system Type: MTZ-900/920 independent cylinder; MTZ-920.2/920.3 hydraulic lift with two self-contained cylinders', 'hydraulics'),
    ('920', 'pto_type', 'PTO drive configuration (independent and synchronous)', 'Independent two-speed + ground-speed synchronous', NULL, 'Manual describes two independent PTO speeds and wheel-travel synchronized mode; no exact 920.2 engine-rpm assumption', 'Manual printed p.30 PTO shaft drive Type: independent two-speed and synchronous', 'pto'),
    ('920', 'pto_shaft_splines', 'PTO shaft spline specification', '6 splines at 540 rpm / 21 splines at 1000 rpm', NULL, 'Manufacturer manual SAE coupler ends; two mutually distinct end types; not rear PTO power', 'Manual printed p.30 Removable PTO coupler shank SAE: 6 splines for 540 rpm; 21 splines for 1000 rpm', 'pto'),
    ('920', 'hydraulic_service_outlets', 'Hydraulic external outlet arrangement', '2 side + 1 rear; drain outlet optional', NULL, 'Manufacturer manual common 900-series arrangement; drain output explicitly optional', 'Manual printed p.30 Hydraulic system outlets: two side and one rear outlets (drain one optional)', 'hydraulics'),
    ('920', 'rear_hitch_category', 'Rear three-point linkage category', 'Category 2', NULL, 'Manufacturer manual rear mounted three-point attachment; not hitch-lift mass or front-loader capacity', 'Manual printed p.30 Rear mounted attachment: three-point mounted system category 2', 'hydraulics'),
    ('920', 'service_brakes', 'Service brake design (dry standard; oil-bath optional)', 'Rear-wheel dry 2/3-disc brakes; optional 8-disc oil-bath', NULL, 'Manual describes alternative wet discs as optional, NOT standard equipment; no variant year inferred', 'Manual printed p.30 Service brakes: dry two/three-disk rear wheel mechanical servo; eight disc oil bath optional', 'brakes'),
    ('920', 'manufacturer_engine_power_unspecified_standard', 'Manufacturer-stated engine power (test standard unspecified)', '59.6', 'kW', 'Manufacturer manual states 59.6 kW at 2200 rpm for D-243 / D-243S but no SAE/ISO test protocol. Do not populate headline HP or equate Kazakhstan dealer rounded 60 kW.', 'Manual printed p.6 model overview MTZ-920 and MTZ-920.2 both D-243/D-243S 59.6 kW / 2200 rpm', 'engine'),
    ('920.2', 'front_tire_size', 'Standard front tyre size', '360/70R24', NULL, 'Manufacturer manual main tyre; not all optional sizes; front/rear matched pairs required', 'Manual printed p.31 Wheels FRONT: MTZ-920.2/920.3/952.2/952.3 main fitment 360/70R24', 'dimensions_weights'),
    ('920.2', 'rear_tire_size', 'Standard rear tyre size', '18.4R34 (Φ-11)', NULL, 'Manufacturer manual main tyre only; not all markets or options; compatible 4WD pair must be checked', 'Manual printed p.31 Wheels REAR: MTZ-920.2/920.3/952.2/952.3 main fitment 18.4R34 (Φ-11)', 'dimensions_weights'),
    ('920.2', 'front_axle_reduction', 'Front drive axle reduction design', 'Portal; non-sliding bar with planetary wheel reduction', NULL, 'Exact MTZ-920.2 model only: 920 sliding bevel vs 920.2 rigid planetary; no other front-axle variant extrapolation', 'Manual printed p.30 Front driving axle: 920/952 sliding bevel, 920.2/952.2/920.3/952.3 non-sliding bar planetary', 'drivetrain'),
    ('920.2', 'hydraulic_system_type', 'Hydraulic hitch architecture', 'Hydraulic lift with two self-contained cylinders', NULL, 'Exact MTZ-920.2 variant; not hydraulic pressure or lifting capacity', 'Manual printed p.30 Hydraulic system Type: MTZ-900/920 independent cylinder; MTZ-920.2/920.3 hydraulic lift with two self-contained cylinders', 'hydraulics'),
    ('920.2', 'pto_type', 'PTO drive configuration (independent and synchronous)', 'Independent two-speed + ground-speed synchronous', NULL, 'Manual describes two independent PTO speeds and wheel-travel synchronized mode; no exact 920.2 engine-rpm assumption', 'Manual printed p.30 PTO shaft drive Type: independent two-speed and synchronous', 'pto'),
    ('920.2', 'pto_shaft_splines', 'PTO shaft spline specification', '6 splines at 540 rpm / 21 splines at 1000 rpm', NULL, 'Manufacturer manual SAE coupler ends; two mutually distinct end types; not rear PTO power', 'Manual printed p.30 Removable PTO coupler shank SAE: 6 splines for 540 rpm; 21 splines for 1000 rpm', 'pto'),
    ('920.2', 'hydraulic_service_outlets', 'Hydraulic external outlet arrangement', '2 side + 1 rear; drain outlet optional', NULL, 'Manufacturer manual common 900-series arrangement; drain output explicitly optional', 'Manual printed p.30 Hydraulic system outlets: two side and one rear outlets (drain one optional)', 'hydraulics'),
    ('920.2', 'rear_hitch_category', 'Rear three-point linkage category', 'Category 2', NULL, 'Manufacturer manual rear mounted three-point attachment; not hitch-lift mass or front-loader capacity', 'Manual printed p.30 Rear mounted attachment: three-point mounted system category 2', 'hydraulics'),
    ('920.2', 'service_brakes', 'Service brake design (dry standard; oil-bath optional)', 'Rear-wheel dry 2/3-disc brakes; optional 8-disc oil-bath', NULL, 'Manual describes alternative wet discs as optional, NOT standard equipment; no variant year inferred', 'Manual printed p.30 Service brakes: dry two/three-disk rear wheel mechanical servo; eight disc oil bath optional', 'brakes'),
    ('920.2', 'manufacturer_engine_power_unspecified_standard', 'Manufacturer-stated engine power (test standard unspecified)', '59.6', 'kW', 'Manufacturer manual states 59.6 kW at 2200 rpm for D-243 / D-243S but no SAE/ISO test protocol. Do not populate headline HP or equate Kazakhstan dealer rounded 60 kW.', 'Manual printed p.6 model overview MTZ-920 and MTZ-920.2 both D-243/D-243S 59.6 kW / 2200 rpm', 'engine')
-- MTZ_BELARUS_920_VALUES_END
  ), inserted AS (
    INSERT INTO public.tractor_specs(tractor_id,canonical_key,spec_name,spec_value,unit,source_id,
      source_priority,comparison_class,measurement_standard,evidence_text,verified_at,last_verified_at,managed_by_ai)
    SELECT CASE w.model_code WHEN '920' THEN model920 ELSE model9202 END,
      w.canonical_key,w.spec_name,w.spec_value,w.unit,manualSource,80,w.comparison_class,
      w.measurement_standard, 'MTZ 900 manual reviewed 2026-11-23: '||w.evidence_text,
      now(),now(),false FROM wanted w RETURNING id
  )
  SELECT count(*) INTO inserted_count FROM inserted;
  IF inserted_count<>20 THEN RAISE EXCEPTION 'Expected 20 new exact-variant rows; got %',inserted_count; END IF;
END
$block$;