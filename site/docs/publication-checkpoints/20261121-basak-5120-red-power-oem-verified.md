# TractorVS — Başak 5120 Red Power 4WD Stage V official data release

Date: 2026-11-21
Private batch: `20261121_basak_5120_red_power_oem_verified_v1`
Tractor ID: `01590869-dc68-4d73-87ea-8bf930bbec65`

## Official OEM product identity and findings

Current manufacturer product:
https://basaktraktor.com.tr/urunler/traktorler/tarla-traktorleri/5120-red-power

The exact manufacturer's public HTML specification table identifies **5120 Red Power**, **4WD**, **EU Stage V**. The site is in Turkish; no independently proven production model year or exclusive sales market has been inferred.

The following 13 existing draft specs were each matched against the product-specific original and verified:
- AdBlue 20 L; fuel 200 L; Deutz TCD 3.6, turbo intercooler, 4 cylinders / 3621 cc, Stage V
- **122 hp / 90 kW at 2000 rpm is MAXIMUM engine power per ISO 14396, not an unsupported rated engine HP value**
- Maximum torque 480 Nm at 1600 rpm
- Rear hydraulic maximum lift 5500 kg (measurement point not specified)
- Rear PTO speed choices 540, 540E, 1000, 1000E rpm
- 32 forward / 32 reverse semi-automatic gearbox with 4-step standard Auto Powershift

15 additional model-specific facts are backed by that same OEM HTML table: max engine power 90 kW and its 2000 rpm speed; Common Rail injection; 4WD configuration; 100 L/min **maximum main hydraulic pump flow**, separately 200 bar pump pressure; **optional 2200 kg front hitch**; wheelbase 2500 mm; adjustable front/rear track-width ranges; overall length/width/height ranges; ground-clearance range; manufacturer-listed configuration-dependent weight range.

Width, height, track width, overall length, ground clearance and total tractor weight were retained as **ranges**, not substituted with guessed standard base dimensions. `tractors.horsepower` remains NULL because the only power value is explicitly a MAXIMUM rather than a rated value. `tractors.weight_kg` remains NULL because weight is a range of configurations. No photo imported without image licence evidence.

## Backups and verification

The single guarded transaction privately snapshotted **1 original tractor + 13 original spec records** in `tc_backup.tractor_publication_patches`. The 15 newly inserted specs are individually identified with `__created_in_batch=true` for exact, audited rollback. No mass promotion or changes to any other model.

Post-commit read-only verification:
- **273 published, 195 draft, 10 archived**.
- **28/28 manufacturer-sourced, excerpt-backed public facts** with **28 unique canonical keys**, no unknown-source row.
- The maximum power `engine_max_power=122 hp` is linked to **ISO 14396**. No false `engine_rated_power_hp` is exposed.
- **Zero** nonpublished tractor rows leaked into public `tractorvs_public_specs` view.
- `anon` cannot read the private backup.

Rollback only after genuine fault review: delete only the 15 exact `__created_in_batch=true` spec UUIDs and restore the 1 original tractor + 13 original specs from private JSON snapshots under the batch ID in a locked transaction, checking for any subsequent updates. This action has NOT been executed.

## GitHub / Cloudflare / SEO

This checkpoint triggers the existing free published-catalog-sync workflow. Its completed fingerprint will request a new static site build for the 273-model catalogue. Production deployment, canonical, ten language routes, XML sitemap and indexability require independent live HTTP checks; Google indexing cannot be assumed from a successful build.
