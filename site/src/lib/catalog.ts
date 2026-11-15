export interface PublicSpec {
  spec_id: string; spec_name: string; spec_value: string; unit: string | null;
  canonical_key: string | null; comparison_class: string | null;
  measurement_standard: string | null; rated_rpm: number | null;
  evidence_text: string | null; verified_at: string | null;
  source_publisher: string | null; source_url: string | null;
  source_type: string | null; source_accessed_at: string | null;
  spec_source_priority: number | null;
}
export interface TractorRecord {
  tractor_id: string; slug: string; brand_name: string; brand_country: string | null;
  brand_website_url: string | null; model_name: string; model_year: number | null;
  variant: string | null; market: string | null; horsepower: number | null;
  engine: string | null; transmission: string | null; drivetrain: string | null;
  weight_kg: number | null; specifications: PublicSpec[];
}
interface PublicSpecRow extends PublicSpec {
  tractor_id: string; brand_name: string; brand_country: string | null;
  brand_website_url: string | null; model_name: string; model_year: number | null;
  variant: string | null; market: string | null; horsepower: number | null;
  engine: string | null; transmission: string | null; drivetrain: string | null;
  weight_kg: number | null;
}
export interface PublicCatalog { configured: boolean; tractors: TractorRecord[]; }
let catalogPromise: Promise<PublicCatalog> | undefined;

function slugPart(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ş/g, "s")
    .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null; }
  catch { return null; }
}
function normalise(value: unknown): string {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function scoreSpec(spec: PublicSpec): number {
  return Number(spec.spec_source_priority ?? 0) * 100
    + (spec.evidence_text?.trim() ? 50 : 0) + (spec.source_url ? 25 : 0)
    + (spec.verified_at ? 10 : 0) + (spec.source_type === "official_product_page" ? 5 : 0);
}
function deduplicateSpecs(specifications: PublicSpec[]): PublicSpec[] {
  const ranked = [...specifications].sort((a,b) => scoreSpec(b)-scoreSpec(a));
  const kept: PublicSpec[] = [];
  for (const candidate of ranked) {
    const key = candidate.canonical_key || normalise(candidate.spec_name);
    const exactDuplicate = kept.some((item) =>
      (item.canonical_key || normalise(item.spec_name)) === key
      && normalise(item.spec_value) === normalise(candidate.spec_value)
      && normalise(item.unit) === normalise(candidate.unit)
      && normalise(item.measurement_standard) === normalise(candidate.measurement_standard)
      && Number(item.rated_rpm ?? 0) === Number(candidate.rated_rpm ?? 0));
    if (exactDuplicate) continue;
    const duplicateSupportedByBetterEvidence = kept.some((item) =>
      (item.canonical_key || normalise(item.spec_name)) === key
      && scoreSpec(item) > scoreSpec(candidate)
      && Boolean(item.evidence_text && normalise(item.evidence_text).includes(normalise(candidate.spec_value))));
    if (!duplicateSupportedByBetterEvidence) kept.push({ ...candidate, source_url: safeHttpUrl(candidate.source_url) });
  }
  return kept.sort((a,b) => (a.comparison_class || "other").localeCompare(b.comparison_class || "other")
    || a.spec_name.localeCompare(b.spec_name));
}
async function loadPublicCatalog(): Promise<PublicCatalog> {
  const rawUrl = import.meta.env.SUPABASE_URL?.trim();
  const anonKey = import.meta.env.SUPABASE_ANON_KEY?.trim();
  if (!rawUrl && !anonKey) return { configured: false, tractors: [] };
  if (!rawUrl || !anonKey) throw new Error("Set both SUPABASE_URL and SUPABASE_ANON_KEY build variables.");
  let baseUrl: URL;
  try { baseUrl = new URL(rawUrl); } catch { throw new Error("SUPABASE_URL is not a valid URL."); }
  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
    throw new Error("SUPABASE_URL must be an HTTPS URL without embedded credentials.");
  }
  const endpoint = new URL("/rest/v1/tractorvs_public_specs", baseUrl);
  endpoint.searchParams.set("select", [
    "tractor_id","brand_name","brand_country","brand_website_url","model_name","model_year",
    "variant","market","horsepower","engine","transmission","drivetrain","weight_kg","spec_id",
    "spec_name","spec_value","unit","canonical_key","comparison_class","measurement_standard",
    "rated_rpm","evidence_text","verified_at","source_publisher","source_url","source_type",
    "source_accessed_at","spec_source_priority",
  ].join(","));
  endpoint.searchParams.set("order", "brand_name.asc,model_name.asc,spec_name.asc");
  endpoint.searchParams.set("limit", "5000");
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { apikey: anonKey, Authorization: "Bearer " + anonKey, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Supabase public catalogue request failed with HTTP " + response.status + ". Check the view migration and Cloudflare build variables.");
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Supabase public catalogue returned an unexpected response.");
  const groups = new Map<string, TractorRecord>();
  for (const rawRow of payload) {
    const row = rawRow as PublicSpecRow;
    if (!row || typeof row.tractor_id !== "string" || !row.model_name || !row.brand_name) continue;
    let tractor = groups.get(row.tractor_id);
    if (!tractor) {
      tractor = {
        tractor_id: row.tractor_id,
        slug: (slugPart(row.brand_name + "-" + row.model_name) || "tractor") + "-" + row.tractor_id.slice(0,8),
        brand_name: row.brand_name, brand_country: row.brand_country ?? null,
        brand_website_url: safeHttpUrl(row.brand_website_url), model_name: row.model_name,
        model_year: row.model_year ?? null, variant: row.variant ?? null, market: row.market ?? null,
        horsepower: row.horsepower ?? null, engine: row.engine ?? null,
        transmission: row.transmission ?? null, drivetrain: row.drivetrain ?? null,
        weight_kg: row.weight_kg ?? null, specifications: [],
      };
      groups.set(row.tractor_id, tractor);
    }
    tractor.specifications.push({
      spec_id: row.spec_id, spec_name: row.spec_name, spec_value: row.spec_value,
      unit: row.unit ?? null, canonical_key: row.canonical_key ?? null,
      comparison_class: row.comparison_class ?? null, measurement_standard: row.measurement_standard ?? null,
      rated_rpm: row.rated_rpm ?? null, evidence_text: row.evidence_text ?? null,
      verified_at: row.verified_at ?? null, source_publisher: row.source_publisher ?? null,
      source_url: safeHttpUrl(row.source_url), source_type: row.source_type ?? null,
      source_accessed_at: row.source_accessed_at ?? null, spec_source_priority: row.spec_source_priority ?? null,
    });
  }
  const tractors = [...groups.values()].map((tractor) => ({
    ...tractor, specifications: deduplicateSpecs(tractor.specifications),
  })).sort((a,b) => a.brand_name.localeCompare(b.brand_name) || a.model_name.localeCompare(b.model_name));
  return { configured: true, tractors };
}
export function getPublicCatalog(): Promise<PublicCatalog> {
  catalogPromise ??= loadPublicCatalog();
  return catalogPromise;
}
const categoryLabels: Record<string,{en:string;tr:string}> = {
  engine:{en:"Engine & power",tr:"Motor ve güç"}, transmission:{en:"Transmission",tr:"Şanzıman"},
  hydraulics:{en:"Hydraulics",tr:"Hidrolik"}, capacities:{en:"Capacities",tr:"Kapasiteler"},
  dimensions_weights:{en:"Dimensions & weight",tr:"Boyutlar ve ağırlık"},
  power_take_off:{en:"Power take-off (PTO)",tr:"Kuyruk mili (PTO)"},
  powertrain:{en:"Driveline",tr:"Aktarma organları"}, implements:{en:"Implements & linkage",tr:"Ekipman ve askı sistemi"},
};
const specLabels: Record<string,{en:string;tr:string}> = {
  engine_aspiration:{en:"Aspiration",tr:"Motor besleme sistemi"},
  cooling_system:{en:"Cooling system",tr:"Soğutma sistemi"},
  engine_cylinders:{en:"Cylinder count",tr:"Silindir sayısı"},
  engine_displacement:{en:"Engine displacement",tr:"Motor hacmi"},
  engine_emission_standard:{en:"Emission standard",tr:"Emisyon standardı"},
  engine_model:{en:"Engine model",tr:"Motor modeli"},
  engine_max_power:{en:"Maximum engine power",tr:"Azami motor gücü"},
  engine_power:{en:"Engine power",tr:"Motor gücü"},
  engine_max_power_rpm:{en:"Engine speed at maximum power",tr:"Azami güçte motor devri"},
  engine_torque:{en:"Maximum torque",tr:"Azami tork"},
  engine_torque_rpm:{en:"Engine speed at maximum torque",tr:"Azami torkta motor devri"},
  fuel_tank_capacity:{en:"Fuel tank capacity",tr:"Yakıt deposu kapasitesi"},
  ground_clearance:{en:"Ground clearance",tr:"Yerden yükseklik"},
  hydraulic_valve_count:{en:"Hydraulic valves",tr:"Hidrolik valf sayısı"},
  rear_lift_capacity:{en:"Rear lift capacity",tr:"Arka kaldırma kapasitesi"},
  overall_height:{en:"Overall height",tr:"Toplam yükseklik"},
  overall_length:{en:"Overall length",tr:"Toplam uzunluk"},
  pto_speeds:{en:"PTO speeds",tr:"PTO devirleri"},
  drive_configuration:{en:"Drive configuration",tr:"Çekiş sistemi"},
  transmission_forward_gears:{en:"Forward gears",tr:"İleri vites sayısı"},
  transmission_reverse_gears:{en:"Reverse gears",tr:"Geri vites sayısı"},
  transmission_type:{en:"Transmission type",tr:"Şanzıman tipi"},
  weight_kg:{en:"Operating weight",tr:"Çalışma ağırlığı"},
  wheelbase:{en:"Wheelbase",tr:"Dingil mesafesi"},
};
export function specLabel(spec: PublicSpec, lang: "en"|"tr"): string {
  const mapped = specLabels[spec.canonical_key || ""];
  return mapped ? mapped[lang] : String(spec.spec_name || spec.canonical_key || "Specification")
    .replace(/_/g," ").replace(/\b\w/g,(letter)=>letter.toUpperCase());
}
export function categoryLabel(category: string|null, lang: "en"|"tr"): string {
  const mapped = categoryLabels[category || ""];
  return mapped ? mapped[lang] : lang === "en" ? "Other specifications" : "Diğer teknik özellikler";
}
export function groupSpecifications(specifications: PublicSpec[], lang: "en"|"tr") {
  const groups = new Map<string,PublicSpec[]>();
  for (const spec of specifications) {
    const key = spec.comparison_class || "other";
    groups.set(key,[...(groups.get(key)||[]),spec]);
  }
  return [...groups.entries()].map(([key,items])=>({
    key,label:categoryLabel(key,lang),specifications:items,
  })).sort((a,b)=>a.label.localeCompare(b.label,lang));
}
export function sourceTypeLabel(sourceType: string|null, lang: "en"|"tr"): string {
  if(lang==="tr"){
    if(sourceType==="official_product_page") return "Üreticinin resmî ürün sayfası";
    if(sourceType==="manufacturer"||sourceType==="manufacturer_specification") return "Üretici kaynağı";
    if(sourceType==="technical_report"||sourceType==="independent_test") return "Teknik test / rapor";
    return "Kaynak";
  }
  if(sourceType==="official_product_page") return "Official manufacturer product page";
  if(sourceType==="manufacturer"||sourceType==="manufacturer_specification") return "Manufacturer source";
  if(sourceType==="technical_report"||sourceType==="independent_test") return "Technical test / report";
  return "Source";
}
export function formatDate(value: string|null, lang: "en"|"tr"): string|null {
  if(!value) return null;
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(lang==="tr"?"tr-TR":"en-GB",{
    day:"2-digit",month:"short",year:"numeric",timeZone:"UTC",
  }).format(date);
}
