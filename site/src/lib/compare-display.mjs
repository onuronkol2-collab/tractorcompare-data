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
