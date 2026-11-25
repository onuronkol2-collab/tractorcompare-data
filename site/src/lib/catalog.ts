import { REVIEWED_TURKISH_SOURCE_LABELS_EN } from "./reviewed-turkish-source-labels-en.ts";
import type { Locale } from "./locales.ts";
import { localizedCategoryName, localizedSpecificationName } from "./spec-i18n.ts";
import { oem20261122SpecLabel } from "./oem-20261122-spec-labels.ts";
import { publishedSpecificationLabel, auditedResidualSpecificationLabel } from "./published-spec-translations.ts";

export interface PublicSpec {
  spec_id: string;
  spec_name: string;
  spec_value: string;
  unit: string | null;
  canonical_key: string | null;
  comparison_class: string | null;
  measurement_standard: string | null;
  rated_rpm: number | null;
  evidence_text: string | null;
  verified_at: string | null;
  source_publisher: string | null;
  source_url: string | null;
  source_type: string | null;
  source_accessed_at: string | null;
  spec_source_priority: number | null;
}

export interface TractorRecord {
  tractor_id: string;
  slug: string;
  brand_name: string;
  brand_country: string | null;
  brand_website_url: string | null;
  model_name: string;
  model_year: number | null;
  variant: string | null;
  market: string | null;
  horsepower: number | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  weight_kg: number | null;
  specifications: PublicSpec[];
}

interface PublicSpecRow extends Omit<PublicSpec, "spec_id" | "spec_name" | "spec_value"> {
  spec_id: string | null;
  spec_name: string | null;
  spec_value: string | null;
  tractor_id: string;
  brand_name: string;
  brand_country: string | null;
  brand_website_url: string | null;
  model_name: string;
  model_year: number | null;
  variant: string | null;
  market: string | null;
  horsepower: number | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  weight_kg: number | null;
}

export interface PublicCatalog {
  configured: boolean;
  tractors: TractorRecord[];
}

let catalogPromise: Promise<PublicCatalog> | undefined;

function slugPart(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s")
    .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalise(value: unknown): string {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Keep punctuation in measured values. Stripping punctuation would make
 * different numbers or gear ratios look identical (5.3 vs 53, 16F/8R vs
 * 16F8R). Normalize only case, accents and superficial whitespace.
 */
function normaliseMeasuredText(value: unknown): string {
  return String(value ?? "").normalize("NFKC").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .trim().replace(/\s+/g, " ")
    .replace(/\s*([/,:;|+\-–—])\s*/g, "$1");
}

/**
 * A conservative identity for display-only deduplication: do not conflate
 * distinct measurement values, units, contexts or rated engine speeds.
 */
export function specificationIdentity(
  spec: Pick<PublicSpec,
    "canonical_key" | "spec_name" | "spec_value" |
    "unit" | "measurement_standard" | "rated_rpm">
): string {
  return JSON.stringify([
    normalise(spec.canonical_key || spec.spec_name),
    normaliseMeasuredText(spec.spec_value),
    normaliseMeasuredText(spec.unit),
    normaliseMeasuredText(spec.measurement_standard),
    spec.rated_rpm,
  ]);
}

function scoreSpec(spec: PublicSpec): number {
  return Number(spec.spec_source_priority ?? 0) * 100
    + (spec.evidence_text?.trim() ? 50 : 0)
    + (spec.source_url ? 25 : 0)
    + (spec.verified_at ? 10 : 0)
    + (spec.source_type === "official_product_page" ? 5 : 0);
}

function timestampScore(value: string | null): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function stableTextCompare(left: string | null, right: string | null): number {
  const a = left ?? "";
  const b = right ?? "";
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Lower-ranked values win. The final spec_id comparison guarantees the same
 * representative is selected even when every quality signal is tied.
 */
function compareSpecQuality(a: PublicSpec, b: PublicSpec): number {
  const scoreDifference = scoreSpec(b) - scoreSpec(a);
  if (scoreDifference !== 0) return scoreDifference;

  const verifiedDifference = timestampScore(b.verified_at) - timestampScore(a.verified_at);
  if (verifiedDifference !== 0) return verifiedDifference;

  const evidenceLengthDifference =
    (b.evidence_text?.trim().length ?? 0) - (a.evidence_text?.trim().length ?? 0);
  if (evidenceLengthDifference !== 0) return evidenceLengthDifference;

  const sourceTypeRank: Record<string, number> = {
    manufacturer_specification: 4,
    official_product_page: 3,
    manufacturer: 2,
    technical_report: 1,
    independent_test: 1,
  };
  const sourceTypeDifference =
    (sourceTypeRank[b.source_type ?? ""] ?? 0)
    - (sourceTypeRank[a.source_type ?? ""] ?? 0);
  if (sourceTypeDifference !== 0) return sourceTypeDifference;

  const sourceUrlDifference = stableTextCompare(a.source_url, b.source_url);
  if (sourceUrlDifference !== 0) return sourceUrlDifference;

  return stableTextCompare(a.spec_id, b.spec_id);
}

/**
 * Suppress only exact semantic duplicates. Different units, measurement
 * standards or rated RPM values remain separate because they may describe
 * legitimately different measurements. A deterministic quality comparator
 * selects the same best-supported row on every build.
 */
function deduplicateSpecs(specifications: PublicSpec[]): PublicSpec[] {
  const bestByIdentity = new Map<string, PublicSpec>();

  for (const candidate of specifications) {
    const identity = specificationIdentity(candidate);

    const currentBest = bestByIdentity.get(identity);
    if (!currentBest || compareSpecQuality(candidate, currentBest) < 0) {
      bestByIdentity.set(identity, candidate);
    }
  }

  return [...bestByIdentity.values()]
    .map((spec) => ({ ...spec, source_url: safeHttpUrl(spec.source_url) }))
    .sort((a, b) =>
      (a.comparison_class || "other").localeCompare(b.comparison_class || "other")
      || a.spec_name.localeCompare(b.spec_name)
      || a.spec_id.localeCompare(b.spec_id)
    );
}

/**
 * Read-only presentation bridge for the existing public catalogue. Some
 * published models have source-backed engine-power specifications but no
 * value in tractors.horsepower; this safely surfaces those facts for catalogue
 * cards and the land-area advisor without writing to Supabase.
 *
 * Manufacturer-stated engine power (rated or gross) only: never mistake PTO power,
 * kW or a model name for rated horsepower. Conflicting values fail closed.
 */
export function sourceBackedHorsepower(
  specs: Pick<PublicSpec, "canonical_key" | "spec_name" | "spec_value" |
    "unit" | "source_url" | "evidence_text" | "verified_at">[]
): number | null {
  const values: number[] = [];
  const acceptable = new Set(["engine_power", "engine_rated_power", "rated_engine_power", "engine_gross_power"]);
  // Some manufacturer pages say "Engine HP" while actually providing a broad
  // power CATEGORY. A mistakenly flattened endpoint must never be promoted to
  // an exact number in model cards, search, SEO or adviser recommendations.
  const categoryOrRange = /\b(?:power|hp)\s*(?:category|class|range)\b|\bengine\s*(?:power|hp)\s*[:–\-]?\s*\d+(?:[.,]\d+)?\s*[-–—]\s*\d+(?:[.,]\d+)?/i;
  for (const spec of specs) {
    const key = (spec.canonical_key || "").trim().toLowerCase();
    const genericName = (spec.spec_name || "").trim().toLowerCase();
    if (!acceptable.has(key) && !(key === "" &&
      ["engine power","rated engine power","nominal engine power"].includes(genericName))) continue;
    if (categoryOrRange.test((spec.spec_name || "") + " " + (spec.evidence_text || ""))) continue;
    if (!/^(hp|bhp)$/i.test((spec.unit || "").trim())) continue;
    if (!spec.evidence_text?.trim() || !spec.verified_at || !safeHttpUrl(spec.source_url)) continue;
    const raw = (spec.spec_value || "").trim();
    if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(raw)) continue;
    const value = Number(raw.replace(",","."));
    if (Number.isFinite(value) && value >= 5 && value <= 999) values.push(value);
  }
  if (!values.length) return null;
  // 75 vs 75.0 is equivalent; 74.5 vs 75 is a substantive conflict.
  return values.every((value) => Math.abs(value - values[0]) < 0.000001)
    ? values[0] : null;
}

/**
 * Published HP must be supported by the model's visible, evidence-verified specs.
 * The legacy header may be absent, unsourced, a marketing model number, or a
 * different power standard. Never silently equate rated and boost figures.
 * This display-only guard does not modify the original database field.
 */
export function publishedHorsepower(
  tractor: Pick<TractorRecord, "horsepower" | "specifications">
): number | null {
  return sourceBackedHorsepower(tractor.specifications);
}

function getPublicApiKey(): { key: string; isLegacyJwt: boolean } {
  const key = (
    process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || ""
  ).trim();

  if (!key) throw new Error("Set SUPABASE_PUBLISHABLE_KEY (or the legacy SUPABASE_ANON_KEY) as a build variable.");

  if (key.startsWith("sb_secret_")) {
    throw new Error("A Supabase secret key was provided. Use a publishable key only.");
  }

  const parts = key.split(".");
  if (parts.length === 3) {
    try {
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")));
      if (decoded.role !== "anon") {
        throw new Error("The Supabase JWT must use the anon role. Service-role or authenticated keys are not allowed.");
      }
      return { key, isLegacyJwt: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes("must use the anon role")) throw error;
      throw new Error("The Supabase JWT key could not be validated. Use the project's anon or publishable key.");
    }
  }

  if (!key.startsWith("sb_publishable_")) {
    throw new Error("Use a Supabase publishable key or the legacy anon key. Secret keys are not allowed.");
  }

  return { key, isLegacyJwt: false };
}

/**
 * Load every published catalogue row. Use PostgREST's explicit offset/limit
 * instead of mixing query limit with HTTP Range headers. The first page
 * requests an exact count so an exact multiple of the page size (e.g. 1000)
 * cannot cause a final out-of-range request (PGRST103/HTTP 416).
 *
 * Inconsistent counts/ranges fail closed: never publish a partial catalogue.
 */
export async function fetchPublicRows(endpoint: URL, apiKey: string, isLegacyJwt: boolean): Promise<unknown[]> {
  const allRows: unknown[] = [];
  const pageSize = 500;
  const maximumRows = 50_000;
  let knownTotal: number | null = null;
  let offset = 0;

  while (offset < maximumRows) {
    const pageUrl = new URL(endpoint);
    pageUrl.searchParams.set("limit", String(pageSize));
    pageUrl.searchParams.set("offset", String(offset));

    const headers: Record<string, string> = {
      apikey: apiKey,
      Accept: "application/json",
    };
    if (offset === 0) headers.Prefer = "count=exact";
    // A legacy anon JWT may also be used as Authorization. Opaque publishable
    // keys are not JWTs. Never use a service-role or secret key.
    if (isLegacyJwt) headers.Authorization = "Bearer " + apiKey;

    const response = await fetch(pageUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        "Supabase public catalogue request failed with HTTP " + response.status
        + " at offset " + offset
        + ". Check public-view pagination, grants, and Cloudflare build variables."
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new Error("Supabase public catalogue returned an unexpected response at offset " + offset + ".");
    }
    if (payload.length > pageSize) {
      throw new Error("Supabase public catalogue exceeded page size at offset " + offset + ".");
    }

    const contentRange = response.headers.get("content-range")?.trim() ?? "";
    if (offset === 0) {
      const countMatch = contentRange.match(/\/(\d+)$/);
      if (!countMatch) {
        throw new Error("Supabase public catalogue did not provide an exact total count on the first page.");
      }
      knownTotal = Number(countMatch[1]);
      if (!Number.isSafeInteger(knownTotal) || knownTotal < 0) {
        throw new Error("Supabase public catalogue returned an invalid total count.");
      }
      if (knownTotal >= maximumRows) {
        throw new Error("The public catalogue reached the 50,000-row build limit. Review pagination before building.");
      }
    }

    if (payload.length) {
      const rowRange = contentRange.match(/^(\d+)-(\d+)\/(?:\d+|\*)$/);
      if (!rowRange || Number(rowRange[1]) !== offset ||
          Number(rowRange[2]) !== offset + payload.length - 1) {
        throw new Error("Supabase public catalogue returned an inconsistent row range at offset " + offset + ".");
      }
    }

    if (knownTotal === null || offset + payload.length > knownTotal ||
        (payload.length === 0 && offset < knownTotal)) {
      throw new Error("Supabase public catalogue count changed during the build; retry a new build.");
    }

    allRows.push(...payload);
    offset += payload.length;
    if (offset === knownTotal) return allRows;

    // Server-side page size may be lower than 500: advance by actual rows.
    if (payload.length === 0) {
      throw new Error("Supabase catalogue stopped before the expected record count.");
    }
  }

  throw new Error("The public catalogue reached the 50,000-row build limit; no partial site was generated.");
}

/**
 * Database editors can publish an already-reviewed spec while PostgREST is
 * paging through the public view. Re-read the ENTIRE result once if (and only
 * if) its reported row count moved; never reuse rows from the failed attempt.
 * Persistent count drift and all other data / network errors remain hard
 * build failures. No writes, elevated keys, guessed values or partial pages.
 */
export async function fetchPublicRowsWithCountDriftRetry(
  endpoint:URL, apiKey:string, isLegacyJwt:boolean
):Promise<unknown[]>{
  try {
    return await fetchPublicRows(endpoint,apiKey,isLegacyJwt);
  } catch (error) {
    if (!(error instanceof Error) ||
        error.message!=="Supabase public catalogue count changed during the build; retry a new build.")
      throw error;
    console.warn("[TractorVS] Published catalogue count changed between pages; restarting the complete read once.");
    // The failed call's rows were scoped to fetchPublicRows and discarded.
    // A second mismatch still throws, blocking the build rather than hiding it.
    return await fetchPublicRows(endpoint,apiKey,isLegacyJwt);
  }
}

async function loadPublicCatalog(): Promise<PublicCatalog> {
  const rawUrl = (process.env.SUPABASE_URL || "").trim();
  const rawKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || ""
  ).trim();

  if (!rawUrl && !rawKey) return { configured: false, tractors: [] };
  if (!rawUrl || !rawKey) {
    throw new Error("Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or legacy SUPABASE_ANON_KEY).");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    throw new Error("SUPABASE_URL is not a valid URL.");
  }
  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
    throw new Error("SUPABASE_URL must be an HTTPS URL without embedded credentials.");
  }

  const apiKey = getPublicApiKey();
  const endpoint = new URL("/rest/v1/tractorvs_public_specs", baseUrl);
  endpoint.searchParams.set("select", [
    "tractor_id", "brand_name", "brand_country", "brand_website_url",
    "model_name", "model_year", "variant", "market", "horsepower",
    "engine", "transmission", "drivetrain", "weight_kg", "spec_id",
    "spec_name", "spec_value", "unit", "canonical_key", "comparison_class",
    "measurement_standard", "rated_rpm", "evidence_text", "verified_at",
    "source_publisher", "source_url", "source_type", "source_accessed_at",
    "spec_source_priority",
  ].join(","));
  endpoint.searchParams.set("order", "brand_name.asc,model_name.asc,tractor_id.asc,spec_id.asc");

  const payload = await fetchPublicRowsWithCountDriftRetry(endpoint, apiKey.key, apiKey.isLegacyJwt);
  const groups = new Map<string, TractorRecord>();

  for (const rawRow of payload) {
    const row = rawRow as PublicSpecRow;
    if (!row || typeof row.tractor_id !== "string" || !row.model_name || !row.brand_name) continue;

    let tractor = groups.get(row.tractor_id);
    if (!tractor) {
      tractor = {
        tractor_id: row.tractor_id,
        slug: (slugPart(row.brand_name + "-" + row.model_name) || "tractor")
          + "-" + row.tractor_id.slice(0, 8),
        brand_name: row.brand_name,
        brand_country: row.brand_country ?? null,
        brand_website_url: safeHttpUrl(row.brand_website_url),
        model_name: row.model_name,
        model_year: row.model_year ?? null,
        variant: row.variant ?? null,
        market: row.market ?? null,
        horsepower: row.horsepower ?? null,
        engine: row.engine ?? null,
        transmission: row.transmission ?? null,
        drivetrain: row.drivetrain ?? null,
        weight_kg: row.weight_kg ?? null,
        specifications: [],
      };
      groups.set(row.tractor_id, tractor);
    }

    // The public SQL view uses LEFT JOIN for specs, so a published model with
    // no specifications can still appear in the catalogue without fake values.
    if (typeof row.spec_id !== "string" || typeof row.spec_name !== "string"
      || typeof row.spec_value !== "string") continue;

    tractor.specifications.push({
      spec_id: row.spec_id,
      spec_name: row.spec_name,
      spec_value: row.spec_value,
      unit: row.unit ?? null,
      canonical_key: row.canonical_key ?? null,
      comparison_class: row.comparison_class ?? null,
      measurement_standard: row.measurement_standard ?? null,
      rated_rpm: row.rated_rpm ?? null,
      evidence_text: row.evidence_text ?? null,
      verified_at: row.verified_at ?? null,
      source_publisher: row.source_publisher ?? null,
      source_url: safeHttpUrl(row.source_url),
      source_type: row.source_type ?? null,
      source_accessed_at: row.source_accessed_at ?? null,
      spec_source_priority: row.spec_source_priority ?? null,
    });
  }

  const tractors = [...groups.values()].map((tractor) => {
    const specifications = deduplicateSpecs(tractor.specifications);
    return {
      ...tractor,
      // The historical headline field may encode a model designation or boosted power.
      // Only an exact, source-backed published HP measurement can appear in summaries.
      horsepower: publishedHorsepower({ ...tractor, specifications }),
      specifications,
    };
  }).sort((a, b) =>
    a.brand_name.localeCompare(b.brand_name)
    || a.model_name.localeCompare(b.model_name)
  );

  return { configured: true, tractors };
}

export function getPublicCatalog(): Promise<PublicCatalog> {
  catalogPromise ??= loadPublicCatalog();
  return catalogPromise;
}

const categoryLabels: Record<string, { en: string; tr: string }> = {
  engine: { en: "Engine & power", tr: "Motor ve güç" },
  transmission: { en: "Transmission", tr: "Şanzıman" },
  hydraulics: { en: "Hydraulics", tr: "Hidrolik" },
  capacities: { en: "Capacities", tr: "Kapasiteler" },
  dimensions_weights: { en: "Dimensions & weight", tr: "Boyutlar ve ağırlık" },
  power_take_off: { en: "Power take-off (PTO)", tr: "Kuyruk mili (PTO)" },
  powertrain: { en: "Driveline", tr: "Aktarma organları" },
  implements: { en: "Implements & linkage", tr: "Ekipman ve askı sistemi" },
};

/**
 * Only verified, semantically identical comparison keys are grouped together.
 * No database records or source measurements are modified.
 * Rated/maximum power and different hydraulic measurements remain distinct.
 */
const comparisonKeyAliases: Record<string, string> = {
  forward_gears: "transmission_forward_gears",
  reverse_gears: "transmission_reverse_gears",
  // Resolved after the exact reviewed canonical engineering label dictionary.
  engine_displacement_cc: "engine_displacement",
  engine_displacement_l: "engine_displacement",
  engine_max_torque_nm: "engine_max_torque",
  rear_tyre: "rear_tire_size",
  front_tyre: "front_tire_size",
  adblue_capacity: "adblue_tank_capacity",
  emission_standard: "engine_emission_standard",
  emission_stage: "engine_emission_standard",
  engine_emission_stage: "engine_emission_standard",
  engine_manufacturer: "engine_make",
  engine_rated_power_hp: "engine_rated_power",
  rear_hitch_lift_capacity_kg: "rear_lift_capacity",
  rear_lift_capacity_kg: "rear_lift_capacity",
  air_filter_type: "engine_air_cleaner",
  air_cleaner: "engine_air_cleaner",
  rear_pto_standard_speeds: "pto_speeds",
  rear_pto_options: "pto_speeds",
  rear_pto_speeds: "pto_speeds",
  rated_engine_speed: "engine_rated_speed",
  wheelbase_mm: "wheelbase",
};

export function comparisonKey(spec: Pick<PublicSpec, "canonical_key" | "spec_name">): string {
  const key = spec.canonical_key?.trim() || spec.spec_name.trim();
  return comparisonKeyAliases[key] ?? key;
}

const rawSpecNameLabels: Record<string, { en: string; tr: string }> = {
  "Kuyruk Mili Devri (Motor Devri)": {
    en: "PTO speed (engine RPM)",
    tr: "Kuyruk mili devri (motor devri)",
  },
};

const specLabels: Record<string, { en: string; tr: string }> = {
  alternator_current: { en: "Alternator current", tr: "Alternatör akımı" },
  // Measured-frequency public canonical keys, translation-safe and measurement-aware.
  engine_max_torque: {"en":"Maximum engine torque","tr":"Azami motor torku"},
  service_interval_hours: {"en":"Service interval (hours)","tr":"Bakım aralığı (saat)"},
  engine_boost_power_hp: {"en":"Engine power with boost (HP)","tr":"Güç artırımıyla motor gücü (HP)"},
  engine_boost_power_kw: {"en":"Engine power with boost (kW)","tr":"Güç artırımıyla motor gücü (kW)"},
  engine_boost_max_torque: {"en":"Maximum engine torque with boost","tr":"Güç artırımıyla azami motor torku"},
  fuel_tank_capacity_basic: {"en":"Standard fuel tank capacity","tr":"Standart yakıt deposu kapasitesi"},
  fuel_tank_capacity_steel_tank: {"en":"Steel fuel tank capacity","tr":"Çelik yakıt deposu kapasitesi"},
  maximum_permitted_mass: {"en":"Maximum permitted mass","tr":"İzin verilen azami toplam kütle"},
  ground_clearance_rear: {"en":"Rear ground clearance","tr":"Arka bölümde yerden yükseklik"},
  ground_clearance_mid: {"en":"Centre ground clearance","tr":"Orta bölümde yerden yükseklik"},
  rear_tire_options: {"en":"Rear tyre size options","tr":"Arka lastik ölçüsü seçenekleri"},
  front_tire_options: {"en":"Front tyre size options","tr":"Ön lastik ölçüsü seçenekleri"},
  engine_type: {"en":"Engine type","tr":"Motor tipi"},
  overall_width_max: {"en":"Maximum overall width","tr":"Azami toplam genişlik"},
  operating_weight: {"en":"Operating weight (load condition unspecified)","tr":"Çalışma ağırlığı (yük durumu belirtilmemiş)"},
  transmission_reverser: {"en":"Transmission shuttle / reverser","tr":"Şanzıman ileri-geri yön değiştiricisi"},
  front_axle_suspension: {"en":"Front axle suspension","tr":"Ön aks süspansiyonu"},
  transmission_gears: {"en":"Transmission gear configuration","tr":"Şanzıman vites düzeni"},
  drive_system: {"en":"Drive system","tr":"Çekiş sistemi"},
  tractor_weight: {"en":"Tractor weight (condition unspecified)","tr":"Traktör ağırlığı (ölçüm koşulu belirtilmemiş)"},
  front_track: {"en":"Front wheel track width","tr":"Ön tekerlek iz genişliği"},
  rear_track: {"en":"Rear wheel track width","tr":"Arka tekerlek iz genişliği"},
  air_conditioning: {"en":"Air conditioning","tr":"Klima"},
  rear_hydraulic_remotes: {"en":"Rear hydraulic remote outlets","tr":"Arka hidrolik çıkışlar"},
  engine_aftertreatment: {"en":"Exhaust aftertreatment system","tr":"Egzoz gazı son işlem sistemi"},
  // Publication provenance: do not promote OEM marketing/unspecified standard values to rated power.
  engine_hp_category: {"en":"Manufacturer horsepower category (not measured engine power)","tr":"Üreticinin HP sınıfı (ölçülmüş motor gücü değil)"},
  manufacturer_engine_torque_range_at_rpm: {"en":"Manufacturer-stated engine torque range (at stated RPM; not a single maximum)","tr":"Üreticinin belirttiği motor tork aralığı (verilen devirde; tek bir azami değer değil)"},
  manufacturer_engine_power_unspecified_standard: {"en":"Manufacturer-stated engine power (test standard not stated)","tr":"Üreticinin belirttiği motor gücü (ölçüm standardı belirtilmemiş)"},
  manufacturer_max_pto_power_unspecified_standard: {"en":"Manufacturer-stated maximum PTO power (test standard not stated)","tr":"Üreticinin belirttiği azami kuyruk mili gücü (ölçüm standardı belirtilmemiş)"},
  manufacturer_f25_rops_weight_unscoped: {"en":"F25 weight with ROPS (gearbox variant unspecified)","tr":"F25 ROPS ağırlığı (şanzıman varyantı belirtilmemiş)"},
  weight_unspecified: {"en":"Weight (load condition unspecified)","tr":"Ağırlık (yük durumu belirtilmemiş)"},
  transmission_configuration: {"en":"Transmission configuration","tr":"Şanzıman düzeni"},
  adblue_tank_capacity: { en: "AdBlue tank capacity", tr: "AdBlue deposu kapasitesi" },
  engine_aspiration: { en: "Aspiration", tr: "Motor besleme sistemi" },
  cooling_system: { en: "Cooling system", tr: "Soğutma sistemi" },
  engine_cylinders: { en: "Cylinder count", tr: "Silindir sayısı" },
  engine_displacement: { en: "Engine displacement", tr: "Motor hacmi" },
  engine_emission_standard: { en: "Emission standard", tr: "Emisyon standardı" },
  engine_model: { en: "Engine model", tr: "Motor modeli" },
  engine_max_power: { en: "Maximum engine power", tr: "Azami motor gücü" },
  engine_power: { en: "Engine power", tr: "Motor gücü" },
  engine_rated_power: { en: "Rated engine power", tr: "Nominal motor gücü" },
  engine_max_power_rpm: { en: "Engine speed at maximum power", tr: "Azami güçte motor devri" },
  engine_torque: { en: "Engine torque", tr: "Motor torku" },
  engine_torque_rpm: { en: "Engine speed at maximum torque", tr: "Azami torkta motor devri" },
  fuel_injection_system: { en: "Fuel injection system", tr: "Yakıt enjeksiyon sistemi" },
  fuel_tank_capacity: { en: "Fuel tank capacity", tr: "Yakıt deposu kapasitesi" },
  ground_clearance: { en: "Ground clearance", tr: "Yerden yükseklik" },
  hydraulic_valve_count: { en: "Hydraulic outlets / valves", tr: "Hidrolik çıkış / valf sayısı" },
  hydraulic_remote_count: { en: "Hydraulic remote outlets", tr: "Hidrolik güç çıkışı sayısı" },
  rear_lift_capacity: { en: "Rear lift capacity", tr: "Arka kaldırma kapasitesi" },
  overall_height: { en: "Overall height", tr: "Toplam yükseklik" },
  overall_length: { en: "Overall length", tr: "Toplam uzunluk" },
  maximum_road_speed: { en: "Maximum road speed", tr: "Azami yol hızı" },
  pto_speeds: { en: "PTO speeds", tr: "PTO devirleri" },
  rear_track_width: { en: "Rear track width", tr: "Arka iz genişliği" },
  drive_configuration: { en: "Drivetrain configuration (2WD/4WD)", tr: "Çekiş düzeni (2WD/4WD)" },
  transmission_forward_gears: { en: "Forward gears", tr: "İleri vites sayısı" },
  transmission_reverse_gears: { en: "Reverse gears", tr: "Geri vites sayısı" },
  transmission_type: { en: "Transmission type", tr: "Şanzıman tipi" },
  torque_reserve: { en: "Torque reserve", tr: "Tork rezervi" },
  weight_kg: { en: "Operating weight", tr: "Çalışma ağırlığı" },
  wheelbase: { en: "Wheelbase", tr: "Dingil mesafesi" },
};

// A few historical source records have Turkish technical headings even in the
// English public feed. Only these exact audited source labels may be normalized
// for display; raw source/evidence text, key, values and units stay untouched.
const auditedTurkishSourceHeadingInEnglish: Record<string,string> = {
  "debriyaj tipi": "Clutch type",
  "ana debriyaj": "Main clutch",
  "ana vites tipi": "Main gear type",
  "çekiş sistemi": "Drive system",
  "yakıt deposu": "Fuel tank",
  // Source-observed ASCII-only Turkish labels were invisible to the older
  // Turkish-diacritic leak detector. Scope these to exact reviewed headings.
  "nominal motor devri": "Rated engine speed",
  "direksiyon tipi": "Steering type",
  "fren sistemi": "Brake system",
  "fren tipi": "Brake type",
  "direksiyon sistemi": "Steering system",
  "piston stroku": "Piston stroke",
  "pto tipi": "PTO type",
  "hava filtresi": "Air filter",
};
// Exact-source translations are deliberately limited to headings actually
// measured on published English pages. Unknown source text remains intact.
// Legacy raw Turkish source names were sometimes title-cased by an English
// ASCII word-boundary regex (i → I). Fold dotted/dotless I only for exact
// source-label lookup; DO NOT rewrite actual source records or general text.
const reviewedEnglishSourceKey=(name:string)=>name.trim().replace(/\s+/g," ")
  .toLocaleLowerCase("tr").replaceAll("ı","i");
const REVIEWED_SOURCE_EN_LOOKUP=new Map(
  Object.entries(REVIEWED_TURKISH_SOURCE_LABELS_EN).map(([name,english])=>[
    reviewedEnglishSourceKey(name),english
  ])
);
export function specLabel(spec: PublicSpec, lang: Locale): string {
  // Exact source-qualified labels must not lose optional and OEM context.
  const sourceHeading=oem20261122SpecLabel(spec.spec_name,lang);
  if(sourceHeading)return sourceHeading;
  // Do not collapse reviewed, explicitly unballasted Cab/ROPS source headings
  // into an unspecified operating-weight label in English.
  if(lang==="en" && /^(?:Weight with cab, without extra ballast|Weight without ballast \(ROPS\))$/i.test(spec.spec_name.trim()))
    return spec.spec_name.trim();
  if (lang === "en") {
    const sourceName = spec.spec_name.trim().replace(/\s+/g," ").toLocaleLowerCase("tr");
    const known = auditedTurkishSourceHeadingInEnglish[sourceName] || REVIEWED_SOURCE_EN_LOOKUP.get(reviewedEnglishSourceKey(spec.spec_name));
    if (known) return known;
  }
  // EPM describes a distinct power-boost condition. A generic canonical key
  // must never erase this source-specific measurement qualifier.
  if (/^maximum engine power with EPM$/i.test(spec.spec_name.trim())) {
    if (lang === "en") return spec.spec_name.trim();
    return publishedSpecificationLabel(spec.spec_name,lang) || spec.spec_name.trim();
  }
  // Source-specific, reviewed headings outrank generic canonical labels ONLY
  // where an audited translation exists for this exact source heading/locale.
  // Otherwise preserve the original canonical glossary precedence.
  const audited = auditedResidualSpecificationLabel(spec.spec_name,lang);
  if(audited) return publishedSpecificationLabel(spec.spec_name,lang) || audited;
  // Translation applies only to known canonical engineering labels, never values.
  const localized = localizedSpecificationName(spec.canonical_key, spec.spec_name, lang);
  if (localized) return localized;
  // Exact, reviewed display-name fallback for published models whose canonical
  // key is not yet included in the central 8-language engineering glossary.
  const reviewed = publishedSpecificationLabel(spec.spec_name, lang);
  if (reviewed) return reviewed;
  const mapped = specLabels[spec.canonical_key || ""]
    || specLabels[comparisonKey(spec)]
    || rawSpecNameLabels[spec.spec_name.trim()];
  if (!mapped && lang === "tr" && /[çğıöşüİ]/iu.test(spec.spec_name)) return spec.spec_name.replace(/_/g, " ");
  return mapped ? mapped[lang === "tr" ? "tr" : "en"] : String(spec.spec_name || spec.canonical_key || "Specification")
    .replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Public evidence indicators are conservative display labels, not publication
 * decisions or a substitute for a human's model/variant review.
 * A bare URL, a timestamp alone or AI extraction alone is not enough.
 */
export type SpecificationEvidenceLevel =
  | "manufacturer_documented"
  | "third_party_reported"
  | "not_verified";

const manufacturerSourceTypes = new Set([
  "manufacturer",
  "manufacturer_specification",
  "official_technical_specification",
  "official_product_page",
  "official_product_specification",
  "official_technical_data",
  "official_technical_pdf",
]);

// Legacy source-type labels identify both official and third-party material.
const reviewedLegacyDocuments = new Map([
  ["https://www.zetor.com/zetor-forterra-technical-parameters", "official"],
  ["https://www.antoniocarraro.it/au/catalogue/Panther_22M", "web_page"],
  ["https://www.swarajtractors.com/products", "product_catalog"],
  ["https://www.yanmar.com/tr/agri/products/tractor/", "product_catalog"],
]);

// Distributor copy of STEYR edition 15S0019COMINB (11/2014); the original CDN location is retired.
const kompaktOriginal = "https://assets.cnhindustrial.com/steyr/assets/Municipality/Products/Tractors/Kompakt%20Series/Brochures/15s0019cominb_steyr_kompakt_bro_low.pdf";
const kompaktArchive = "https://agroguia.online/wp-content/uploads/2019/10/FOLLETO-KOMPAKT-S.pdf";

export function specificationEvidenceLevel(
  spec: Pick<PublicSpec, "source_url" | "source_type" | "evidence_text" | "verified_at">,
): SpecificationEvidenceLevel {
  const sourcePresent = Boolean(safeHttpUrl(spec.source_url));
  const supportingExcerpt = Boolean(spec.evidence_text?.trim());
  const checkedAt = typeof spec.verified_at === "string"
    && Number.isFinite(Date.parse(spec.verified_at));

  if (!sourcePresent || !supportingExcerpt || !checkedAt) return "not_verified";
  if (spec.source_url === kompaktOriginal && spec.source_type === "manufacturer_specification") return "third_party_reported";
  if (manufacturerSourceTypes.has(spec.source_type || "") ||
      (spec.source_type && reviewedLegacyDocuments.get(spec.source_url || "") === spec.source_type)) return "manufacturer_documented";
  return "third_party_reported";
}

export function specificationEvidenceLabel(
  level: SpecificationEvidenceLevel,
  lang: "en" | "tr",
): string {
  if (lang === "tr") {
    if (level === "manufacturer_documented") return "Üretici belgesine dayalı";
    if (level === "third_party_reported") return "Üçüncü taraf kaynak · üretici teyidi yok";
    return "Yeterli kanıt yok · doğrulanmadı";
  }
  if (level === "manufacturer_documented") return "Manufacturer document sourced";
  if (level === "third_party_reported") return "Third-party source · not manufacturer-confirmed";
  return "Insufficient evidence · unverified";
}

/**
 * Display a source link only if it is evidence-backed AND on an approved
 * original manufacturer host. A plausible-sounding source_type or a third
 * party's URL alone can never authorize a visible manufacturer link.
 *
 * Evidence belonging to third parties is retained in the database but its
 * link is not displayed, per site policy. Adding an official manufacturer
 * root is a reviewed code change, not an AI-generated guess.
 */
const approvedManufacturerHosts: Record<string, string[]> = {
  // Official sites checked independently; all evidence and exact-source checks remain required.
  "agrale": ["www.agrale.com.br"],
  "armatrac": ["armatrac.com"],
  "tafe": ["tafetractors.com"],
  "başak traktör": ["basaktraktor.com.tr"],
  "tümosan": ["tumosan.com.tr"],
  "new holland": ["newholland.com.tr", "newholland.com"],
  "tym": ["tym.world"],
  "fendt": ["fendt.com"],
  "massey ferguson": ["masseyferguson.com"],
  "ls tractor": ["lstractor.com", "lstractorusa.com"],
  "mccormick": ["mccormick-tractors.com"],
  "landini": ["landini-tractors.com", "landini.it"],
  "valtra": ["valtra.com", "valtra.nl"],
  "same": ["same-tractors.com"],
  "versatile": ["versatile-ag.com"],
  "steyr": ["steyr-traktoren.com"],
  "mahindra": ["mahindratractor.com"],
  "antonio carraro": ["antoniocarraro.it"],
  "sonalika": ["international.sonalika.com", "www.sonalika.com"],
  "yanmar": ["yanmar.com"],
  "swaraj": ["swarajtractors.com"],
  "kioti": ["kioti.com", "kioti-uk.com"],
  "zetor": ["zetor.com", "zetor.co.uk"],
};

// The original German F36 brochure is served from TYM's named Umbraco media
// tenant. Only THIS reviewed exact PDF is permitted, never the shared CDN root.
const approvedExactManufacturerDocuments: Record<string, string[]> = {
  "belarus": [
    "https://mtz.ru/novosti/13-rukovodstva/48-belarus-80-1-82-1-820-rukovodstvo-po-ekspluatatsii",
  ],
  "agrale": [
    "https://www.agrale.com.br/en/download/112",
    // Exact Agrale-published Brazilian sheets, individually confirmed by model
    // identity and manufacturer technical content. No whole-host approval.
    "https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-4125-1/330/",
    "https://pdf.agrale.com.br/2019/ficha-tecnica/pt/trator-525-1/319/",
    "https://pdf.agrale.com.br/2019/ficha-tecnica/en/tractor-agrale-575-super-1/255/",
  ],
  "iseki": [
    // Reviewed TG6 model columns: publication checkpoint 20261124-iseki-lindner-twelve-models.
    "https://www.iseki.co.jp/global/cms/upload/pdf/products/tractor/TG6%20Specification.pdf",
    "https://www.iseki.co.jp/global/cms/upload/pdf/products/tractor/t97_spec.pdf",
    // Exact ISEKI UK & Ireland TXGS24 range brochure (not arbitrary shared WordPress uploads).
    "https://www.iseki.co.uk/wp-content/uploads/2021/02/Iseki-TXGS24-Range-WEB-2.pdf",
  ],
  // Exact OEM pages verified in the 20261124 Iseki/Lindner and Erkunt/JCB publication checkpoints.
  "jcb": [
    "https://www.jcb.com/en-GB/products/machines/agricultural-tractors/6000-series/",
    "https://www.jcb.com/en-GB/explore/insight/news/2025/11/jcb-launches-all-new-high-tech-fastrac-6000-series-tractors/",
  ],
  "lindner": [
    "https://www.lindner-traktoren.at/en/tractors-transporters/lintrac/lintrac-75-ls",
    "https://www.lindner-traktoren.at/en/tractors-transporters/lintrac/lintrac-95-ls",
    "https://www.lindner-traktoren.at/en/tractors-transporters/lintrac/lintrac-115-ls",
    "https://www.lindner-traktoren.at/en/tractors-transporters/tractors/lintrac-160",
  ],
  "erkunt": [
    "https://erkunttraktor.com.tr/assets/model_dosyalar/pdfs/LuksCRD5Brosur.pdf?t=20260304140933",
  ],
  "lamborghini trattori": [
    "https://www.lamborghini-tractors.com/en-eu/tractors/vineyards-orchards-compacts/download/7987_d432d453ca77b6271f17857f0d842cd0",
    "https://www.lamborghini-tractors.com/en-eu/all/download/7988_b274e15de8fa324d508dde300f1d3fc8",
  ],
  "mccormick": [
    "https://www.mccormick.it/wp-content/uploads/2025/02/MC_TractorRange2025_Brochure_88p_6737432A2_Web_IT.pdf",
    "https://www.mccormick.it/wp-content/uploads/2025/02/MC_TractorRange2025_Brochure_88p_6737433A2_Web_EN.pdf",
    "https://www.mccormick.it/wp-content/uploads/2025/03/MC_RP5D-RP5E_X4F_Brochure_44p_6732663A2_web_EN.pdf",
    "https://www.mccormick.it/wp-content/uploads/2021/04/MC_RS57_X5.085_Brochure_2p_6736270A1_HR_EN.pdf",
  ],
  "yanmar": [
    "https://www.yanmartractor.com/webres/File/Updated%202022%20EDA%20Files/YM347%202022%20Spec%20Sheet%20w%20EDA%208-17-22%20WEB.pdf",
    "https://www.yanmartractor.com/webres/File/Updated%202022%20EDA%20Files/YM359%202022%20Spec%20Sheet%20w%20EDA%208-17-22%20WEB.pdf",
  ],
  // CNH distributes this verified New Holland South Africa TD5 brochure via a shared CDN.
  // Never trust other documents or the CDN hostname generally.
  "new holland": [
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/c3d13220f29640458ef3f059d2865523?v=25dae628",
  ],
  "tym": [
    "https://tym-new.euwest01.umbraco.io/media/fybhyxtb/t575-product-brochure.pdf",
    "https://tym-new.euwest01.umbraco.io/media/ghsmb5lj/t255-product-brochure.pdf",
    "https://tym-new.euwest01.umbraco.io/media/rxdpgfxw/series-3-brochure.pdf",
    "https://tym-new.euwest01.umbraco.io/media/tekl4z2k/t6130-product-brochure.pdf",
    "https://tym-new.euwest01.umbraco.io/media/b01j3nc1/f36-produktbroschu-re.pdf",
  ],
  // Original STEYR manufacturer brochures hosted on a shared CNH content hub:
  // approve exact documents only, NEVER trust the entire CDN hostname.
  "steyr": [
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/73a2d291ba294a3489494574db262ed8?v=a0856698",
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/f4491a850bdb4fdba24a4c5a2baa11fb?v=362a03d2",
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/7eeca058f2bd4fe6892c36fcb39769a1?v=ebff5e26",
    "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/5f70203baa834372905d759fe9fd706f?v=fc8d3927",
  ],
};

// Each entry is an individual reviewed table on a third-party host.
const reviewedExternalTables = new Map([
  // An original 2009 Minsk Tractor Works operating manual covering exactly
  // Belarus 920 and 920.2, served by its regional distributor.
  // Remains a THIRD-PARTY HOST; never elevate to an OEM domain.
  ["https://www.mtzequipment.com/sites/default/files/manuals/900-Series%20Manual.pdf", "independent_catalog"],
  ["https://static.agroinform.hu/data/forum/documents/agroinform_20180508221726_belarus_termekcsalad_katalogus_eng.pdf", "independent_catalog"],
  ["https://netetrade.com/media/mtw-holding-minsk-tractor-works/files/series_500_catalogue.pdf", "independent_catalog"],
  ["https://www.agromeh.com/en/products/belarus-12213", "web_page"],
  ["https://belarus-tractor.kz/products/16", "web_page"],
]);

/**
 * Established independent reference links are published ONLY for evidence-backed
 * fields from an explicitly reviewed specialist hostname. The external source
 * is attribution, NOT an independent confirmation by a tractor manufacturer.
 * No unknown dealer, forum, redirect, homepage or arbitrary 'web_page' qualifies.
 */
export function reviewedIndependentSourceUrl(
  spec: Pick<PublicSpec, "source_url" | "source_type" | "evidence_text" | "verified_at">,
): string | null {
  if (specificationEvidenceLevel(spec) !== "third_party_reported") return null;
  const urlText = safeHttpUrl(spec.source_url);
  if (!urlText) return null;
  const u = new URL(urlText);
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase();
  const type = (spec.source_type || "").toLowerCase();
  if (u.href === kompaktOriginal && type === "manufacturer_specification") return kompaktArchive;
  if (reviewedExternalTables.get(u.href) === type) return u.href;
  if ((host === "www.tractordata.com" || host === "tractordata.com")
    && ["web_page", "independent_catalog", "technical_database"].includes(type)
    && u.pathname.startsWith("/farm-tractors/") && u.pathname.toLowerCase().endsWith(".html"))
    return u.toString();
  if (host === "pruefberichte.dlg.org"
    && ["independent_test", "technical_report"].includes(type)
    && u.pathname.startsWith("/filestorage/") && u.pathname.toLowerCase().endsWith(".pdf"))
    return u.toString();
  if (type === "independent_test" && u.href === "https://dam.agcocorp.com/content/dam/multisite/fendt/marketing/multi-region/documents/marketing-material/testreports/tractors/700-vario-gen7/en/Fendt_724_Vario_Gen7_EN_digital.pdf")
    return "https://www.fendt.com/int/consultation-purchase/test-reports/fendt-700-vario-gen7-tested/";
  if (type === "web_page" && u.href === "https://www.mehanizacija-miler.si/Portals/0/Antonio%20Carraro/Serija%20Panther/RangePanther202572dpiEN.pdf?ver=2025-04-17-113113-483") return u.href;
  // Historical MTZ technical tables hosted by a distributor.
  if (type === "product_catalog" && u.href === "https://kocyigit.com.tr/wp-content/uploads/2024/06/Katalog_Belarus_Traktor.pdf") return u.href;
  // Exact, reviewed original Minsk Tractor Works catalogue hosted by a third-party distributor.
  // It is a historical manufacturer-authored document, NOT a current official manufacturer URL.
  // Never allow the mirror's parent folder, other files, alternate domains or query strings.
  if (host === "netetrade.com" && type === "independent_catalog"
    && u.pathname === "/media/mtw-holding---minsk-tractor-works/files/cb7a65db-f4fd-4c05-a33f-d0a827bbc2ba.pdf"
    && u.search === "" && u.hash === "") return u.toString();
  return null;
}

export function officialManufacturerSourceUrl(
  spec: Pick<PublicSpec, "source_url" | "source_type" | "evidence_text" | "verified_at">,
  brandName: string,
): string | null {
  if (specificationEvidenceLevel(spec) !== "manufacturer_documented") return null;
  const raw = safeHttpUrl(spec.source_url);
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  // Identical STEYR publication code 23S0001COMINB, 09/2023, at its current OEM download URL.
  if (brandName.trim().toLowerCase() === "steyr" && url.href === "https://assets.cnhindustrial.com/steyr/assets/Agriculture/Products/Tractors/Absolut%20Series/NEUE%206280%20ABSOLUT%20CVT/Brochures/2023/23s0001-cominb_absolut_p32_low.pdf") {
    return "https://cnhi-p-001-delivery.sitecorecontenthub.cloud/api/public/content/76a92c3114b14b28a2817ad0977309c9?v=ab84c59d";
  }
  const approved = approvedManufacturerHosts[brandName.toLocaleLowerCase("tr-TR").trim()] || [];
  if (approved.some((root) =>
    url.hostname === root || url.hostname.endsWith("." + root)
  )) return url.toString();

  return (approvedExactManufacturerDocuments[brandName.toLowerCase().trim()] || [])
    .includes(url.toString()) ? url.toString() : null;
}

/**
 * The 2075 BK 4WD manufacturer page and its technical brochure currently
 * disagree on overall length. Keep the value visible, but explain the conflict
 * until the manufacturer confirms the correct figure.
 */
export function verificationNotice(spec: PublicSpec, lang: Locale): string | null {
  const evidence = spec.evidence_text ?? "";
  const hasLengthConflict = spec.canonical_key === "overall_length"
    && spec.verified_at === null
    && evidence.includes("3830")
    && evidence.includes("3930");

  if (!hasLengthConflict) return null;

  const notice: Record<Locale,string> = {
    en: "Başak's official product page lists 3,830 mm, but the 2075 BK 4WD brochure lists 3,930 mm. Do not treat this length as confirmed until the manufacturer resolves the discrepancy.",
    tr: "Başak'ın resmî ürün sayfası 3.830 mm, 2075 BK 4WD teknik broşürü ise 3.930 mm belirtiyor. Üretici açıklayana kadar bu uzunluğu kesin kabul etmeyin.",
    zh: "Başak 官方产品页标注长度为 3,830 mm，而 2075 BK 4WD 技术手册标注为 3,930 mm。制造商澄清前，不应将该长度视为已确认。",
    hi: "Başak के आधिकारिक उत्पाद पृष्ठ में लंबाई 3,830 mm है, जबकि 2075 BK 4WD ब्रोशर में 3,930 mm दी गई है। निर्माता द्वारा स्पष्ट किए जाने तक इसे पुष्ट मान न मानें।",
    "pt-br": "A página oficial da Başak informa 3.830 mm, enquanto o folheto técnico do 2075 BK 4WD informa 3.930 mm. Não considere essa medida confirmada antes do esclarecimento do fabricante.",
    fr: "La page officielle Başak indique 3 830 mm, tandis que la brochure du 2075 BK 4WD indique 3 930 mm. Cette longueur ne doit pas être considérée comme confirmée avant clarification du constructeur.",
    de: "Die offizielle Başak-Produktseite nennt 3.830 mm, die Broschüre des 2075 BK 4WD dagegen 3.930 mm. Bis zur Klärung durch den Hersteller ist die Länge nicht als bestätigt anzusehen.",
    ru: "На официальной странице Başak указано 3 830 мм, а в брошюре 2075 BK 4WD — 3 930 мм. До разъяснения производителя эту длину нельзя считать подтверждённой.",
    ja: "Başakの公式製品ページには3,830 mm、2075 BK 4WDのカタログには3,930 mmと記載されています。メーカーの確認が取れるまで確定値として扱わないでください。",
    es: "La página oficial de Başak indica 3.830 mm, mientras que el folleto del 2075 BK 4WD indica 3.930 mm. No considere confirmada esta medida hasta que el fabricante aclare la diferencia.",
  };
  return notice[lang];
}

export function categoryLabel(category: string | null, lang: Locale): string {
  const localized = localizedCategoryName(category, lang);
  if (localized) return localized;
  const mapped = categoryLabels[category || ""];
  return mapped ? mapped[lang === "tr" ? "tr" : "en"] : lang === "tr" ? "Diğer teknik özellikler" : "Other specifications";
}

export function groupSpecifications(specifications: PublicSpec[], lang: Locale) {
  const groups = new Map<string, PublicSpec[]>();
  for (const spec of specifications) {
    const key = spec.comparison_class || "other";
    groups.set(key, [...(groups.get(key) || []), spec]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: categoryLabel(key, lang),
    specifications: items,
  })).sort((a, b) => a.label.localeCompare(b.label, lang));
}

export function sourceTypeLabel(sourceType: string | null, lang: "en" | "tr"): string {
  if (lang === "tr") {
    if (sourceType === "official_product_page") return "Üreticinin resmî ürün sayfası";
    if (sourceType === "manufacturer" || sourceType === "manufacturer_specification") return "Üretici kaynağı";
    if (sourceType === "technical_report" || sourceType === "independent_test") return "Teknik test / rapor";
    return "Kaynak";
  }
  if (sourceType === "official_product_page") return "Official manufacturer product page";
  if (sourceType === "manufacturer" || sourceType === "manufacturer_specification") return "Manufacturer source";
  if (sourceType === "technical_report" || sourceType === "independent_test") return "Technical test / report";
  return "Source";
}

export function formatDate(value: string | null, lang: "en" | "tr"): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
