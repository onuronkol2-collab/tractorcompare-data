-- Private, source-specific OEM evidence REVIEW packet only. No publication.
-- All 6 target models remain drafts. Nothing is written to tractor_specs.
-- Observed 2026-11-21 from official manufacturer live HTML; variant/year checks remain pending.
-- Rollback: supabase/rollback/20261121_oem_source_review_batch_rollback.sql
BEGIN;
DO $batch$
DECLARE
 v_run uuid := gen_random_uuid();
 v_existing integer;
 v_conflicts integer;
 v_staged integer;
 v_key constant text := 'oem_source_review_batch_20261121_a';
BEGIN
 IF EXISTS(SELECT 1 FROM tc_backup.maintenance_runs WHERE migration_key=v_key AND status='completed') THEN
  RAISE EXCEPTION 'This exact OEM review packet has already been applied; no replay.';
 END IF;
 IF NOT (SELECT bool_and(c.relrowsecurity) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('tractorvs_spec_review_candidates','tractor_specs','tractors','data_sources')) THEN
  RAISE EXCEPTION 'Required RLS configuration missing; stop.';
 END IF;
 IF has_table_privilege('anon','public.tractorvs_spec_review_candidates','SELECT')
 OR has_table_privilege('authenticated','public.tractorvs_spec_review_candidates','SELECT') THEN
  RAISE EXCEPTION 'Private review candidates unexpectedly visible to visitors; stop.';
 END IF;
 WITH evidence(brand,model_name,variant,market,canonical_key,spec_value,unit,source_url,source_publisher,evidence_text,comparison_class,measurement_standard) AS (
 VALUES
  ('Başak Traktör','5120',NULL,'global','adblue_tank_capacity','20','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Fuel / AdBlue tanks 200 / 20 L','capacities',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_aspiration','Turbo Intercooler','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Aspirasyon: Turbo - Intercooler','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_cylinders','4','adet','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Silindir hacmi / silindir sayısı: 3621 cm3 / 4 adet','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_displacement','3.621','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Motor silindir hacmi 3621 cm3 (equals 3.621 L)','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_emission_standard','EU Stage V','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Emisyon Tipi: EU STAGE V','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_max_power','122','hp','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami Motor Gücü ISO 14396: 90 kW / 122 hp at 2000 rpm','engine','ISO 14396'),
  ('Başak Traktör','5120',NULL,'global','engine_model','Deutz TCD 3.6','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Motor Tipi: Deutz TCD 3.6','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_torque','480','Nm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami motor torku 480 Nm at 1600 rpm','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_torque_rpm','1600','rpm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami motor torku 480 Nm / 1600 rpm','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','fuel_tank_capacity','200','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Fuel / AdBlue tanks 200 / 20 L','capacities',NULL),
  ('Başak Traktör','5120',NULL,'global','hydraulic_lift_capacity','5500','kg','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Hidrolik Maksimum Kaldırma Kapasitesi: 5.500 kg','hydraulics',NULL),
  ('Başak Traktör','5120',NULL,'global','pto_speeds','540/540E/1000/1000E','rpm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Kuyruk mili seçenekleri: 540 / 540E / 1000 / 1000E','pto',NULL),
  ('Başak Traktör','5120',NULL,'global','transmission_description','32F/32R Semi-Powershift','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Vites kutusu: 32 + 32 yarı otomatik; Power Shift standard','transmission',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','air_conditioning','Standard',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Air Conditioning: Standard','comfort',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_emission_standard','Stage 3A',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Emission Level: Stage 3A','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_make','Perkins',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Engine Type: Perkins','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_power','110','hp','https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Horse Power: 110 HP; power test standard not stated','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_torque','416','Nm','https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Torque: 416 Nm','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_displacement','6.124','L','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','Kubota M6-141 Utility engine: 6,124 cm3, i.e. 6.124 L','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_model','Kubota V6108-TIE5','','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','Model M6-141 Utility engine: Kubota V6108-TIE5','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_rated_power','143.4','hp','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility product power 143.4 hp (105.5 kW); rated test standard not stated','engine',NULL),
  ('Kubota','M6-141',NULL,'global','hydraulic_lift_capacity','6100','kg','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility three-point lift alternative 5000 kg or 6100 kg; option must be identified','hydraulics',NULL),
  ('Kubota','M6-141',NULL,'global','transmission_description','24F/24R Intelli-Shift','','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility has 24 forward / 24 reverse Intelli-Shift gears; creeper optionally 32/32','transmission',NULL)
)
 SELECT count(*) INTO v_existing FROM evidence e
 JOIN public.brands b ON b.name=e.brand
 JOIN public.tractors t ON t.brand_id=b.id AND t.model_name=e.model_name
   AND t.variant IS NOT DISTINCT FROM e.variant AND t.market=e.market
   AND t.model_year IS NULL AND t.status='draft'
 JOIN public.tractor_specs s ON s.tractor_id=t.id AND s.canonical_key=e.canonical_key
   AND s.spec_value=e.spec_value AND s.unit IS NOT DISTINCT FROM e.unit
 JOIN public.data_sources d ON d.id=s.source_id AND d.source_url=e.source_url;
 IF v_existing<>23 THEN
  RAISE EXCEPTION 'OEM source matched % expected 23 exact existing draft specs; stop.',v_existing;
 END IF;
 WITH conflicts(brand,model_name,variant,market,canonical_key,spec_value,unit,source_url,source_publisher,evidence_text,comparison_class,measurement_standard,review_note) AS (
 VALUES
  ('Antonio Carraro','TIGRE 3800 F','Catalog listing - review','global','engine_displacement_cc','1642','cc','https://www.antoniocarraro.it/en/catalogue/tigre-3800-f','Antonio Carraro','English TIGRE 3800 F manufacturer tab: Yanmar three cylinders, 1642 cc Stage 5','engine',NULL,'CONFLICT: Italian official TIGRE 3800 F shows 1331 cc; English model tab shows 1642 cc; hold for dated engine/market/version evidence.'),
  ('Antonio Carraro','MACH 2 R','Catalog listing - review','global','engine_power_unqualified','98','hp','https://www.antoniocarraro.it/en/catalogue/mach-2-r','Antonio Carraro','MACH 2 R manufacturer narrative claims a 98 hp Kubota engine; 8900 R technical tab lists 74.2 hp','engine',NULL,'CONFLICT: 98 hp overview versus 74.2 hp 8900 R technical tab; do not infer rated value or model version.'),
  ('Sonalika','GT 22 4WD','Catalog listing - review','global','drivetrain','2WD',NULL,'https://www.sonalika.com/tractor/gt-22-4wd','Sonalika','Sonalika GT 22 4WD product heading and 4 Wheel Drive features conflict with variant table labelled 2WD','drivetrain',NULL,'CONFLICT: 2WD variant-table label under GT 22 4WD page; do not claim actual drivetrain until manufacturer clarifies.')
)
 SELECT count(*) INTO v_conflicts FROM conflicts c
 JOIN public.brands b ON b.name=c.brand
 JOIN public.tractors t ON t.brand_id=b.id AND t.model_name=c.model_name
 AND t.variant IS NOT DISTINCT FROM c.variant AND t.market=c.market
 AND t.model_year IS NULL AND t.status='draft'
 WHERE EXISTS(SELECT 1 FROM public.data_sources d
 JOIN public.tractor_specs s ON s.source_id=d.id AND s.tractor_id=t.id
 WHERE d.source_url=c.source_url);
 IF v_conflicts<>3 THEN
  RAISE EXCEPTION 'OEM conflict identities matched % expected 3 private draft sources; stop.',v_conflicts;
 END IF;
 INSERT INTO tc_backup.maintenance_runs(run_id,migration_key,status,description)
 VALUES(v_run,v_key,'running','2026-11-21 OEM source fact review: existing specs and independently conflicting producer pages');

 WITH evidence(brand,model_name,variant,market,canonical_key,spec_value,unit,source_url,source_publisher,evidence_text,comparison_class,measurement_standard) AS (
 VALUES
  ('Başak Traktör','5120',NULL,'global','adblue_tank_capacity','20','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Fuel / AdBlue tanks 200 / 20 L','capacities',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_aspiration','Turbo Intercooler','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Aspirasyon: Turbo - Intercooler','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_cylinders','4','adet','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Silindir hacmi / silindir sayısı: 3621 cm3 / 4 adet','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_displacement','3.621','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Motor silindir hacmi 3621 cm3 (equals 3.621 L)','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_emission_standard','EU Stage V','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Emisyon Tipi: EU STAGE V','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_max_power','122','hp','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami Motor Gücü ISO 14396: 90 kW / 122 hp at 2000 rpm','engine','ISO 14396'),
  ('Başak Traktör','5120',NULL,'global','engine_model','Deutz TCD 3.6','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Motor Tipi: Deutz TCD 3.6','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_torque','480','Nm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami motor torku 480 Nm at 1600 rpm','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_torque_rpm','1600','rpm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami motor torku 480 Nm / 1600 rpm','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','fuel_tank_capacity','200','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Fuel / AdBlue tanks 200 / 20 L','capacities',NULL),
  ('Başak Traktör','5120',NULL,'global','hydraulic_lift_capacity','5500','kg','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Hidrolik Maksimum Kaldırma Kapasitesi: 5.500 kg','hydraulics',NULL),
  ('Başak Traktör','5120',NULL,'global','pto_speeds','540/540E/1000/1000E','rpm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Kuyruk mili seçenekleri: 540 / 540E / 1000 / 1000E','pto',NULL),
  ('Başak Traktör','5120',NULL,'global','transmission_description','32F/32R Semi-Powershift','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Vites kutusu: 32 + 32 yarı otomatik; Power Shift standard','transmission',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','air_conditioning','Standard',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Air Conditioning: Standard','comfort',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_emission_standard','Stage 3A',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Emission Level: Stage 3A','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_make','Perkins',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Engine Type: Perkins','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_power','110','hp','https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Horse Power: 110 HP; power test standard not stated','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_torque','416','Nm','https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Torque: 416 Nm','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_displacement','6.124','L','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','Kubota M6-141 Utility engine: 6,124 cm3, i.e. 6.124 L','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_model','Kubota V6108-TIE5','','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','Model M6-141 Utility engine: Kubota V6108-TIE5','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_rated_power','143.4','hp','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility product power 143.4 hp (105.5 kW); rated test standard not stated','engine',NULL),
  ('Kubota','M6-141',NULL,'global','hydraulic_lift_capacity','6100','kg','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility three-point lift alternative 5000 kg or 6100 kg; option must be identified','hydraulics',NULL),
  ('Kubota','M6-141',NULL,'global','transmission_description','24F/24R Intelli-Shift','','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility has 24 forward / 24 reverse Intelli-Shift gears; creeper optionally 32/32','transmission',NULL)
)
 INSERT INTO tc_backup.row_snapshots(run_id,object_name,row_id,row_data)
 SELECT v_run,'public.tractor_specs_read_only_source_baseline',s.id::text,to_jsonb(s)
 FROM evidence e
 JOIN public.brands b ON b.name=e.brand
 JOIN public.tractors t ON t.brand_id=b.id AND t.model_name=e.model_name
   AND t.variant IS NOT DISTINCT FROM e.variant AND t.market=e.market
   AND t.model_year IS NULL AND t.status='draft'
 JOIN public.tractor_specs s ON s.tractor_id=t.id AND s.canonical_key=e.canonical_key
   AND s.spec_value=e.spec_value AND s.unit IS NOT DISTINCT FROM e.unit
 JOIN public.data_sources d ON d.id=s.source_id AND d.source_url=e.source_url;

 WITH evidence(brand,model_name,variant,market,canonical_key,spec_value,unit,source_url,source_publisher,evidence_text,comparison_class,measurement_standard) AS (
 VALUES
  ('Başak Traktör','5120',NULL,'global','adblue_tank_capacity','20','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Fuel / AdBlue tanks 200 / 20 L','capacities',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_aspiration','Turbo Intercooler','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Aspirasyon: Turbo - Intercooler','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_cylinders','4','adet','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Silindir hacmi / silindir sayısı: 3621 cm3 / 4 adet','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_displacement','3.621','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Motor silindir hacmi 3621 cm3 (equals 3.621 L)','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_emission_standard','EU Stage V','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Emisyon Tipi: EU STAGE V','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_max_power','122','hp','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami Motor Gücü ISO 14396: 90 kW / 122 hp at 2000 rpm','engine','ISO 14396'),
  ('Başak Traktör','5120',NULL,'global','engine_model','Deutz TCD 3.6','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Motor Tipi: Deutz TCD 3.6','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_torque','480','Nm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami motor torku 480 Nm at 1600 rpm','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','engine_torque_rpm','1600','rpm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Azami motor torku 480 Nm / 1600 rpm','engine',NULL),
  ('Başak Traktör','5120',NULL,'global','fuel_tank_capacity','200','L','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Fuel / AdBlue tanks 200 / 20 L','capacities',NULL),
  ('Başak Traktör','5120',NULL,'global','hydraulic_lift_capacity','5500','kg','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Hidrolik Maksimum Kaldırma Kapasitesi: 5.500 kg','hydraulics',NULL),
  ('Başak Traktör','5120',NULL,'global','pto_speeds','540/540E/1000/1000E','rpm','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Kuyruk mili seçenekleri: 540 / 540E / 1000 / 1000E','pto',NULL),
  ('Başak Traktör','5120',NULL,'global','transmission_description','32F/32R Semi-Powershift','','https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power','BAŞAK Traktör','Vites kutusu: 32 + 32 yarı otomatik; Power Shift standard','transmission',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','air_conditioning','Standard',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Air Conditioning: Standard','comfort',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_emission_standard','Stage 3A',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Emission Level: Stage 3A','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_make','Perkins',NULL,'https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Engine Type: Perkins','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_power','110','hp','https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Horse Power: 110 HP; power test standard not stated','engine',NULL),
  ('ArmaTrac','1104 Lux','Catalog listing - review','global','engine_torque','416','Nm','https://armatrac.com/tractor/290/1104-lux','ArmaTrac','Torque: 416 Nm','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_displacement','6.124','L','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','Kubota M6-141 Utility engine: 6,124 cm3, i.e. 6.124 L','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_model','Kubota V6108-TIE5','','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','Model M6-141 Utility engine: Kubota V6108-TIE5','engine',NULL),
  ('Kubota','M6-141',NULL,'global','engine_rated_power','143.4','hp','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility product power 143.4 hp (105.5 kW); rated test standard not stated','engine',NULL),
  ('Kubota','M6-141',NULL,'global','hydraulic_lift_capacity','6100','kg','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility three-point lift alternative 5000 kg or 6100 kg; option must be identified','hydraulics',NULL),
  ('Kubota','M6-141',NULL,'global','transmission_description','24F/24R Intelli-Shift','','https://ktt.kubota-eu.com/agriculture/products/m6-141-utility/','Kubota','M6-141 Utility has 24 forward / 24 reverse Intelli-Shift gears; creeper optionally 32/32','transmission',NULL)
), conflicts(brand,model_name,variant,market,canonical_key,spec_value,unit,source_url,source_publisher,evidence_text,comparison_class,measurement_standard,review_note) AS (
 VALUES
  ('Antonio Carraro','TIGRE 3800 F','Catalog listing - review','global','engine_displacement_cc','1642','cc','https://www.antoniocarraro.it/en/catalogue/tigre-3800-f','Antonio Carraro','English TIGRE 3800 F manufacturer tab: Yanmar three cylinders, 1642 cc Stage 5','engine',NULL,'CONFLICT: Italian official TIGRE 3800 F shows 1331 cc; English model tab shows 1642 cc; hold for dated engine/market/version evidence.'),
  ('Antonio Carraro','MACH 2 R','Catalog listing - review','global','engine_power_unqualified','98','hp','https://www.antoniocarraro.it/en/catalogue/mach-2-r','Antonio Carraro','MACH 2 R manufacturer narrative claims a 98 hp Kubota engine; 8900 R technical tab lists 74.2 hp','engine',NULL,'CONFLICT: 98 hp overview versus 74.2 hp 8900 R technical tab; do not infer rated value or model version.'),
  ('Sonalika','GT 22 4WD','Catalog listing - review','global','drivetrain','2WD',NULL,'https://www.sonalika.com/tractor/gt-22-4wd','Sonalika','Sonalika GT 22 4WD product heading and 4 Wheel Drive features conflict with variant table labelled 2WD','drivetrain',NULL,'CONFLICT: 2WD variant-table label under GT 22 4WD page; do not claim actual drivetrain until manufacturer clarifies.')
),
 matched AS (
 SELECT t.id tractor_id, e.canonical_key,e.canonical_key AS spec_name,e.spec_value,e.unit,
 e.comparison_class,e.measurement_standard,e.source_url,e.source_publisher,e.evidence_text,
 ('EXISTING PRIVATE DRAFT SPEC; matched manufacturer HTML 2026-11-21. Identity year / market / variant still unproven; editorial review only. ' ||
 CASE WHEN e.canonical_key='engine_rated_power' THEN 'Power standard is NOT proven.'
 WHEN e.canonical_key='hydraulic_lift_capacity' AND e.brand='Kubota' THEN 'Model shows optional 5000/6100 kg; exact equipment not proven.'
 WHEN e.canonical_key='engine_max_power' THEN 'OEM labels ISO 14396, 2000 rpm; exact model edition must be checked.'
 ELSE 'No automatic verification or publication.' END) review_note
 FROM evidence e
 JOIN public.brands b ON b.name=e.brand
 JOIN public.tractors t ON t.brand_id=b.id AND t.model_name=e.model_name
   AND t.variant IS NOT DISTINCT FROM e.variant AND t.market=e.market
   AND t.model_year IS NULL AND t.status='draft'
 JOIN public.tractor_specs s ON s.tractor_id=t.id AND s.canonical_key=e.canonical_key
   AND s.spec_value=e.spec_value AND s.unit IS NOT DISTINCT FROM e.unit
 JOIN public.data_sources d ON d.id=s.source_id AND d.source_url=e.source_url
 UNION ALL
 SELECT t.id,c.canonical_key,c.canonical_key,c.spec_value,c.unit,c.comparison_class,c.measurement_standard,
 c.source_url,c.source_publisher,c.evidence_text,c.review_note
 FROM conflicts c
 JOIN public.brands b ON b.name=c.brand
 JOIN public.tractors t ON t.brand_id=b.id AND t.model_name=c.model_name
 AND t.variant IS NOT DISTINCT FROM c.variant AND t.market=c.market
 AND t.model_year IS NULL AND t.status='draft'
 WHERE EXISTS(SELECT 1 FROM public.data_sources d
 JOIN public.tractor_specs s ON s.source_id=d.id AND s.tractor_id=t.id
 WHERE d.source_url=c.source_url)
 ), added AS(
 INSERT INTO public.tractorvs_spec_review_candidates
 (tractor_id,canonical_key,spec_name,spec_value,unit,comparison_class,measurement_standard,
 source_url,source_publisher,source_tier,evidence_text,observed_at,review_status,review_note)
 SELECT tractor_id,canonical_key,spec_name,spec_value,unit,comparison_class,measurement_standard,
 source_url,source_publisher,'manufacturer',evidence_text,DATE '2026-11-21','needs_review',review_note
 FROM matched
 ON CONFLICT(tractor_id,canonical_key,spec_value,source_url) DO NOTHING
 RETURNING *
 )
 INSERT INTO tc_backup.row_snapshots(run_id,object_name,row_id,row_data)
 SELECT v_run,'public.tractorvs_spec_review_candidates_created',id::text,to_jsonb(added) FROM added;
 GET DIAGNOSTICS v_staged = ROW_COUNT;
 UPDATE tc_backup.maintenance_runs SET status='completed',finished_at=now(),
 description=format('Private OEM review packet, %s exact existing spec source matches, %s conflicting OEM claims, %s newly staged records, no publication',v_existing,v_conflicts,v_staged)
 WHERE run_id=v_run;
END
$batch$;
COMMIT;
