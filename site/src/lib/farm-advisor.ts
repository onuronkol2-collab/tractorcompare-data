/**
 * Transparent pre-screening, NOT horsepower sizing or fitment certification.
 * Requires equipment manuals/dealer confirmation for PTO, implement load,
 * hydraulics, drawbar, ballast, tyre width, slope safety and local support.
 */
import type { TractorRecord } from "./catalog.ts";
import { matchingPrice, MARKET_COUNTRIES, type MarketCountry } from "./market-prices.ts";

export type AreaUnit = "m2" | "dekar" | "hectare" | "acre" | "mu" | "tan";
export const AREA_SQM: Record<AreaUnit,number> = {
  m2:1, dekar:1000, hectare:10000, acre:4046.8564224,
  mu:10000/15, tan:991.73553719,
};
export const AREA_UNIT_LABELS: Record<AreaUnit,string> = {
  m2:"m²", dekar:"dönüm / dekar", hectare:"ha", acre:"acre",
  mu:"亩 (mǔ)", tan:"反 (tan)",
};
export const COUNTRY_AREA_UNITS: Record<MarketCountry, AreaUnit> = {
  TR:"dekar", IN:"acre", CN:"mu", US:"acre", BR:"hectare",
  FR:"hectare", DE:"hectare", RU:"hectare", JP:"tan",
  CA:"acre", ES:"hectare",
};
export const COUNTRY_NAMES: Record<MarketCountry,string> = {
  TR:"Türkiye", IN:"India", CN:"中国", US:"United States", BR:"Brasil",
  FR:"France", DE:"Deutschland", RU:"Россия", JP:"日本",
  CA:"Canada", ES:"España",
};

export const COUNTRIES_BY_LOCALE: Record<string,MarketCountry> = {
  tr:"TR", en:"US", zh:"CN", hi:"IN", "pt-br":"BR",
  fr:"FR", de:"DE", ru:"RU", ja:"JP", es:"ES",
};

export function areaToHectares(amount: number, unit: AreaUnit): number {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e10) throw new Error("Invalid farm area");
  if (!(unit in AREA_SQM)) throw new Error("Unsupported area unit");
  return amount * AREA_SQM[unit] / 10000;
}

export type Crop = "grain" | "vegetables" | "orchard" | "vineyard" | "rice" | "pasture" | "mixed";
export type Terrain = "flat" | "rolling" | "steep";
export type Soil = "light" | "medium" | "heavy";
export type Operation = "light" | "general" | "heavy";
export type Implement = "light" | "medium" | "heavy";
export type Trailer = "none" | "light" | "heavy";
export type Condition = "new" | "used" | "either";

export interface FarmInputs {
  country: MarketCountry;
  hectares: number;
  crop: Crop;
  terrain: Terrain;
  soil: Soil;
  operation: Operation;
  implement: Implement;
  trailer: Trailer;
  annualHours: number;
  condition: Condition;
  budget: number | null;
  servicePriority: boolean;
}

export function horsepowerScreening(input: FarmInputs): { min: number; max: number; reasons:string[] } {
  if (!Number.isFinite(input.hectares) || input.hectares <= 0 || input.hectares > 1000000) throw new Error("Invalid hectares");
  if (!Number.isFinite(input.annualHours) || input.annualHours < 0 || input.annualHours > 8760) throw new Error("Invalid annual hours");
  const ha = input.hectares;
  let min = ha < 2 ? 18 : ha < 10 ? 28 : ha < 30 ? 45 : ha < 80 ? 65 : 100;
  let max = ha < 2 ? 40 : ha < 10 ? 65 : ha < 30 ? 95 : ha < 80 ? 145 : 210;
  const reasons: string[] = ["area"];
  const bump = (low: number, high: number, label: string) => {
    min += low; max += high; reasons.push(label);
  };
  if (input.operation === "heavy") bump(18, 30, "workload");
  else if (input.operation === "light") bump(-7,-8, "workload");
  if (input.implement === "heavy") bump(18, 24, "implement");
  else if (input.implement === "medium") bump(6, 12, "implement");
  if (input.trailer === "heavy") bump(12, 20, "trailer");
  if (input.soil === "heavy") bump(8, 16, "soil");
  if (input.terrain === "rolling") bump(5, 9, "terrain");
  if (input.terrain === "steep") bump(9, 15, "terrain");
  if (input.crop === "orchard" || input.crop === "vineyard") bump(-5, -5, "crop");
  if (input.crop === "rice") bump(4, 8, "crop");
  if (input.annualHours >= 800) bump(5, 12, "hours");
  min = Math.max(15, Math.min(300, Math.round(min)));
  max = Math.max(min + 10, Math.min(350, Math.round(max)));
  return { min, max, reasons };
}

function marketCompatibility(market: string | null, country: MarketCountry): "matched" | "unknown" | "excluded" {
  const m = String(market || "").toLowerCase().trim();
  if (!m || m === "global" || m === "international") return "unknown";
  if (["turkey", "türkiye", "tr"].includes(m)) return country === "TR" ? "matched" : "excluded";
  if (["us", "usa", "united states", "north america"].includes(m)) return ["US","CA"].includes(country) ? "matched" : "excluded";
  if (["europe", "eu"].includes(m)) return ["FR","DE","ES"].includes(country) ? "matched" : "excluded";
  if (m === "south africa") return "excluded";
  if (m.toUpperCase() === country) return "matched";
  return "unknown";
}

export interface FarmMatch {
  tractor: TractorRecord;
  score: number;
  power: number;
  marketFit: "matched" | "unknown";
  price: ReturnType<typeof matchingPrice>;
  priceFit: "in_budget" | "over_budget" | "not_checked";
  powerFit: "within" | "near";
}

/** Rank known-power published catalog entries only; never promise availability. */
export function recommendTractors(catalog: TractorRecord[], input: FarmInputs, limit = 5): FarmMatch[] {
  const target = horsepowerScreening(input);
  const mid = (target.min + target.max) / 2;
  const output: FarmMatch[] = [];
  for (const tractor of catalog) {
    if (!Number.isFinite(tractor.horsepower) || (tractor.horsepower ?? 0) <= 0) continue;
    const power = tractor.horsepower!;
    const marketFit = marketCompatibility(tractor.market, input.country);
    if (marketFit === "excluded") continue;
    const price = matchingPrice(tractor,input.country);
    const matchedCondition = !price || input.condition === "either" || price.condition === input.condition;
    const applicablePrice = matchedCondition ? price : null;
    const priceFit = input.budget == null || !applicablePrice ? "not_checked"
      : applicablePrice.min > input.budget ? "over_budget" : "in_budget";
    const deviation = power < target.min ? target.min-power
      : power > target.max ? power-target.max : 0;
    const within = deviation === 0;
    // Power screening and market metadata are the ONLY fit signals scored.
    let score = 100 - Math.min(95,deviation*2.2) - Math.abs(power-mid)*0.12;
    if (marketFit === "matched") score += 8;
    if (priceFit === "in_budget") score += 4;
    if (priceFit === "over_budget") score -= 32;
    output.push({
      tractor, power, score, marketFit, price:applicablePrice,
      priceFit, powerFit:within?"within":"near"
    });
  }
  return output.sort((a,b) => b.score-a.score || a.tractor.brand_name.localeCompare(b.tractor.brand_name)).slice(0,Math.max(0,limit));
}

/**
 * Separate price quotes from market guidance: missing observation must always
 * remain an explicit unknown, never a computed exchange-rate estimate.
 */
export function supportedMarketCountry(value: string): MarketCountry | null {
  return (MARKET_COUNTRIES as readonly string[]).includes(value) ? value as MarketCountry : null;
}
