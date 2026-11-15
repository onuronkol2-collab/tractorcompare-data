-- TractorCompare AI v21.34 — register official TYM T3035 (F36) Series 3 PDF and safely requeue the failed source-discovery attempt.
-- This does not change tractor specifications or approve/publish any finding.
-- Safe to re-run only while the queue still matches the guarded failed attempt.

BEGIN;

DO $$
DECLARE
    v_source_count INTEGER;
    v_source_updated INTEGER;
    v_queue tractor_research_queue%ROWTYPE;
    v_run ai_research_runs%ROWTYPE;
    v_rows INTEGER;
    v_source_url CONSTANT TEXT :=
        'https://tym-new.euwest01.umbraco.io/media/b01j3nc1/f36-produktbroschu-re.pdf';
    v_source_notes CONSTANT TEXT :=
        'Official TYM Series 3 F36 technical brochure for catalog model T3035 (F36). Official TYM model page https://www.tym.world/en/products/tractors/series-3/f36 identifies T3035 (F36), Series 3. This first-party TYM media PDF labels F36 / Series 3 and T3035 (F36). Target is the non-Cab F36 configuration, not T3035 (F36C). Transmission configurations F36RN (Synchro-shuttle) and F36HN (HST) are separate variants within F36 and must remain separately scoped. Official first-party TYM media host.';
BEGIN
    -- Confirm exact target queue state after the HTTP 422 source-discovery failure.
    SELECT *
    INTO v_queue
    FROM tractor_research_queue
    WHERE id = '81670dc7-a675-4d17-b1bb-e9aaadc1534c'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'T3035 F36 queue row not found.';
    END IF;

    IF v_queue.tractor_id <> '6f214ac1-0415-4433-98c9-5307aed48d9c'
       OR v_queue.status <> 'needs_source'
       OR v_queue.attempt_count <> 1
       OR v_queue.max_attempts <> 30
       OR v_queue.last_run_id IS DISTINCT FROM 'f9982e9c-374d-4483-ab2c-cb360b483f56'::uuid
    THEN
        RAISE EXCEPTION 'T3035 queue state differs from expected 422 attempt. No changes made.';
    END IF;

    SELECT *
    INTO v_run
    FROM ai_research_runs
    WHERE id = 'f9982e9c-374d-4483-ab2c-cb360b483f56';

    IF NOT FOUND
       OR v_run.status <> 'failed'
       OR v_run.requested_model <> 'T3035'
       OR v_run.requested_variant <> 'F36 / Series 3'
    THEN
        RAISE EXCEPTION 'Failed T3035 F36 source-discovery run could not be verified. No changes made.';
    END IF;

    -- The URL must not already be associated with a different publisher.
    IF EXISTS (
        SELECT 1
        FROM data_sources
        WHERE source_url = v_source_url
          AND lower(publisher) <> 'tym'
    ) THEN
        RAISE EXCEPTION 'The official PDF URL is already registered under a different publisher.';
    END IF;

    SELECT COUNT(*)::INTEGER
    INTO v_source_count
    FROM data_sources
    WHERE source_url = v_source_url
      AND lower(publisher) = 'tym';

    IF v_source_count > 1 THEN
        RAISE EXCEPTION 'Multiple TYM rows already exist for the exact PDF URL. Manual reconciliation required.';
    END IF;

    IF v_source_count = 1 THEN
        UPDATE data_sources
        SET
            publisher = 'TYM',
            source_type = 'official_technical_pdf',
            accessed_at = NOW(),
            notes = v_source_notes,
            source_priority = 100
        WHERE source_url = v_source_url
          AND lower(publisher) = 'tym';

        GET DIAGNOSTICS v_source_updated = ROW_COUNT;
        IF v_source_updated <> 1 THEN
            RAISE EXCEPTION 'Existing official TYM PDF source could not be refreshed.';
        END IF;
    ELSE
        INSERT INTO data_sources (
            publisher,
            source_url,
            source_type,
            accessed_at,
            notes,
            source_priority
        )
        VALUES (
            'TYM',
            v_source_url,
            'official_technical_pdf',
            NOW(),
            v_source_notes,
            100
        );
    END IF;

    -- Requeue only the one failed T3035 F36 source-discovery attempt.
    -- Preserve attempt_count=1 and every prior research/run record.
    UPDATE tractor_research_queue
    SET
        status = 'queued',
        last_run_id = NULL,
        next_attempt_at = NOW(),
        last_error = 'Official TYM T3035 (F36) Series 3 technical PDF registered; retry with v21.34 direct-PDF source path.',
        completed_at = NULL,
        updated_at = NOW()
    WHERE id = '81670dc7-a675-4d17-b1bb-e9aaadc1534c'
      AND tractor_id = '6f214ac1-0415-4433-98c9-5307aed48d9c'
      AND status = 'needs_source'
      AND attempt_count = 1
      AND last_run_id = 'f9982e9c-374d-4483-ab2c-cb360b483f56';

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN
        RAISE EXCEPTION 'T3035 queue requeue did not update exactly one row.';
    END IF;
END;
$$;

COMMIT;

-- Confirm the registered first-party PDF and the one requeued tractor.
SELECT
    ds.publisher,
    ds.source_url,
    ds.source_type,
    ds.source_priority,
    ds.notes,
    q.id AS queue_id,
    q.status AS queue_status,
    q.attempt_count,
    q.max_attempts,
    q.last_run_id,
    q.next_attempt_at
FROM data_sources ds
CROSS JOIN tractor_research_queue q
WHERE ds.source_url = 'https://tym-new.euwest01.umbraco.io/media/b01j3nc1/f36-produktbroschu-re.pdf'
  AND lower(ds.publisher) = 'tym'
  AND q.id = '81670dc7-a675-4d17-b1bb-e9aaadc1534c';
