-- Restricted rollback: removes only untouched candidates inserted by batch.
-- Existing tractor specs were never changed and remain protected in snapshots.
BEGIN;
DO $rollback$
DECLARE v_run uuid; v_expected integer; v_removed integer;
BEGIN
 SELECT run_id INTO v_run FROM tc_backup.maintenance_runs
 WHERE migration_key='oem_source_review_batch_20261121_a' AND status='completed'
 ORDER BY started_at DESC LIMIT 1;
 IF v_run IS NULL THEN RAISE EXCEPTION 'No completed OEM review packet to roll back.'; END IF;
 SELECT count(*) INTO v_expected FROM tc_backup.row_snapshots
 WHERE run_id=v_run AND object_name='public.tractorvs_spec_review_candidates_created';
 IF EXISTS(
  SELECT 1 FROM tc_backup.row_snapshots s
  LEFT JOIN public.tractorvs_spec_review_candidates c ON c.id=s.row_id::uuid
  WHERE s.run_id=v_run AND s.object_name='public.tractorvs_spec_review_candidates_created'
    AND (c.id IS NULL OR c.review_status<>'needs_review' OR to_jsonb(c) IS DISTINCT FROM s.row_data)
 ) THEN
  RAISE EXCEPTION 'At least one review candidate was edited/reviewed; manual reconciliation required.';
 END IF;
 DELETE FROM public.tractorvs_spec_review_candidates c
 USING tc_backup.row_snapshots s
 WHERE s.run_id=v_run AND s.object_name='public.tractorvs_spec_review_candidates_created'
 AND c.id=s.row_id::uuid AND c.review_status='needs_review';
 GET DIAGNOSTICS v_removed=ROW_COUNT;
 IF v_removed<>v_expected THEN RAISE EXCEPTION 'Rollback mismatch, expected %, removed %',v_expected,v_removed; END IF;
 UPDATE tc_backup.maintenance_runs SET status='rolled_back',finished_at=now() WHERE run_id=v_run;
END
$rollback$;
COMMIT;
