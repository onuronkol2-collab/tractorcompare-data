import type {TractorRecord} from "./catalog.ts";

/**
 * Show real, already-published model pages as ordinary crawlable HTML links.
 * Same manufacturer first; then same documented market and nearby stated power.
 * Never infer comparable performance or introduce unpublished records.
 */
export function morePublishedTractors(
  current: Pick<TractorRecord,"tractor_id"|"slug"|"brand_name"|"market"|"horsepower">,
  published: readonly TractorRecord[],
  limit = 3
): TractorRecord[] {
  const brand = current.brand_name.trim().toLocaleLowerCase("en");
  const market = current.market?.trim().toLocaleLowerCase("en") || null;
  const max = Math.max(0, Math.min(4, Math.trunc(limit) || 0));
  const ranked = published.filter(item =>
    item.tractor_id !== current.tractor_id && item.slug !== current.slug
  );
  return ranked.sort((a,b) => {
    const rank = (item:TractorRecord) => {
      const sameBrand = item.brand_name.trim().toLocaleLowerCase("en") === brand ? 0 : 1;
      const sameMarket = market && item.market?.trim().toLocaleLowerCase("en") === market ? 0 : 1;
      const powerGap = current.horsepower != null && item.horsepower != null
        ? Math.abs(item.horsepower-current.horsepower) : Number.MAX_SAFE_INTEGER;
      return [sameBrand,sameMarket,powerGap] as const;
    };
    const left = rank(a),right = rank(b);
    return left[0]-right[0] || left[1]-right[1] || left[2]-right[2]
      || a.slug.localeCompare(b.slug,"en");
  }).slice(0,max);
}
