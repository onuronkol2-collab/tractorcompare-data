/**
 * A small, strictly evidence-backed client payload for the catalogue's
 * country price selector. Most tractors have no verified price anywhere.
 *
 * Those cards remain "price unavailable" for every supported market, so
 * including all of them in a repeated 10-language JSON payload only wastes
 * bandwidth and DOM work (previously ~49 KB per catalogue page).
 */
import type { TractorRecord } from "./catalog.ts";
import { MARKET_COUNTRIES, matchingPrice } from "./market-prices.ts";

export type PricedCatalogModel = Pick<TractorRecord,
  "tractor_id" | "brand_name" | "model_name" | "variant" | "market" | "model_year">;

export function pricedCatalogModels(
  tractors: readonly PricedCatalogModel[],
): PricedCatalogModel[] {
  return tractors.filter((tractor) =>
    MARKET_COUNTRIES.some((country) => matchingPrice(tractor, country) !== null)
  ).map(({ tractor_id, brand_name, model_name, variant, market, model_year }) => ({
    tractor_id, brand_name, model_name, variant, market, model_year,
  }));
}
