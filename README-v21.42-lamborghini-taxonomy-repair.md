# TractorCompare AI v21.42 — Lamborghini Spire S/V taxonomy repair

## Audit basis
- Read-only audit file: `sqlyeni.txt`, audit version 21.41, generated 2026-11-15.
- Edge Function base: `tractor-ai-v21-40-lamborghini-pdf-identity`.
- Official manufacturer PDF: `https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7988_b274e15de8fa324d508dde300f1d3fc8`.
- Exact technical tables: Spire S 80 Target = printed page 6; Spire V 80 Target = printed page 7.

## Edge Function changes
- `Max. power` maps to existing `engine_max_power`.
- `With front tyre` / `With front tyre Size` and rear equivalents map to the existing front/rear tire keys.
- `Power at rated engine speed` maps to `engine_rated_power`, not `engine_rated_speed`.
- `Number of speeds - 5 gears transmission` maps to `transmission_gear_configuration`, not `transmission_type`.
- `Injection type` / `Injection system` map to existing `engine_fuel_system`.
- A combined `Injection system = Common Rail @ 2000 bar` cell is split into two pending, independent findings.
- Existing exact-ID queue targeting and curated official PDF identity checks are retained.
- Automatic approval remains disabled.

## SQL migration scope
- Repairs 18 exact audited pending findings: 9 for Spire S and 9 for Spire V.
- Adds one new pending S finding by splitting the combined injection/system-pressure cell.
- Corrects 10 missing canonical keys and 8 semantically incorrect canonical keys.
- F Target is not modified.
- Source URL, evidence, printed PDF page, ECE R120 label, configuration notes, run IDs, and pending review status are retained.
- No findings are approved, written to `tractor_specs`, or published.

The migration checks the exact finding IDs, run IDs, tractor IDs, old names/values/units, page numbers, old keys/classes, pending status, and null `inserted_spec_id`. It rolls back unless exactly 18 audited rows are normalized and the additional S fuel-system finding is inserted and verified.

## Execution
1. Review and deploy `index-v21.42.ts` to the existing Supabase Edge Function.
2. Run `sql-v21.42-lamborghini-spire-sv-taxonomy-repair.sql` in Supabase SQL Editor.
3. Inspect all three read-only outputs at the end of the SQL file. Expected: repaired findings remain pending; no null keys or `other` classes among the 18 targeted rows; V queue diagnostic may still show `retry` until synchronized.
4. Synchronize only the V queue row using the current exact-ID action:

```json
{
  "action": "process_queue_for_tractors",
  "tractor_ids": ["5139abf5-726b-4cc0-961a-e9f0277e0ead"]
}
```

The existing v21.40 exact-ID queue path will claim only V's queue row. As `last_run_id` is already the completed run, it polls that existing run and marks the queue completed; it does not start a new Gemini research run. Do not call `start` and do not use `process_queue_batch` for this synchronization.

## Rollback
If and only if the v21.42 migration completed successfully and must be reverted, use `rollback-v21.42-lamborghini-spire-sv-taxonomy-repair.sql`. It checks the exact v21.42 post-state, restores the 18 original finding rows and S run metadata, and deletes only the single pending Common Rail split row created by this migration. It aborts if the records have since been edited or reviewed. Do not run the rollback as part of normal deployment.

## Notes
- Audit results show every S/V finding has a value, evidence, and the expected printed PDF page.
- S identity passed strict Gemini exact-name/token validation. V passed strict validation plus deterministic official PDF page-7 identity.
- Catalog `horsepower = 80` is intentionally unchanged. Its intended meaning (model designation vs measured maximum/rated output) must be decided before publication.
- Confidence 0.98 is an LLM-reported support score, not a calibrated probability.
- Creating these GitHub files does not deploy the Edge Function or run the Supabase SQL.
