# Bobcat three-model publication checkpoint — 2026-11-24

User-authorized OEM technical review and database publication. Three North American HST models, 72 evidence-backed public specifications including 35 new rows. Existing 37 rows reviewed against the exact manufacturer technical tables. CT1025 draft variant HSTD corrected to HST; duplicate identity checked before change. Unknown year and summary fields retained.

| Model | Added | Public specs |
|---|---:|---:|
| CT1025 | 13 | 24 |
| CT2035 | 11 | 24 |
| CT4058 | 11 | 24 |

Original sources:
- https://www.bobcat.com/na/en/equipment/tractors/sub-compact-tractors/1000-platform-sub-compact-tractors/ct1025
- https://www.bobcat.com/na/en/equipment/tractors/compact-tractors/2000-platform-compact-tractors/ct2035
- https://www.bobcat.com/na/en/equipment/tractors/compact-tractors/4000-platform-compact-tractors/ct4058

Manufacturer engine model, PTO speed, dimensions, turning radius, speeds, optional front loader lift and hitch category added. Rear lift at 24 inches retained separately from loader lift; US units retained; optional mid PTO distinguished. CT4058 bucket pivot height not added because unit not stated in source. Contextual independent sources https://www.fwi.co.uk/machinery/tractors/bobcat-unveils-south-korean-made-ct-compact-tractors and https://www.tractordata.com/farm-tractors/010/3/1/10318-bobcat-ct1025.html; European/Australian market figures not applied to North America. No independent measured performance or reliability claims.

Atomic serializable transaction, exact identities, reviewed fingerprints, exact source URLs, 40 private before-state snapshots in batch 20261124_bobcat_three_oem_release_v1. Anon-role check confirmed three records and 72 rows before commit. No schema, RLS, photo or paid API changes. Other inaccessible Bobcat pages held. Rollback only these exact changes after checking subsequent edits; new rows are not before-state snapshots. Existing free main catalogue sync after required CI and merge. Live deployment and ten-locale verification remain separate.
