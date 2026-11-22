# TractorVS independent photograph deep research — 22 November 2026

## Scope and hard boundary

This is a **read-only investigation** and does not grant permission to publish or assert an exact photographed tractor configuration. It adds **zero live images**, makes **zero Supabase changes**, does not alter forum, sitemap, canonical, i18n or photo-routing code, and requests no paid API plan.

The actual GitHub Actions report [#45053407036](https://github.com/onuronkol2-collab/tractorcompare-data/actions/runs/45053407036) covers **388 distinct published tractor IDs / 462 localized published sitemap rows**. A count of **113 Commons title matches** corresponds to only **43 distinct brand+model pairs with at least one candidate**. It is not the number of cleared or missing photographs. The first 12 Openverse searches across Flickr/Europeana returned no filtered lead; that is neither exhaustive searching nor evidence that no photo exists. The published inventory had **314 photo-less records and 290 unique missing pairs** in the prior gap audit, not a guaranteed updated live count.

## Newly surfaced via captions and manufacturer's documented model aliases

All file and model identifiers, URLs, stated authors, permission labels, source URLs, uncertainty and current status are in [photo-curated-caption-and-alias-candidates-20261122.json](photo-curated-caption-and-alias-candidates-20261122.json). File pages are **candidate evidence only**, not proven ownership beyond self-license declarations, nor a verified JPEG. Never use the author's profile, Google thumbnail, a dealer listing or a catalogue resemblance as an independent reproduction license.

| Candidate target | Original Commons File page | Creator / stated license | Exact identity decision | Publication |
|---|---|---|---|---|
| McCormick **X5.085** (UUID `d050e1f3-666a-41ab-bc4d-ec3e218586cf`) | [MB-one, P1140949](https://commons.wikimedia.org/wiki/File:McCormick,_Agritechnica_2023,_Hanover_(P1140949).jpg) | MB-one, CC BY-SA 4.0 | Caption identifies *X5.085*; filename alone did not | HOLD for binary SHA, visual rights check |
| TYM **T6115 / T115** (UUID `80fd42a2-3059-40bb-a0e1-511ae6100213`) | [MarcelX42, T115](https://commons.wikimedia.org/wiki/File:TYM_T115_Agritechnica_2025_(DSC04612).jpg) | MarcelX42, CC BY-SA 4.0 | Manufacturer [T115-intl](https://tym.world/en/products/tractors/series-6/t115-intl) gives alternate T6115 (T115) | HOLD for binary SHA, origin and rights |
| TYM **T2025P / T25** (UUID `622ddce0-f3a8-48ad-8ec6-45ca936dba6f`) | [MarcelX42, T25](https://commons.wikimedia.org/wiki/File:TYM_T25_Agritechnica_2025_(DSC04615).jpg) | MarcelX42, CC BY-SA 4.0 | Manufacturer [T25-intl](https://tym.world/en/products/tractors/series-2/t25-intl) gives alternate T2025P (T25) | HOLD for binary SHA, origin and rights |
| TYM **T3048 / F50CHN** (only UUID `458be7b8-f6b8-4319-b264-dc6c7cc36ae7`) | [MarcelX42, F50Chn](https://commons.wikimedia.org/wiki/File:TYM_F50Chn_Agritechnica_2025_(DSC04655).jpg) | MarcelX42, CC BY-SA 4.0 | Manufacturer [F50C](https://tym.world/en/products/tractors/series-3/f50c) names F50CHN within T3048 family | HOLD for **variant-specific binding fix** and real JPEG |

**Variant contamination discovered:** Current `tractorPhotos()` matches photo brand and model only. The published T3048 has multiple distinct UUIDs/variants; attaching an F50CHN photograph to generic `TYM T3048` would show the wrong picture on other T3048 records. The research record is pinned to UUID; actual production code must separately enforce this before this candidate can be approved. Do **not** assume a published family name makes different markets / emissions / cabs / variants interchangeable.

## Intentionally held / rejected leads

- **Sonalika DI-30Rx Baagban**: The Commons page lists self-owned CC BY-SA, but also asks users to contact the author before commercial use. That contact request is not by itself a new CC-NC license. Combined with the difference between photographed `DI-30Rx` and published generic `DI 30 Baagban`, keep in manual rights / model trim review; neither remove the license nor invent permission.
- **TYM T130 photograph versus published T6130**: Similar manufacturer platform is not identity; exclude.
- **Zetor MAJOR HS 80 photograph versus published MAJOR CL 80**: Same family is not the same configuration; exclude.
- **TYM T495SH photographed versus generic published T4049 (T495)**: TYM's official page confirms the T4049–T495 alias but not that photographed T495SH has the same registered transmission/configuration. The [Commons T495SH file](https://commons.wikimedia.org/wiki/File:TYM_T495SH_Agritechnica_2025_(DSC04665).jpg) is CC BY-SA 4.0 by MarcelX42, but remains quarantined for exact variant proof and image integrity.
- Other retailer, manufacturer, marketplace stock images without an explicit owner reuse grant are excluded, even if Google can show thumbnails.

## Next publication gates, in order

1. Confirm exact current published UUID/variant and original Commons File page ownership/source/license for each candidate, including photographer and original pixel dimensions.
2. Acquire actual approved original derivatives only using provider-supported widths and honoring `Retry-After`. HTTP 429, HTML body, unexpected redirects, corrupt JPEG, or missing hash **must fail closed**. Never use proxy/VPN or repeated requests to bypass media restrictions.
3. Prepare 480/960/1920 first-party binaries with SHA-256 evidence; compare image contents against correct model visual evidence and store the creator/licensing/crop/change notice.
4. Ensure the T3048 F50CHN photo can only render for exact UUID, add regression tests for neighboring variants. Do not change photo model resolver by making unsupported claims of exact configuration.
5. Run photo, 10-language SEO/JSON-LD/sitemap, Golden Rule, CodeQL, build, browser/mobile/axe and production release gates on a separate PR. Only after successful checks can verified photos be merged, with live HTTP/MIME and Google image sitemap rechecked.

The existing Steyr/Zetor work is separately tracked as [PR #445](https://github.com/onuronkol2-collab/tractorcompare-data/pull/445). Its 429 blocker and missing local source binaries remain. Review-only media staging was merged via [PR #450](https://github.com/onuronkol2-collab/tractorcompare-data/pull/450) but was not dispatched as part of this research. **No live photo count increment is justified by this note.**
