import { normalizeModelSearch } from "./farm-model-search.mjs";

/**
 * Share the farm-model selector's Latin-only accent folding. NFC preserves
 * Cyrillic breve/diaeresis and Japanese voicing; whitespace is canonicalized
 * for ranking. Published model names, variants and URLs remain untouched.
 */
export function normalizeTractorQuery(value: string): string {
  return normalizeModelSearch(value);
}


/** Match each normalized search term in the same published model record. */
export function matchesTractorTerms(searchKey: string, terms: readonly string[]): boolean {
  return terms.every(term => searchKey.includes(term));
}

/** Published-only home autocomplete. The original catalog names remain unchanged. */
export interface TractorSuggestion {
  brand: string;
  model: string;
  variant: string | null;
  market?: string | null;
  engine?: string | null;
  year: number | null;
  horsepower: number | null;
  specs: number;
  url: string;
}
// Published autocomplete records are reused across keystrokes. Cache the
// expensive Unicode normalization once per stable model identity, while
// invalidating when any searchable field changes (including mutable test data).
// WeakMap cannot persist across page loads or retain abandoned suggestions.
interface IndexedSuggestion {
  rawBrand: string;
  rawModel: string;
  rawVariant: string | null;
  rawMarket?: string | null;
  rawEngine?: string | null;
  brand: string;
  model: string;
  fullName: string;
  target: string;
}
const suggestionKeyCache = new WeakMap<TractorSuggestion, IndexedSuggestion>();

function indexedSuggestion(item: TractorSuggestion): IndexedSuggestion {
  const cached = suggestionKeyCache.get(item);
  if (cached && cached.rawBrand === item.brand &&
      cached.rawModel === item.model && cached.rawVariant === item.variant &&
      cached.rawMarket === item.market && cached.rawEngine === item.engine) {
    return cached;
  }
  const brand = normalizeTractorQuery(item.brand);
  const model = normalizeTractorQuery(item.model);
  const fullName = brand + " " + model;
  const indexed = {
    rawBrand: item.brand, rawModel: item.model, rawVariant: item.variant,
    rawMarket: item.market, rawEngine: item.engine,
    brand, model, fullName,
    target: [fullName,item.variant || "",item.market || "",item.engine || ""].map(normalizeTractorQuery).join(" "),
  };
  suggestionKeyCache.set(item,indexed);
  return indexed;
}

export function findTractorSuggestions(
  models: readonly TractorSuggestion[], query: string, limit = 6
): TractorSuggestion[] {
  const q = normalizeTractorQuery(query);
  if (!q || !Number.isFinite(limit) || limit <= 0) return [];
  const parts = q.split(/\s+/).filter(Boolean);
  const capacity = Math.floor(limit);
  if(capacity===0)return [];
  type Hit={item:TractorSuggestion;rank:number};
  const compare=(a:Hit,b:Hit)=>a.rank-b.rank ||
    a.item.brand.localeCompare(b.item.brand) ||
    a.item.model.localeCompare(b.item.model) ||
    (a.item.variant || "").localeCompare(b.item.variant || "");
  // The interactive home asks for seven matches. Retain only the best K
  // rather than collecting/sorting thousands of broad matches on each key.
  // For larger requested lists retain the previous stable sort algorithm.
  const bounded=capacity<=32;
  const hits:Hit[]=[];
  for (const item of models) {
    const {brand, model, fullName, target} = indexedSuggestion(item);
    if (!matchesTractorTerms(target, parts)) continue;
    const rank = fullName === q ? 0 : model === q ? 1
      : fullName.startsWith(q) ? 2 : model.startsWith(q) ? 3
      : brand.startsWith(q) ? 4 : fullName.includes(q) ? 5 : 6;
    const hit={item,rank};
    if(!bounded){hits.push(hit);continue;}
    // Upper-bound insertion preserves original catalogue order for exact ties.
    if(hits.length===capacity&&compare(hit,hits[hits.length-1])>=0)continue;
    let lo=0,hi=hits.length;
    while(lo<hi){
      const mid=(lo+hi)>>>1;
      if(compare(hit,hits[mid])<0)hi=mid;
      else lo=mid+1;
    }
    hits.splice(lo,0,hit);
    if(hits.length>capacity)hits.pop();
  }
  if(!bounded)hits.sort(compare);
  return hits.slice(0,capacity).map(({item}) => item);
}
