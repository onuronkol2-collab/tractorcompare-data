# Belarus 920 vs 920.2 — model-exact manufacturer-manual data, 23 November 2026

## Why two independent versions
The authentic **Minsk Tractor Works 900-series operating manual**, available at [MTZ Equipment](https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf), printed pages **6, 30–31** explicitly distinguishes Belarus MTZ-920 with **front driving axle FDA 72 (sliding bevel reduction)** from MTZ-920.2 with **FDA 822 (rigid planetary wheel reduction)**. Both share D-243/D-243S, 59.6 kW / 2200 rpm manufacturer claim, but the PTO, hitch hydraulics, standard front/rear tyre sizes and layout must not be mixed.

| Published model | Exact UUID | Old sourced specs | New proposed manual items | Expected total |
|---|---|---:|---:|---:|
| Belarus 920 / D-243/D-243S / FDA 72 | `21e79b33-189b-44c1-a1e2-703ad8836d92` | 10 | 10 | 20 |
| Belarus 920.2 / D-243/D-243S / FDA 822 | `1e1d7219-8921-44fe-83a6-c88514c1224a` | 10 | 10 | 20 |

The 20 new values cover exact standard front/rear tyre sizes (920: **13.6-20** / **16.9R38**; 920.2: **360/70R24** / **18.4R34 Φ-11**), each variant's front axle reduction, different hydraulic hitch arrangements, two-speed independent plus wheel-synchronous PTO modes, SAE 6/21 spline ends (540/1000), hydraulic outlets with **optional drain**, Cat. 2 rear hitch, standard dry vs **optional oil-bath brakes**, and 59.6 kW manufacturer engine power with **unreported test standard**. Each has an explicit source/condition and 9 translated technical labels; English is original.

### Anti-confusion and exclusions
- No model year or country is inferred; the manual describes older MTZ model families. These are **manufacturer manual** data, not farm test results or current model-year specifications.
- **920** sliding bevel reducer is *not* 920.2 planetary reducer. Front/rear standard tyres differ and no option is mislabeled standard.
- 920.2 hydraulics: 2 built-in lift cylinders; 920: separate power cylinder. Do not merge two different system architectures.
- The manual mentions **3000 kg** rear hitch lift at arm ends, while one distributor page for 920.2 describes **3200 kg**. Measurement/regional model mismatch has not been resolved; **neither value is added**.
- Hydraulic pressure varies by source (**18–20 MPa** manual vs **16 MPa** dealer); excluded until pressure configuration is verified.
- The 920-only **540 @ 2081 rpm / 1000 @ 2302 rpm** engine-speed setting is *not* copied to 920.2. Spline end physical types do not imply a given engine RPM.
- 59.6 kW is **manufacturer claimed** with no power test protocol and remains a technical specification only; do not populate headline horsepower or convert it automatically to '81 HP'.
- Supplier photographs or images in the operation manual are **not CC-licensed** for site reuse. **0 new photos** in this batch.
- Wikipedia, model-family articles, dealership pages and seller media do not supersede the exact manufacturer manual's model identity.

### QA and release
Source reference is already present in `public.data_sources` as `1ca19926-c9ca-4440-8b11-038a58921d43` with `source_priority=80`. SQL is `supabase/maintenance/20261123_belarus_920_9202_manual_20_specs.sql`: single transaction, source URL check, exact published UUID/variant check, duplicate canonical-key check, advisory lock and exactly 20 inserts. It changes no existing tractors, photo media, RLS policies or unreviewed drafts. `evidence_text` prefix `MTZ 900 manual reviewed 2026-11-23:` enables targeted post-audit and precise rollback.

**Important:** Merge / CI and actual Supabase execution are separate. Then check public catalogue fingerprint, successful Cloudflare deployment, and exact live TR/EN model pages (canonical, source links and counts 20/20). Keep all 10 translated specification labels and source values independent.

References:
- [Original technical manual, 900 series](https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf)
- [MTZ Equipment's manual list](https://www.mtzequipment.com/service/older)
- [Kazakhstan 920.2 model page (regional model source, not adopted where inconsistent)](https://www.belarus-tractor.kz/products/23).
