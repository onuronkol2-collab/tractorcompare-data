/**
 * Normalize catalog queries for accent-insensitive brand and model searches.
 * Preserves non-Latin scripts for the ten localized interfaces.
 * The original model identity is never changed or stored in normalized form.
 */
export function normalizeTractorQuery(value: string): string {
  return value.trim().normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
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
  year: number | null;
  horsepower: number | null;
  specs: number;
  url: string;
}
export function findTractorSuggestions(
  models: readonly TractorSuggestion[], query: string, limit = 6
): TractorSuggestion[] {
  const q = normalizeTractorQuery(query);
  if (!q || !Number.isFinite(limit) || limit <= 0) return [];
  const parts = q.split(/\s+/).filter(Boolean);
  const hits: Array<{item:TractorSuggestion;rank:number}> = [];
  for (const item of models) {
    const brand = normalizeTractorQuery(item.brand);
    const model = normalizeTractorQuery(item.model);
    const fullName = brand + " " + model;
    const target = fullName + " " + normalizeTractorQuery(item.variant || "");
    if (!matchesTractorTerms(target, parts)) continue;
    const rank = fullName === q ? 0 : model === q ? 1
      : fullName.startsWith(q) ? 2 : model.startsWith(q) ? 3
      : brand.startsWith(q) ? 4 : fullName.includes(q) ? 5 : 6;
    hits.push({item,rank});
  }
  hits.sort((a,b) => a.rank-b.rank ||
    a.item.brand.localeCompare(b.item.brand) ||
    a.item.model.localeCompare(b.item.model) ||
    (a.item.variant || "").localeCompare(b.item.variant || ""));
  return hits.slice(0,Math.floor(limit)).map(({item}) => item);
}
