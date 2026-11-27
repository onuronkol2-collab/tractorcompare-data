import type {TractorRecord} from "./catalog.ts";
import {matchedHeadlinePowerSource} from "./model-evidence-answers.ts";

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
  // Compute rank once per record, rather than for every sort comparison.
  const rank = (item:TractorRecord) => {
      const sameBrand = item.brand_name.trim().toLocaleLowerCase("en") === brand ? 0 : 1;
      const sameModel = sameBrand===0 && item.model_name.trim().toLocaleLowerCase("en") === model ? 0 : 1;
      const sameMarket = market && item.market?.trim().toLocaleLowerCase("en") === market ? 0 : 1;
      const powerGap = current.horsepower != null && item.horsepower != null
        ? Math.abs(item.horsepower-current.horsepower) : Number.MAX_SAFE_INTEGER;
      return [sameBrand,sameModel,sameMarket,powerGap] as const;
  };
  return ranked.map(item=>({item,score:rank(item)})).sort((a,b)=>{
    const left=a.score,right=b.score;
    return left[0]-right[0] || left[1]-right[1] || left[2]-right[2]
      || left[3]-right[3] || a.item.slug.localeCompare(b.item.slug,"en");
  }).slice(0,max).map(entry=>entry.item);
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
  const next = index >= 0 && family.length > 1 ? family[(index + 1) % family.length] : null;
  const links = next && !ranked.some(item => item.slug === next.slug) ? [...ranked,next] : ranked;
  // Preserve all existing paths and optionally add one cross-brand discovery
  // link based on published, source-matched engine-power records. This is
  // navigation, NOT a claim of equivalent test methods, use or performance.
  const peer = sourceMatchedMarketPeer(current,published);
  return peer && !links.some(item => item.slug === peer.slug || item.tractor_id === peer.tractor_id) ? [...links,peer] : links;
}

/** Exact recorded market only. No locale-based inference or broad global/unknown labels. */
function specificMarket(value:string|null):string|null {
  const market=value?.trim().toLowerCase();
  if(!market || /[<>\r\n]/.test(market) || /\b(?:unspecified|unknown|global|international|worldwide|export)\b/i.test(market))return null;
  return market;
}
export function sourceMatchedMarketPeer(current:TractorRecord,published:readonly TractorRecord[]):TractorRecord|null {
  const market=specificMarket(current.market);
  const power=matchedHeadlinePowerSource(current)?.value;
  if(!market || power===undefined)return null;
  const brand=current.brand_name.trim().toLowerCase();
  const gapLimit=Math.min(15,Math.max(3,power*0.1));
  const matches=published.filter(item=>
    item.tractor_id!==current.tractor_id && item.slug!==current.slug &&
    item.brand_name.trim().toLowerCase()!==brand &&
    specificMarket(item.market)===market &&
    typeof item.horsepower==="number" && Number.isFinite(item.horsepower) &&
    Math.abs(item.horsepower-power)<=gapLimit &&
    matchedHeadlinePowerSource(item)!==null
  ).sort((a,b)=>Math.abs(a.horsepower!-power)-Math.abs(b.horsepower!-power)||a.slug.localeCompare(b.slug,"en"));
  return matches[0]??null;
}

// Explicit static-route preparation, not a global memoized result. A new
// published snapshot always computes fresh results. Returned lists are readonly
// so parallel rendering cannot mutate another locale's navigation order.
export function prepareModelDiscovery(published:readonly TractorRecord[]){
 return published.map(tractor=>({tractor,moreModels:Object.freeze(modelDiscoveryLinks(tractor,published))}));
}
