# McCormick X5.120 — exact model illustration (23 November 2026)

## Public model identity and new page coverage
- **Published Supabase model**: `McCormick / X5.120`, UUID `a02c4df2-c719-5a26-abb2-6195cb8e23e5`, Europe, variant `X5 FPT F36 Stage V; EU brochure / Efficient-Premium configurations`, `status=published` (read-only project query on 23 Nov 2026).
- Distinct already-approved source record: `McCormick X5.120 P3-Drive`, fileId `mccormick-x5-120-marcelx42-2023`. The photograph shows the X5.120 model specifically, **with a P3-Drive transmission**. The public record does **not** claim to have P3-Drive. Reusing the source is an **illustration of the base model**, not a claim of identical equipment.
- No new photographs, third-party stock images, binary derivatives, source IDs, image routes, or technical facts are introduced. This expands **one published page's** previously missing model photo using an existing, licensed photo, contingent on CI and live checks.

## Copyright / model proof
- [Original Wikimedia Commons File page](https://commons.wikimedia.org/wiki/File:McCormick_X5.120_P3-Drive_Agritechnica_2023_(DSC03865).jpg). Page shows `Own work`, photographer/copyright-holder **MarcelX42**, 13 November 2023 at Agritechnica, `CC BY-SA 4.0`, original 7008 x 3944 JPEG.
- [License terms](https://creativecommons.org/licenses/by-sa/4.0/). The existing photograph attribution, source link, license link, and nonexact-configuration notice must remain visible in **all 10 languages**.
- The new `illustrativeOn` metadata binds the picture to **both** the verified published UUID and the exact displayed model name `X5.120`. This never changes photograph rights, source, or owner. No automatic sharing with adjacent `X5.100`, `X5.110`, `X5.120 HC`, or another X5.120 UUID.

## Acceptance and independent verification
1. Source ownership and file/license checked on 2026-11-23; exact public UUID, source photo registration and pre-existing rights metadata checked against current main.
2. Unit tests require photo on **only** public UUID `a02c4df2-...` and matching base-model name, reject no-ID/another model, and check ten-locale descriptive `alt`.
3. Keep existing photos count unchanged: no duplicate media records, no changed proxy origin allowlist, no broader matching of other models, no RLS/SQL modifications.
4. Run targeted photo tests, Golden Integration Rule, Astro build, image sitemap/SEO production gates and Cloudflare preview. On the published model page, verify actual HTML photo/attribution, correct image response 200 with JPEG MIME at the first-party 480/960/1920 paths, mobile LCP and lightbox, canonical/hreflang, and ten locale pages.
5. **Merge/deploy/live checks are separate**. If the image proxy or any check fails, leave the PR as draft and do not call it published. Revert the isolated code alias to roll back.

**Publication status at the time of this documentation**: proposed in a PR, not verified live. A successful merge and deployment must be recorded separately.
