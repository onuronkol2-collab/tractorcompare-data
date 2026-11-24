import type {TractorRecord} from "./catalog.ts";

const catalogueOrder = new Intl.Collator("en", {numeric:true});

/**
 * Show real, already-published model pages as ordinary crawlable HTML links.
 * Same manufacturer first; within that brand, show exact same-name model variants before other machines, then same market and nearby documented power.
 * Never infer comparable performance or introduce unpublished records.
 */
export function morePublishedTractors(
  current: Pick<TractorRecord,"tractor_id"|"slug"|"brand_name"|"model_name"|"market"|"horsepower">,
  published: readonly TractorRecord[],
  limit = 3
): TractorRecord[] {
  const brand = current.brand_name.trim().toLocaleLowerCase("en");
  const model=current.model_name.trim().toLocaleLowerCase("en");
  const market = current.market?.trim().toLocaleLowerCase("en") || null;
  const max = Math.max(0, Math.min(4, Math.trunc(limit) || 0));
  const ranked = published.filter(item =>
    item.tractor_id !== current.tractor_id && item.slug !== current.slug
  );
  return ranked.sort((a,b) => {
    const rank = (item:TractorRecord) => {
      const sameBrand = item.brand_name.trim().toLocaleLowerCase("en") === brand ? 0 : 1;
      const sameModel = sameBrand===0 && item.model_name.trim().toLocaleLowerCase("en") === model ? 0 : 1;
      const sameMarket = market && item.market?.trim().toLocaleLowerCase("en") === market ? 0 : 1;
      const powerGap = current.horsepower != null && item.horsepower != null
        ? Math.abs(item.horsepower-current.horsepower) : Number.MAX_SAFE_INTEGER;
      return [sameBrand,sameModel,sameMarket,powerGap] as const;
    };
    const left = rank(a),right = rank(b);
    return left[0]-right[0] || left[1]-right[1] || left[2]-right[2]
      || left[3]-right[3] || a.slug.localeCompare(b.slug,"en");
  }).slice(0,max);
}


// Include the next published model in the same manufacturer's catalogue order.
// Ranking alone repeatedly selects popular peers, leaving some records with
// only their catalogue listing. Preserve all three ranked recommendations.
export function modelDiscoveryLinks(current: TractorRecord, published: readonly TractorRecord[]) {
  const ranked = morePublishedTractors(current, published);
  const brand = current.brand_name.trim().toLowerCase();
  const family = published.filter(item => item.brand_name.trim().toLowerCase() === brand)
    .sort((left,right) => catalogueOrder.compare(left.model_name,right.model_name)
      || left.slug.localeCompare(right.slug,"en"));
  const index = family.findIndex(item => item.tractor_id === current.tractor_id);
  if (index < 0 || family.length < 2) return ranked;
  const next = family[(index + 1) % family.length];
  return ranked.some(item => item.slug === next.slug) ? ranked : [...ranked,next];
}
