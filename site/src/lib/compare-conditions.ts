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

/**
 * Transmission gear counts/ranges are not measurements and must never reuse
 * the lift/height/wheelbase measurement warning. Only configurations explicitly
 * identified by manufacturer context can trigger this presentation-only note.
 */
const TRANSMISSION_OPTION_KEYS = new Set([
  "forward_gears",
  "reverse_gears",
  "transmission_gear_configuration",
]);
const TRANSMISSION_CONTEXT = /\b(?:hst|hydrostatic|hydrostat|mechanical|manual|powershift|power-shift|shuttle|ss|cvt)\b|\bdyna[\s-]?[46]\b/i;

export function requiresTransmissionCaution(
  key: string, left: readonly ComparedMeasurement[], right: readonly ComparedMeasurement[]
): boolean {
  if (!TRANSMISSION_OPTION_KEYS.has(key)) return false;
  const rows = [...left, ...right];
  if (rows.length < 2) return false;
  // A different count alone does not prove a different configuration.
  // At least one source must explicitly name a transmission option.
  if (!rows.some(spec => TRANSMISSION_CONTEXT.test(spec.context || ""))) return false;
  return new Set(rows.map(signature)).size > 1;
}
