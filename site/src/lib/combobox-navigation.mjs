// Keep focus on the editable combobox via aria-activedescendant.
export function nextComboboxOption(active, count, direction) {
  if (count < 1) return -1;
  if (active < 0 || active >= count) return direction === 1 ? 0 : count - 1;
  return (active + direction + count) % count;
}
