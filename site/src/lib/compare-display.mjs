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

