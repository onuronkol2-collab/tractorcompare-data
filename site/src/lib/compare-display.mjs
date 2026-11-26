// Presentation only: compare the displayed value, unit, condition and RPM.
// This is NOT a normalized measurement, equivalence or performance judgment.
export function differentPublishedEntries(left, right) {
  if (!left.length || !right.length) return false;
  const signatures = entries => entries.map(spec => JSON.stringify([
    spec.value, spec.unit ?? null, spec.context ?? null, spec.rpm ?? null,
    spec.notice ?? null,
  ])).sort();
  const a = signatures(left), b = signatures(right);
  return a.length !== b.length || a.some((entry, index) => entry !== b[index]);
}


// Malformed successful HTTP responses must follow the same recovery path as network errors.
export function isPublishedSpecList(payload) {
  const nullableString = value => value == null || typeof value === "string";
  return Array.isArray(payload) && payload.every(spec =>
    spec !== null && typeof spec === "object" &&
    typeof spec.key === "string" && spec.key.trim().length > 0 &&
    typeof spec.label === "string" && typeof spec.value === "string" &&
    ["unit","context","source","notice"].every(key=>nullableString(spec[key])) &&
    (spec.rpm == null || (typeof spec.rpm === "number" && Number.isFinite(spec.rpm))));
}

// Copy only the active comparison state. Never propagate tracking, unknown
// query parameters, fragments, or URL credentials into the share link.
export function comparisonShareUrl(href, left, right, view = "all") {
  if (typeof left !== "string" || typeof right !== "string" || !left || !right || left === right) return null;
  try {
    const url = new URL(href);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    if (!["all", "shared", "different"].includes(view)) return null;
    url.username = ""; url.password = ""; url.hash = ""; url.search = "";
    url.searchParams.set("left", left); url.searchParams.set("right", right);
    if (view !== "all") url.searchParams.set("view", view);
    return url.href;
  } catch { return null; }
}
