# TractorCompare AI v21.42 — Spire S/V taxonomy normalization

## What the v21.41 audit found

The audit covered 146 findings across the exact F/S/V research runs:

- Spire F Target: 33/33 pending; no missing canonical keys; no `other` class findings.
- Spire S 80 Target: 56/56 pending; five missing canonical keys and five `other` class findings.
- Spire V 80 Target: 57/57 pending; five missing canonical keys and five `other` class findings.

All inspected findings had evidence text and page references. The F/S/V expected printed PDF pages were 5/6/7 respectively. No findings were linked to the wrong tractor, no unexpected findings were found, and the v21.41 audit reported `mutations_performed=false`.

## What this migration changes

This is a database taxonomy-only migration. It corrects exactly 18 existing pending findings:

1. Ten previously unmapped S/V findings:
   - `Injection system` / `Injection type` -> `fuel_injection_system` (`engine`)
   - `Max. power` -> `engine_max_power` (`engine`)
   - `With front tyre...` -> `front_tire_size` (`tires`)
   - `With rear tyre...` -> `rear_tire_size` (`tires`)
2. Four S/V rated-power findings:
   - `Power at rated engine speed`: `engine_rated_speed` -> `engine_rated_power` (`engine`)
3. Four S/V gear-count findings:
   - `Number of speeds - 5 gears transmission`: `transmission_type` -> `transmission_gear_configuration` (`transmission`)

The mechanical-shuttle vs powershuttle distinction stays in `measurement_standard`; the gear-count configuration becomes comparable across F/S/V.

## v21.42 alias compatibility correction

The first v21.42 draft omitted the v21.38 `Maximum traveling/travelling speed` aliases from its fallback chain. Its alias preflight correctly stopped the transaction before any finding rows changed. The SQL file now explicitly preserves US/UK spelling and the shorter `Max traveling/travelling speed` forms, with four regression checks. Use the updated SQL file currently in this branch; do not use an earlier copy.

## Safety

- The SQL begins a transaction and preflights all 18 exact IDs, tractor IDs, run IDs, model names, source URLs, spec names, values, units, page numbers, existing keys/classes, and pending review state.
- It aborts if any row differs from the v21.41 audit.
- It adds deterministic alias rules while retaining the v21.37 alias fallback chain.
- It verifies the new keys/classes and checks that both S/V runs remain fully pending.
- It does not approve findings, publish specifications, update `tractor_specs`, alter tractor catalog records, alter source documents, or change queue status.
- If an assertion fails, PostgreSQL rolls back the transaction instead of leaving a partial update.

## How to apply

1. Open `sql-v21.42-spire-sv-taxonomy-normalization.sql`.
2. Review it, then paste the entire file into Supabase SQL Editor and run it once.
3. The final query should show:
   - Spire S 80 Target: 56 findings, 56 pending, 0 missing canonical keys, 0 `other`.
   - Spire V 80 Target: 57 findings, 57 pending, 0 missing canonical keys, 0 `other`.

No Edge Function deployment is required for this taxonomy migration.

## Separate queue finalization

The v21.41 audit snapshot recorded the V queue as `retry` with its existing run ID even though the research run itself was completed and all 57 findings were saved. After its retry time is due, call the deployed Edge Function with:

```json
{
  "action": "process_queue_for_tractors",
  "tractor_ids": ["5139abf5-726b-4cc0-961a-e9f0277e0ead"]
}
```

The v21.40 `processQueue` implementation sees the existing `last_run_id` and polls it; it does not start a new Gemini run. On a completed result it should mark only this V queue row completed. Do not use the global `process_queue_batch` action for this step.

## Remaining human-review notes

- The catalog `tractors.horsepower` field is 80 for all three models, while the brochure lists maximum engine output as 76 HP and rated-speed output as 75 HP. Treat 80 as a model/class designation unless the catalog field's semantics are separately verified; do not present it as measured maximum engine power.
- The S run passed strict Gemini exact-name/token identity checks but did not record the deterministic PDF cross-reference metadata later added in v21.40. Its findings still reference the official PDF page 6 and remain pending.
- The S injection evidence is stored as the combined text `Common Rail @ 2000 bar`, while V has separate injection-type and injection-pressure findings. This should be checked during technical review; this migration intentionally does not invent an additional S finding or rewrite its evidence.
- Confidence 0.98 is the model-reported evidence-support score, not a calibrated probability.

