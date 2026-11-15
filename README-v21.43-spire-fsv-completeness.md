# TractorCompare AI v21.43 — Lamborghini Spire F/S/V completeness

## Why this migration exists

The official F/S/V technical tables are not fully represented by the first AI extraction:

- F Target had 33 pending findings while page 5 contains the same broader equipment/options section represented in the S/V extractions.
- S Target had 56 pending findings; its injection evidence was saved as one combined value, `Common Rail @ 2000 bar`, rather than separate injection type and injection pressure.
- V Target had 57 pending findings and already contained the two separate injection fields.

The official manufacturer source pages used for the audit are:

- Spire F 80 Target: official PDF 7987, printed page 5.
- Spire S 80 Target: official PDF 7988, printed page 6.
- Spire V 80 Target: official PDF 7988, printed page 7.

The 8-page F/S/V brochure describes the engine family as 76 HP maximum output and the technical tables distinguish 55.8 kW / 76 HP maximum power from 55.2 kW / 75 HP at rated engine speed. The tables also specify 341 Nm at 1500 rpm. The catalog's `horsepower=80` field is left untouched because 80 is the model/class designation, not the measured maximum engine output.

## What it does

### Adds 24 findings to F Target

The 24 new F page-5 findings include Common Rail injection type and the equipment/options absent from its initial 33-finding extraction:

- Four-wheel braking and hydraulic trailer brake.
- Independent front suspended axle features, anti-dive/anti-roll, and differential traction control, with the optional package scope preserved.
- Work lights, front lift capacity (1500 kg, optional), hydraulic flow regulator, rear free return, hydraulic stabilizers, mid-mounted free return and 2/4 mid-mounted hydraulic ways (optional).
- Mechanical rear lift (standard) and electronic rear lift (optional).
- Air conditioning (optional), four-post cab (standard), and driver seat pneumatic suspension (standard on F).
- Front PTO speed (1000 rpm, optional), groundspeed PTO (optional), Auto 4WD (optional), electrohydraulic 4WD/differential lock (standard), adjustable steering column (standard), and independent steering pump (standard).

### Normalizes S and V

- Splits S's combined `Common Rail @ 2000 bar` finding into `Injection type = Common Rail` and a new `Engine injection pressure = 2000 bar` finding.
- Changes S/V front-lift availability-only values to the actual `1500 kg` optional capacity.
- Changes S/V front PTO availability-only values to the actual `1000 rpm` optional speed.
- Labels the 2/4 mid-mounted hydraulic ways as optional.
- Preserves that the S/V independent suspended axle package is optional while its listed subfeatures are marked standard within the package.
- Normalizes all six 40 ECO speed values and stores the PDF asterisk text as a comparison note: engine rpm at maximum speed varies according to rear tyre size.

### Expected result

Each exact model run should contain 57 findings, all pending:

| Model | Findings | Pending | Missing canonical keys | Other class |
|---|---:|---:|---:|---:|
| Spire F Target | 57 | 57 | 0 | 0 |
| Spire S 80 Target | 57 | 57 | 0 | 0 |
| Spire V 80 Target | 57 | 57 | 0 | 0 |
| **Total** | **171** | **171** | **0** | **0** |

The SQL updates the F and S research-run result metadata to reflect the manually normalized totals. It does not re-run Gemini.

## Safety controls

- One transaction with exact preflight checks for run IDs, tractor IDs, model names, draft status, 80 catalog designation, queue IDs/status, prior finding totals, pending statuses, exact PDF document IDs, and exact source pages.
- Exact duplicate preflight for every proposed new finding.
- The insertion manifest has exactly 25 rows: 24 F additions and one S pressure finding.
- Postflight asserts 57 pending findings per model, no missing canonical key or `other` class, six separate injection type/pressure rows, three 1500 kg optional front lifts, three optional 1000 rpm front PTOs, six maximum-speed notes, and three 341 Nm at 1500 rpm torque findings.
- The catalog `horsepower=80` field remains unchanged.
- No queue row is changed.
- No finding is approved, published, or linked into `tractor_specs`.
- All new findings use the existing research run and exact official PDF document record, and remain pending human review.
- If any preflight or postflight assertion fails, the transaction rolls back.

## How to apply

1. Open the current SQL file: `sql-v21.43-spire-fsv-completeness.sql`.
2. Copy and run the entire file once in Supabase SQL Editor.
3. Review both final result sets.
4. Expected first result set: 57 findings / 57 pending / 0 missing canonical keys / 0 other / 0 linked-or-published for each model.

No Edge Function deployment is needed. Do not run the file again after a successful execution; the exact preflight intentionally refuses a second application.

## Technical notes

- The 80 in the tractor catalog remains a model/class designation. The technical table clearly records 76 HP maximum power and 75 HP at rated engine speed. Do not show 80 as maximum measured engine power.
- F's driver seat pneumatic suspension is marked STD on its own page 5 table; S/V mark it OPT on their respective pages. Preserve this model difference.
- The independent front suspended axle section is labelled OPT; the subfeatures with filled squares are STD within that optional package.
- Confidence values remain inherited from the original extraction metadata and are not calibrated probabilities. Human approval remains mandatory.
