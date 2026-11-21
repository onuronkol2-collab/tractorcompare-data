-- Run before and after OEM review-only packet; returns counts, no private text.
SELECT t.status,count(*) target_tractors,count(c.id) candidates
FROM public.tractors t
JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractorvs_spec_review_candidates c ON c.tractor_id=t.id
WHERE (b.name,t.model_name) IN (
 ('Başak Traktör','5120'),('ArmaTrac','1104 Lux'),('Kubota','M6-141'),
 ('Antonio Carraro','TIGRE 3800 F'),('Antonio Carraro','MACH 2 R'),
 ('Sonalika','GT 22 4WD'))
GROUP BY t.status;
SELECT count(*) current_packet_inserted FROM tc_backup.row_snapshots s
JOIN tc_backup.maintenance_runs r ON r.run_id=s.run_id
WHERE r.migration_key='oem_source_review_batch_20261121_a'
AND s.object_name='public.tractorvs_spec_review_candidates_created'
AND r.status='completed';
