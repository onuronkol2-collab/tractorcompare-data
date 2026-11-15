// TractorCompare AI — isolated multi-model PDF benchmark.
// Deno 2.x: see benchmark/README.md. This script never connects to Supabase.

type Row = Record<string, any>;
type TestCase = {
  id: string; manufacturer: string; model: string; variant?: string | null;
  market?: string | null; pdf_url: string; filename?: string; requested_fields?: string[];
};

const FIELDS = [
  "engine_power_rated", "engine_power_max", "engine_power_boost", "engine_torque_max",
  "engine_cylinders", "engine_displacement", "transmission_type",
  "transmission_gears_forward_reverse", "hydraulic_pump_flow",
  "rear_hitch_lift_capacity", "wheelbase", "operating_weight", "pto_speeds"
];

const MODELS = {
  anthropic: { defaultId: "claude-sonnet-5-5", inputRate: 2, outputRate: 10 },
  openai: { defaultId: "gpt-6.1-sol", inputRate: 2, outputRate: 10 },
  gemini: { defaultId: "gemini-3.8-flash", inputRate: 0.75, outputRate: 3.75 }
} as const;

type Provider = keyof typeof MODELS;
const PROVIDER_ENV: Record<Provider, { model: string; key: string }> = {
  anthropic: { model: "ANTHROPIC_MODEL", key: "ANTHROPIC_API_KEY" },
  openai: { model: "OPENAI_MODEL", key: "OPENAI_API_KEY" },
  gemini: { model: "GEMINI_MODEL", key: "GEMINI_API_KEY" }
};

function modelFor(provider: Provider): { id: string; key: string; inputRate: number; outputRate: number } {
  const envNames = PROVIDER_ENV[provider];
  const config = MODELS[provider];
  return {
    id: Deno.env.get(envNames.model) ?? config.defaultId,
    key: Deno.env.get(envNames.key) ?? "",
    inputRate: config.inputRate,
    outputRate: config.outputRate
  };
}

function ratesFor(provider: Provider): { input: number; output: number } {
  const config = MODELS[provider];
  if (provider === "gemini" && Date.now() >= Date.parse("2027-01-01T00:00:00Z")) {
    return { input: 1.5, output: 7.5 };
  }
  return { input: config.inputRate, output: config.outputRate };
}
function checkKeys(providers: Provider[]): void {
  const missing = providers.filter((provider) => !modelFor(provider).key);
  if (missing.length) throw new Error("Missing API keys for selected providers: " + missing.join(", "));
}
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return btoa(binary);
}

async function hash(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer so newer TypeScript/Deno DOM typings accept it as BufferSource.
  const safeBytes = new Uint8Array(bytes.byteLength);
  safeBytes.set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", safeBytes.buffer);
  return Array.from(new Uint8Array(digest)).map((v) => v.toString(16).padStart(2, "0")).join("");
}

function promptFor(item: TestCase): string {
  const fields = item.requested_fields?.length ? item.requested_fields : FIELDS;
  return [
    "Extract specifications from the attached official tractor PDF only. Do not use web search, prior knowledge, memory, or assumptions.",
    "Manufacturer: " + item.manufacturer,
    "Exact target model: " + item.model,
    "Variant/configuration: " + (item.variant || "not specified"),
    "Market: " + (item.market || "not specified"),
    "Fields to check: " + fields.join(", "),
    "Rules: never mix model/variant/generation/market columns; separate rated, maximum, boost and PTO power; preserve exact source value and unit; do not infer or convert.",
    "Paired units such as 81 kW / 110 hp are one specification: preserve both numbers and units in value, set numeric_value to null, and do not treat them as two configurations.",
    "Configuration columns such as 2WD/4WD, ROPS/cab, standard/optional, transmission packages, and with/without creep are different variants: return separate findings for each exact column with its own variant_column. Never combine these columns into one value. If the requested metadata does not identify a subvariant, report partial/ambiguous identity and preserve each option separately rather than guessing.",
    "Weight labels are not interchangeable. Use operating_weight only when the source explicitly identifies operating weight. Keep average shipping weight, minimum ROPS weight, minimum cab weight, generic manufacturer-labelled Weight, and maximum permissible/gross weight distinct; use descriptive keys and exact measurement_scope. Never relabel shipping, minimum, or generic weight as operating_weight.",
    "A source label such as Gross engine power is not automatically Maximum engine power. Use engine_power_max only when the brochure explicitly says maximum power; use engine_power_gross for Gross engine power and engine_power_rated for Rated power. Never rename one measurement type as another.",
    "A hitch lift value stated at ball ends/link ends and a value measured 24 inches behind link ends are different measurement scopes. Preserve both as separate findings (rear_hitch_lift_capacity and rear_hitch_lift_capacity_24in_behind_link_ends) when both are shown; never overwrite one with the other.",
    "For hydraulic data, preserve Total flow, Implement flow, and Steering flow as distinct findings and use matching keys total_hydraulic_flow, hydraulic_implement_flow, and hydraulic_steering_flow. A total flow must not be described as implement pump flow.",
    "A row labelled Weight with ROPS or Weight with cab must use weight_with_rops or weight_with_cab respectively. It is not operating_weight unless the source explicitly says operating weight. If operating_weight was requested but the source does not state it, put it in missing_or_ambiguous and still preserve the separately labelled weight finding.",
    "PTO rows labelled PTO/Engine speed with a pair must be split: the first figure is PTO shaft speed and the second is engine speed at that PTO speed. Do not report both as PTO speeds.",
    "Keep the unit field identical to the unit printed in the source row. Never label cm3 or cc as litre, kgf as kg, daN as kg, or lb as kg. Preserve equivalent-unit pairs in value without changing the source unit.",
    "Keep power-management systems distinct. Rated power with IPM/DP/EPM must use a separate key such as engine_power_rated_with_ipm, engine_power_rated_with_dp, or engine_power_rated_with_epm. Maximum power with those systems must use the matching engine_power_max_with_* key. Do not store rated-with-boost as engine_power_boost if the source explicitly identifies it as rated power with IPM/DP/EPM.",
    "For hitch data, keep maximum capacity at hooks/link ends distinct from OECD lift capacity through the full range at 610 mm or 1,800 mm. Use separate keys rear_hitch_lift_capacity_at_hooks, rear_hitch_lift_capacity_full_range_610mm, and rear_hitch_lift_capacity_full_range_1800mm when those labels occur. Preserve 24-inch-behind-link-end values separately too.",
    "For PTO data, return one finding for PTO shaft speeds and a separate finding for engine rpm at rated PTO speeds. Keep the mapping between each PTO speed and its corresponding engine rpm; never place engine rpm values in the PTO shaft speed field.",
    "For every configuration-specific finding, populate variant_column with the exact source column/model label (for example F36RN, F36HN, Dyna-6, Dyna-VT, CVXDrive, ActiveDrive 8, Auto Command, 2WD, 4WD, ROPS, or cab). Use null only when the source clearly states the value applies to all configurations.",
    "Hydraulic flows from Main pump, MegaFlow, steering/services pump, and package-specific pumps must be separate findings with exact source labels. Do not merge different pump types or package columns.",
    "For each finding give a 1-based PDF viewer page, printed page if different, a short verbatim evidence quote, measurement scope, and exact source column. If identity or value is ambiguous, report that rather than guessing.",
    "Output JSON only with this shape:",
    '{"document_identity":{"manufacturer":"string","exact_model":"string","variant":"string or null","market_scope":"string or null","status":"exact | partial | ambiguous | not_found","explanation":"string"},"findings":[{"key":"field key","value":"source wording","numeric_value":null,"unit":"string or null","measurement_scope":"string","pdf_page":1,"printed_page":null,"evidence_quote":"verbatim quote","variant_column":"string or null"}],"missing_or_ambiguous":[{"key":"field key","reason":"string"}],"warnings":["string"]}',
    "Never return a finding without both a page number and supporting quotation."
  ].join("\n");
}

async function getPdf(item: TestCase): Promise<{ b64: string; sha256: string; bytes: number }> {
  if (!item.pdf_url.startsWith("https://")) throw new Error("HTTPS PDF URL required for " + item.id);
  const response = await fetch(item.pdf_url, { redirect: "follow", signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error("PDF fetch failed for " + item.id + ": HTTP " + response.status);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 8 || new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("Source did not return PDF bytes for " + item.id + "; content-type=" + response.headers.get("content-type"));
  }
  if (bytes.length > 50 * 1024 * 1024) throw new Error("PDF exceeds 50 MB safety limit: " + item.id);
  return { b64: toBase64(bytes), sha256: await hash(bytes), bytes: bytes.length };
}

function parseJson(text: string): Row | null {
  let cleaned = text.trim();
  const fence = String.fromCharCode(96).repeat(3);
  if (cleaned.startsWith(fence)) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline >= 0) cleaned = cleaned.slice(firstNewline + 1);
    if (cleaned.endsWith(fence)) cleaned = cleaned.slice(0, -fence.length).trim();
  }
  try { return JSON.parse(cleaned); } catch { /* try extracting JSON object */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

function getText(payload: Row, provider: string): string {
  if (provider === "anthropic") {
    return (payload.content ?? []).filter((x: Row) => x.type === "text").map((x: Row) => x.text ?? "").join("\n");
  }
  if (provider === "openai") {
    if (typeof payload.output_text === "string") return payload.output_text;
    const out: string[] = [];
    for (const item of payload.output ?? []) for (const part of item.content ?? []) {
      if (typeof part.text === "string") out.push(part.text);
    }
    return out.join("\n");
  }
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts.filter((x: Row) => typeof x.text === "string").map((x: Row) => x.text).join("\n");
}

async function fetchWithRetry(url: string, init: RequestInit, provider: string): Promise<Response> {
  const retryable = new Set([500, 502, 503, 504]);
  const delays = [15000, 30000];
  for (let attempt = 0; attempt < 3; attempt++) {
    console.log(provider + ': sending request (' + (attempt + 1) + '/3)...');
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(240000) });
    if (!retryable.has(response.status) || attempt === 2) return response;
    const waitMs = delays[attempt];
    console.log(provider + ' HTTP ' + response.status + '; temporary server load. Retrying in ' +
      Math.round(waitMs / 1000) + ' seconds (' + (attempt + 2) + '/3)...');
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw new Error(provider + ' request failed after retry attempts.');
}
async function callModel(provider: Provider, item: TestCase, pdf64: string): Promise<Row> {
  const model = modelFor(provider);
  const started = Date.now();
  let response: Response;
  if (provider === "anthropic") {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": model.key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: model.id, max_tokens: 12000,
        messages: [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf64 } },
          { type: "text", text: promptFor(item) }
        ] }]
      }),
      signal: AbortSignal.timeout(240000)
    });
  } else if (provider === "openai") {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "authorization": "Bearer " + model.key, "content-type": "application/json" },
      body: JSON.stringify({
        model: model.id, max_output_tokens: 12000,
        input: [{ role: "user", content: [
          { type: "input_file", filename: item.filename || item.id + ".pdf",
            file_data: "data:application/pdf;base64," + pdf64, detail: "high" },
          { type: "input_text", text: promptFor(item) }
        ] }]
      }),
      signal: AbortSignal.timeout(240000)
    });
  } else {
    response = await fetchWithRetry(
      "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model.id) +
      ":generateContent",
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": model.key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { inline_data: { mime_type: "application/pdf", data: pdf64 } },
            { text: promptFor(item) }
          ] }],
          generationConfig: { maxOutputTokens: 12000, responseMimeType: "application/json" }
        })
      },
      provider
    );
  }
  const payload = await response.json().catch(() => ({})) as Row;
  if (!response.ok) throw new Error(provider + " HTTP " + response.status + ": " + JSON.stringify(payload).slice(0, 1500));
  const text = getText(payload, provider);
  const usage = provider === "anthropic" ? payload.usage ?? {} :
    provider === "openai" ? payload.usage ?? {} : payload.usageMetadata ?? {};
  const input = Number(provider === "gemini" ? usage.promptTokenCount ?? 0 : usage.input_tokens ?? 0);
  const output = provider === "gemini"
    ? Number(usage.candidatesTokenCount ?? 0) + Number(usage.thoughtsTokenCount ?? 0)
    : Number(usage.output_tokens ?? 0);
  const rates = ratesFor(provider);
  const paidListPrice = input / 1e6 * rates.input + output / 1e6 * rates.output;
  const billingTier = provider === "gemini"
    ? (Deno.env.get("GEMINI_BILLING_TIER") ?? "unverified") : "paid";
  return {
    provider, model: model.id, billing_tier: billingTier, latency_ms: Date.now() - started,
    input_tokens: input, output_tokens: output,
    estimated_cost_usd: provider === "gemini" && billingTier === "free" ? 0 : paidListPrice,
    estimated_paid_list_price_usd: paidListPrice,
    response_text: text, parsed: parseJson(text),
    finish_reason: provider === "anthropic" ? payload.stop_reason ?? null :
      provider === "gemini" ? payload.candidates?.[0]?.finishReason ?? null : payload.status ?? null
  };
}

async function main(): Promise<void> {
  const providers = (Deno.env.get("BENCHMARK_PROVIDERS") ?? "gemini")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) as (keyof typeof MODELS)[];
  const allowedProviders = new Set(["anthropic", "openai", "gemini"]);
  if (!providers.length || providers.some((provider) => !allowedProviders.has(provider))) {
    throw new Error("BENCHMARK_PROVIDERS must contain anthropic, openai, and/or gemini.");
  }
  checkKeys(providers);
  const manifestPath = Deno.args[0] ?? "./benchmark/manifest.json";
  const manifest = JSON.parse(await Deno.readTextFile(manifestPath));
  if (!Array.isArray(manifest.cases) || !manifest.cases.length) throw new Error("Manifest has no test cases.");
  const max = Number(Deno.env.get("BENCHMARK_LIMIT") ?? "20");
  const startIndex = Math.max(0, Number(Deno.env.get("BENCHMARK_START") ?? "0") || 0);
  const caseCount = max > 0 ? max : 20;
  const cases: TestCase[] = manifest.cases.slice(startIndex, startIndex + caseCount);
  const results: Row[] = [];
  console.log("Starting " + cases.length + " PDFs from case " + (startIndex + 1) + " x " + providers.length + " selected model(s): " + providers.join(", ") + ". No production DB is accessed.");
  for (const item of cases) {
    console.log("\n" + item.id + ": " + item.manufacturer + " " + item.model);
    let pdf: { b64: string; sha256: string; bytes: number };
    try {
      pdf = await getPdf(item);
      console.log("PDF bytes " + pdf.bytes + "; SHA-256 " + pdf.sha256);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("PDF download failed; skipping this document and continuing: " + message);
      for (const provider of providers) {
        results.push({
          case_id: item.id, manufacturer: item.manufacturer, model_name: item.model,
          variant: item.variant ?? null, market: item.market ?? null, pdf_url: item.pdf_url,
          provider, model: modelFor(provider).id, stage: "pdf_download",
          error: message
        });
      }
      continue;
    }
    for (const provider of providers) {
      try {
        console.log(provider + ": PDF downloaded; starting model analysis...");
        const result = await callModel(provider, item, pdf.b64);
        results.push({
          case_id: item.id, manufacturer: item.manufacturer, model_name: item.model,
          variant: item.variant ?? null, market: item.market ?? null, pdf_url: item.pdf_url,
          pdf_sha256: pdf.sha256, pdf_bytes: pdf.bytes,
          requested_fields: item.requested_fields?.length ? item.requested_fields : FIELDS,
          ...result
        });
        console.log(provider + ": " + result.latency_ms + "ms; tokens " + result.input_tokens + "/" +
          result.output_tokens + "; cost $" + Number(result.estimated_cost_usd).toFixed(5) +
          "; JSON " + (result.parsed ? "valid" : "invalid"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({
          case_id: item.id, manufacturer: item.manufacturer, model_name: item.model,
          variant: item.variant ?? null, pdf_url: item.pdf_url, pdf_sha256: pdf.sha256,
          provider, model: modelFor(provider).id, error: message
        });
        console.error(provider + " failed: " + message);
      }
    }
  }
  await Deno.mkdir("./benchmark/out", { recursive: true });
  const filename = "benchmark-" + new Date().toISOString().replaceAll(":", "-") + ".json";
  await Deno.writeTextFile("./benchmark/out/" + filename, JSON.stringify({
    benchmark_version: "1.0", created_at: new Date().toISOString(),
    cases_requested: cases.length, results
  }, null, 2));
  console.log("\nResults saved to benchmark/out/" + filename);
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    Deno.exit(1);
  });
}
