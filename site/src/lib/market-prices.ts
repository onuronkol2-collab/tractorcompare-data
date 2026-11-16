/**
 * Curated, dated country/model/variant price evidence. This is NOT a global
 * price estimate or currency-conversion engine. Do not auto-infer missing
 * countries, variants, VAT treatment, sale conditions or used condition.
 *
 * New observations must be checked against the same model and configuration.
 * Draft models remain invisible because only published tractor catalog rows
 * reach the client. The recorded source is separately visible in price panels.
 */
import type { TractorRecord } from "./catalog.ts";

export const MARKET_COUNTRIES = [
  "TR", "IN", "CN", "US", "BR", "FR", "DE", "RU", "JP", "CA", "ES"
] as const;
export type MarketCountry = typeof MARKET_COUNTRIES[number];

export const COUNTRY_CURRENCIES: Record<MarketCountry,string> = {
  TR:"TRY", IN:"INR", CN:"CNY", US:"USD", BR:"BRL", FR:"EUR",
  DE:"EUR", RU:"RUB", JP:"JPY", CA:"CAD", ES:"EUR",
};

export interface MarketPrice {
  country: MarketCountry;
  brand: string;
  model: string;
  variantExact: string | null;
  // The optional market guard prevents importing a South Africa or Europe
  // variant into Turkey merely because its brand and model match.
  recordedMarket: string | null;
  currency: string;
  min: number;
  max: number;
  condition: "new" | "used";
  quoteKind: "manufacturer_msrp" | "dealer_listing" | "aggregator_range";
  taxBasis: "included" | "excluded" | "unspecified";
  observedOn: string;
  modelYear: number | null;
  configuration: string;
  sourceName: string;
  sourceUrl: string;
}

/**
 * Snapshot verified 16 Nov 2026. Manufacturer site states this recommended
 * retail price includes Turkish VAT, effective 01 Sep 2026.
 * One configuration = one exact quoted price, not a made-up price interval.
 */
export const MARKET_PRICES: readonly MarketPrice[] = [
  {
    country:"TR", brand:"New Holland", model:"T5.110",
    variantExact:"Bluemaster MasterDrive", recordedMarket:"Turkey",
    currency:"TRY", min:6464891, max:6464891, condition:"new",
    quoteKind:"manufacturer_msrp", taxBasis:"included",
    observedOn:"2026-11-16", modelYear:2026,
    configuration:"T5.110 BLM 4WD KK 14.9R38 (MD110) PS STG5",
    sourceName:"New Holland Türkiye, 2026 önerilen anahtar teslim fiyat listesi",
    sourceUrl:"https://www.newholland.com.tr/traktor-fiyat-listesi",
  },
  {
    country:"TR", brand:"New Holland", model:"T5.110",
    variantExact:"Dual Command", recordedMarket:"Turkey",
    currency:"TRY", min:6610095, max:6686197, condition:"new",
    quoteKind:"manufacturer_msrp", taxBasis:"included",
    observedOn:"2026-11-16", modelYear:2026,
    configuration:"2026 T5.110 DC 4WD KK PS STG5 (DC11PB, DC11PEG, DC11PE, DC11PF); standard range of four manufacturer-listed tyre configurations; excludes LE",
    sourceName:"New Holland Türkiye, 2026 tavsiye edilen KDV dâhil fiyat listesi (01.09.2026)",
    sourceUrl:"https://www.newholland.com.tr/traktor-fiyat-listesi",
  },
  {
    country:"TR", brand:"Başak Traktör", model:"5120",
    variantExact:null, recordedMarket:null,
    currency:"TRY", min:5099345, max:5114548, condition:"new",
    quoteKind:"manufacturer_msrp", taxBasis:"included",
    observedOn:"2026-11-16", modelYear:null,
    configuration:"5120 Red Power, 4WD cab with air conditioning; manufacturer-listed tyre configurations: 380/70R28 + 420/85R38, 380/70R28 + 480/70R38, or 440/65R28 + 540/65R38",
    sourceName:"BAŞAK Traktör, 5120 Red Power resmî KDV dâhil fiyat listesi",
    sourceUrl:"https://basaktraktor.com.tr/fiyat-listesi",
  },
  {
    country:"IN", brand:"Swaraj", model:"735 FE",
    variantExact:null, recordedMarket:null,
    currency:"INR", min:583000, max:618000, condition:"new",
    quoteKind:"aggregator_range", taxBasis:"unspecified",
    observedOn:"2026-11-16", modelYear:null,
    configuration:"Swaraj 735 FE (regional configurations and taxes may differ)",
    sourceName:"Tractor Junction, tractor price list updated 15 Nov 2026",
    sourceUrl:"https://www.tractorjunction.com/tractors/",
  },
] as const;

function norm(text: string | null | undefined): string {
  return String(text || "").normalize("NFKC").trim().toLocaleLowerCase("en");
}

export function matchingPrice(
  tractor: Pick<TractorRecord, "brand_name" | "model_name" | "variant" | "market" | "model_year">,
  country: string,
): MarketPrice | null {
  return MARKET_PRICES.find((item) =>
    item.country === country
    && norm(item.brand) === norm(tractor.brand_name)
    && norm(item.model) === norm(tractor.model_name)
    && (item.variantExact === null || norm(item.variantExact) === norm(tractor.variant))
    && (item.variantExact !== null || !tractor.variant || /^(standard|catalog listing - review)$/i.test(tractor.variant))
    && (!item.recordedMarket || norm(item.recordedMarket) === norm(tractor.market))
    && (!item.modelYear || !tractor.model_year || item.modelYear === tractor.model_year)
  ) || null;
}

export function formatMarketPrice(value: number, country: MarketCountry, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style:"currency", currency:COUNTRY_CURRENCIES[country],
    maximumFractionDigits:0, minimumFractionDigits:0,
  }).format(value);
}

export function formatMarketPriceRange(price: MarketPrice, locale: string): string {
  if (price.min === price.max) return formatMarketPrice(price.min, price.country, locale);
  return formatMarketPrice(price.min, price.country, locale)
    + " – " + formatMarketPrice(price.max, price.country, locale);
}
