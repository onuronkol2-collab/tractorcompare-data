import { comparisonKey, officialManufacturerSourceUrl, reviewedIndependentSourceUrl, specLabel, verificationNotice, type TractorRecord } from "./catalog.ts";
import type { Locale } from "./locales.ts";

export function comparisonSpecs(tractor: TractorRecord, lang: Locale) {
  const rows = tractor.specifications.map(spec => {
    const official = officialManufacturerSourceUrl(spec, tractor.brand_name);
    const independent = official ? null : reviewedIndependentSourceUrl(spec);
    return {
      key: comparisonKey(spec), label: specLabel(spec, lang),
      value: spec.spec_value, unit: spec.unit, context: spec.measurement_standard,
      rpm: spec.rated_rpm, source: official || independent, independent: Boolean(independent),
      notice: verificationNotice(spec, lang),
    };
  });
  // Suppress only a redundant summary of the same value, unit, speed and citation.
  // Distinct conditions, warnings and source documents remain individually visible.
  return rows.filter((row, index) => !rows.some((other, j) => j !== index &&
    row.key === other.key && row.value === other.value && row.unit === other.unit &&
    row.independent === other.independent && row.rpm === other.rpm && row.source === other.source && row.notice === other.notice &&
    ((!row.context && Boolean(other.context)) || (row.context === other.context && j < index))
  ));
}
