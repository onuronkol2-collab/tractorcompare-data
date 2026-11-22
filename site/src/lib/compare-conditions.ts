/**
 * Presentation-only gate for manufacturer measurements whose source conditions
 * can denote different configurations or measurement points. Never mutate or
 * silently select a preferred specification. Public measurements retain their
 * original keys, units, contexts and source links.
 */
const CONDITION_SENSITIVE_KEYS = new Set([
  "rear_lift_capacity",
  "overall_height",
  "wheelbase",
]);

export type ComparedMeasurement = {
  context: string | null;
  unit?: string | null;
};

function signature(spec: ComparedMeasurement): string {
  const context = spec.context?.trim().replace(/\s+/g, " ").toLowerCase() || "__unspecified__";
  const unit = spec.unit?.trim().toLowerCase() || "__unspecified__";
  return JSON.stringify([context, unit]);
}

/**
 * A warning is not a verdict that either source is wrong. It means the
 * compared entries do not document identical measurement conditions.
 * Display all source rows; ask the visitor to check configurations first.
 */
export function requiresConditionCaution(
  key: string, left: readonly ComparedMeasurement[], right: readonly ComparedMeasurement[]
): boolean {
  if (!CONDITION_SENSITIVE_KEYS.has(key)) return false;
  const rows = [...left, ...right];
  if (rows.length < 2) return false;
  return new Set(rows.map(signature)).size > 1;
}
