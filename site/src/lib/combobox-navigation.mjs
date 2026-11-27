// Keep focus on the editable combobox via aria-activedescendant.
export function nextComboboxOption(active, count, direction) {
  if (!Number.isSafeInteger(count) || count < 1 || (direction !== 1 && direction !== -1)) return -1;
  if (!Number.isSafeInteger(active) || active < 0 || active >= count) return direction === 1 ? 0 : count - 1;
  return direction === 1 ? (active === count - 1 ? 0 : active + 1) : (active === 0 ? count - 1 : active - 1);
}
