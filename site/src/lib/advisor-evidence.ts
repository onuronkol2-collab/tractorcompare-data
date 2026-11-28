/**
 * Evidence-only facts for the tractor selection assistant.
 * They explain what is documented; they NEVER certify equipment compatibility.
 * The full catalogue stays in Astro build memory. Only a small reviewed subset
 * reaches the browser, keeping pages fast and avoiding unpublished data.
 */
import {
  officialManufacturerSourceUrl, reviewedIndependentSourceUrl,
  type TractorRecord, type PublicSpec,
} from "./catalog.ts";
import type { FarmInputs } from "./farm-advisor.ts";

export type AdvisorFactKind =
  "pto" | "rearLift" | "hydraulicService" | "hydraulicMain" |
  "width" | "transmission" | "drivetrain";

export interface AdvisorFact {
  kind: AdvisorFactKind;
  value: string;
  unit: string | null;
  sourceUrl: string;
  provenance: "manufacturer" | "independent";
}

const CANONICAL_FACTS: Record<string, AdvisorFactKind> = {
  pto_speeds: "pto",
  rear_pto_speeds: "pto",
  rear_lift_capacity: "rearLift",
  hydraulic_service_flow_standard_lpm: "hydraulicService",
  hydraulic_main_flow: "hydraulicMain",
  overall_width: "width",
  transmission_type: "transmission",
  drivetrain: "drivetrain",
};

const ORDER: AdvisorFactKind[] = [
  "pto", "rearLift", "hydraulicService", "hydraulicMain",
  "width", "transmission", "drivetrain",
];

function safeValue(spec: PublicSpec, kind: AdvisorFactKind): string | null {
  const value = String(spec.spec_value || "").trim().replace(/\s+/g, " ");
  const unit = (spec.unit || "").trim().toLowerCase();
  if (!value || value.length > 100) return null;
  if (kind === "pto")
    return unit === "rpm" && /^[\d\s/,Ee+.()-]+$/.test(value) ? value : null;
  if (kind === "rearLift")
    return unit === "kg" && /^\d{1,6}(?:[.,]\d{1,2})?$/.test(value) ? value : null;
  if (kind === "hydraulicService" || kind === "hydraulicMain")
    return ["l/min", "lpm"].includes(unit) && /^\d{1,4}(?:[.,]\d{1,2})?$/.test(value)
      ? value : null;
  if (kind === "width")
    return unit === "mm" && /^\d{2,5}(?:[.,]\d{1,2})?$/.test(value) ? value : null;
  if (kind === "drivetrain")
    return /^(?:2wd|4wd|mfwd)$/i.test(value) ? value : null;
  // Transmission type is descriptive, not a numerical fitness metric.
  return value.length <= 90 && !/[<>]/.test(value) ? value : null;
}

function measurementIdentity(spec: PublicSpec, value: string): string {
  return [
    value.toLowerCase().replace(/\s+/g, ""),
    (spec.unit || "").trim().toLowerCase(),
    (spec.measurement_standard || "").trim().toLowerCase(),
    spec.rated_rpm ?? "",
  ].join("|");
}

/**
 * Fail closed on different values or measurement conditions for the SAME
 * evidence category. Source host and evidence guards are shared with the
 * public model detail pages, not freshly guessed here.
 */
export function extractAdvisorFacts(
  tractor: Pick<TractorRecord, "brand_name" | "specifications">,
): AdvisorFact[] {
  const candidates = new Map<AdvisorFactKind, {
    fact: AdvisorFact; identity: string;
  }[]>();

  for (const spec of tractor.specifications) {
    const key=(spec.canonical_key || "").trim();
    if (!Object.hasOwn(CANONICAL_FACTS,key)) continue;
    const kind = CANONICAL_FACTS[key];
    const value = safeValue(spec, kind);
    if (!value) continue;
    const official = officialManufacturerSourceUrl(spec, tractor.brand_name);
    const independent = official ? null : reviewedIndependentSourceUrl(spec);
    const sourceUrl = official || independent;
    if (!sourceUrl) continue;
    const item = {
      fact: {
        kind, value, unit: spec.unit,
        sourceUrl, provenance: official ? "manufacturer" as const : "independent" as const,
      },
      identity: measurementIdentity(spec, value),
    };
    candidates.set(kind, [...(candidates.get(kind) || []), item]);
  }

  const verified: AdvisorFact[] = [];
  for (const kind of ORDER) {
    const group = candidates.get(kind) || [];
    if (!group.length || new Set(group.map(item => item.identity)).size !== 1) continue;
    group.sort((a,b) =>
      (a.fact.provenance === "manufacturer" ? 0 : 1)
      - (b.fact.provenance === "manufacturer" ? 0 : 1)
      || a.fact.sourceUrl.localeCompare(b.fact.sourceUrl));
    verified.push(group[0].fact);
  }
  return verified;
}

/** Select facts related to stated work, never a claim of confirmed fitment. */
export function selectAdvisorFacts(
  facts: AdvisorFact[], input: FarmInputs, limit = 3,
): AdvisorFact[] {
  const max=Number.isFinite(limit)?Math.max(0,Math.min(3,Math.trunc(limit))):0;
  if(max===0)return [];
  const tools = new Set(input.implements || []);
  const wanted: AdvisorFactKind[] = [];
  if (["rotavator", "mower", "baler", "sprayer"].some(tool => tools.has(tool as never)))
    wanted.push("pto");
  if (tools.has("plow") || tools.has("cultivator"))
    wanted.push("rearLift");
  if (tools.has("front_loader") || tools.has("laser_leveler"))
    wanted.push("hydraulicService", "hydraulicMain");
  if (input.crop === "orchard" || input.crop === "vineyard")
    wanted.push("width");
  if (input.terrain !== "flat") wanted.push("drivetrain");
  if (input.annualHours >= 800) wanted.push("transmission");
  if (!wanted.length) wanted.push("transmission", "drivetrain");

  const matches: AdvisorFact[] = [];
  const byKind = new Map(facts.map(f => [f.kind, f]));
  for (const kind of wanted) {
    if (kind === "hydraulicMain" && matches.some(f => f.kind === "hydraulicService"))
      continue; // distinct measures; one context-rich hydraulic fact per card
    const fact = byKind.get(kind);
    if (fact && !matches.includes(fact)) matches.push(fact);
    if (matches.length >= max) break;
  }
  return matches;
}
