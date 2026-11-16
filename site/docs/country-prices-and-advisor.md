# TractorVS — regional tractor prices and land-area advisor

Status: build-and-test reviewed, deployment must be verified separately.
Date: 2026-11-16.

## Market coverage and evidence threshold

Country selectors: Türkiye (TR), India (IN), China (CN), USA (US),
Brazil (BR), France (FR), Germany (DE), Russia (RU), Japan (JP),
Canada (CA), Spain (ES). This is eleven markets for the ten-language UI.

Prices are explicitly curated quotations, never automatically created from
horsepower, generic market averages, currency conversions, or another
market's variant. Each price entry in src/lib/market-prices.ts must have:

- Exact brand and model; matching variant and market where applicable.
- Model year, condition (new/used), exact configuration, local currency.
- Source type (manufacturer suggested retail/dealer listing/aggregator band).
- Local country, tax basis, observation date and original URL.
- Actual value(s) visible in the source on date recorded. A single value is
  displayed as a single price rather than a fabricated range.

Currently included price observations (not a complete price database):
1. TR — New Holland T5.110 Bluemaster MasterDrive, 2026, 4WD KK 14.9R38
   (MD110) PS STG5; recommended VAT-inclusive retail **TRY 6,464,891**,
   valid for model year 2026 from 2026-09-01. Source:
   https://www.newholland.com.tr/traktor-fiyat-listesi
2. IN — Swaraj 735 FE 2026 general listed range **INR 583,000 to 618,000**,
   tax basis unspecified; third-party publication dated 2026-11-15,
   review regional variants before using beyond a basic model match.
   Source: https://www.tractorjunction.com/tractors/

For other tractor-country-variant records the UI states **No checked price**.
Do not substitute a national horsepower-class band as the price of an
individual model. A published tractor without a matching dated quotation may
still be considered for a preliminary power screening, but its budget fit
cannot be asserted.

## Land-area units

- TR: dekar/dönüm = 1,000 m²
- US/CA/IN: acre = 4,046.8564224 m²
- CN: mu (亩) = 10,000 / 15 m²
- JP: tan (反) ~= 991.73553719 m²
- BR/FR/DE/RU/ES: hectare = 10,000 m²
- Also supports m², dekar, hectare, acre, mu, tan in all markets.

*Bigha* in India is not supported as one fixed unit because the land
measure differs by state/district. Users may use acres/hectares/m² from
land records. Never infer a universal bigha conversion.

## Recommendation scope

The calculator is a **preliminary horsepower screening** only:
field area, crop, terrain slope, soil class, estimated operation/implement/
trailer demands, annual working hours and optional budget affect screening.
Published tractor candidates must have numerical recorded horsepower;
unknown-country regional variants are excluded; global-market records are
marked availability-unverified. Budget fit is indicated only when there is
a compatible country+model+variant+condition price observation.

Service and spare-parts availability cannot be inferred from brand name.
A checked service priority asks users to verify their local dealer;
the algorithm does not claim to score an unverified national service network.
Before selecting an implement, verify PTO type/speed/power, lift capacity,
hydraulic pressure/flow, weight/ballast, traction and tyre width, slope
safety and servicing with local manufacturer/dealer professionals.

## Safe release and upkeep

- Only the published public view feeds the catalogue; drafts stay hidden.
- The established manufacturer-only technical source links remain unchanged.
  Price quotation sources are separate and can be reputable independent sites.
- No credential or privileged Supabase endpoint is used for price data.
- Geo detection uses country only at Cloudflare edge, without IP logging.
  Country selection in the UI can always override the hint.
- Snapshot dates remain visible. Update prices through a reviewed PR after
  checking source, date, variant and VAT. Flag stale quotations rather than
  presenting them as current dealer offers.
- Keep the indexing opt-in; all 10 locale routes get canonical/hreflang
  through the existing site layout when indexing is explicitly enabled.

Evidence for area and pricing methodology:
https://islamansiklopedisi.org.tr/donum
https://www.egovstandards.gov.in/sites/default/files/2021-07/MDDS%20Demographic%20Ver%201.1.pdf
https://www.mdpi.com/2077-0472/14/3/342
