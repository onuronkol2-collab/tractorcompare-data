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
