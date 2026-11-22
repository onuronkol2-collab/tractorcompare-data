import { comparisonKey, officialManufacturerSourceUrl, reviewedIndependentSourceUrl, specLabel, verificationNotice, type TractorRecord } from "./catalog.ts";
import type { Locale } from "./locales.ts";
import {modelSourceDiscrepancies,isUnresolvedComparisonSpec} from "./manufacturer-conflicts.mjs";

export function comparisonSpecs(tractor: TractorRecord, lang: Locale) {
  const rows = tractor.specifications.filter(spec => !isUnresolvedComparisonSpec(tractor,spec)).map(spec => {
    const official = officialManufacturerSourceUrl(spec, tractor.brand_name);
    const independent = official ? null : reviewedIndependentSourceUrl(spec);
    return {
      key: comparisonKey(spec), label: specLabel(spec, lang),
      value: spec.spec_value, unit: spec.unit, context: spec.measurement_standard,
      rpm: spec.rated_rpm, source: official || independent, independent: Boolean(independent),
      notice: verificationNotice(spec, lang),
    };
  });
  // Surface unresolved OEM discrepancies even when disputed numbers are hidden.
  const unresolved=modelSourceDiscrepancies(tractor,lang);
  if(rows.length && unresolved.length){
    rows[0].notice=[rows[0].notice,...unresolved.map(item=>item.message)]
      .filter(Boolean).join(" ");
  }
  // Suppress only a redundant summary of the same value, unit, speed and citation.
  // Distinct conditions, warnings and source documents remain individually visible.
  return rows.filter((row, index) => !rows.some((other, j) => j !== index &&
    row.key === other.key && row.value === other.value && row.unit === other.unit &&
    row.independent === other.independent && row.rpm === other.rpm && row.source === other.source && row.notice === other.notice &&
    ((!row.context && Boolean(other.context)) || (row.context === other.context && j < index))
  ));
}
