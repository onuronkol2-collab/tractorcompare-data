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

// Keep focus on the editable combobox via aria-activedescendant.
export function nextComparisonOption(active, count, direction) {
  if (count < 1) return -1;
  if (active < 0 || active >= count) return direction === 1 ? 0 : count - 1;
  return (active + direction + count) % count;
}
