// Device-local research state. Never sent to a server or analytics provider.
export const RESEARCH_KEY = "tractorvs_research_v1";
export const RESEARCH_LIMITS = Object.freeze({ favorites: 40, recent: 20, comparisons: 20 });
const id = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const views = new Set(["all", "shared", "different"]);
const pair = value => value && typeof value === "object" && id(value.left) && id(value.right)
  && value.left !== value.right && views.has(value.view);
const uniqueIds = (items, limit) => Array.isArray(items) ? [...new Set(items.filter(id))].slice(0, limit) : [];
export function normalizeResearch(value) {
  const source = value && typeof value === "object" ? value : {};
  const comparisons = [];
  const seen = new Set();
  if (Array.isArray(source.comparisons)) for (const item of source.comparisons) {
    if (!pair(item)) continue;
    const key = JSON.stringify([item.left, item.right, item.view]);
    if (seen.has(key)) continue;
    seen.add(key);
    comparisons.push({left:item.left, right:item.right, view:item.view});
    if (comparisons.length >= RESEARCH_LIMITS.comparisons) break;
  }
  return {
    favorites: uniqueIds(source.favorites, RESEARCH_LIMITS.favorites),
    recent: uniqueIds(source.recent, RESEARCH_LIMITS.recent),
    comparisons,
  };
}
export function readResearch(storage) {
  const raw = storage.getItem(RESEARCH_KEY);
  if (!raw || raw.length > 30000) return normalizeResearch(null);
  try { return normalizeResearch(JSON.parse(raw)); } catch { return normalizeResearch(null); }
}
export function writeResearch(storage, state) {
  const clean = normalizeResearch(state);
  storage.setItem(RESEARCH_KEY, JSON.stringify(clean));
  return clean;
}
export function toggleFavorite(state, model) {
  const clean = normalizeResearch(state);
  if (!id(model)) return clean;
  return normalizeResearch({...clean, favorites:clean.favorites.includes(model)
    ? clean.favorites.filter(x=>x!==model) : [model,...clean.favorites]});
}
export function rememberModel(state, model) {
  const clean = normalizeResearch(state);
  return id(model) ? normalizeResearch({...clean,recent:[model,...clean.recent.filter(x=>x!==model)]}) : clean;
}
export function saveComparison(state, comparison) {
  const clean = normalizeResearch(state);
  return pair(comparison) ? normalizeResearch({...clean,comparisons:[comparison,...clean.comparisons]}) : clean;
}
export function removeComparison(state, comparison) {
  const clean = normalizeResearch(state);
  return normalizeResearch({...clean,comparisons:clean.comparisons.filter(x=>
    x.left!==comparison.left||x.right!==comparison.right||x.view!==comparison.view)});
}
export function availableResearch(state, publishedIds) {
  const clean = normalizeResearch(state);
  return {...clean, favorites:clean.favorites.filter(x=>publishedIds.has(x)),
    recent:clean.recent.filter(x=>publishedIds.has(x)),
    comparisons:clean.comparisons.filter(x=>publishedIds.has(x.left)&&publishedIds.has(x.right))};
}
