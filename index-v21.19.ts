// TractorCompare AI Edge Function — v21.19 (mandatory human review; robust HP/PS paired-power parsing and GEAR taxonomy)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-queue-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const DB_SECRET_KEY = Deno.env.get("DB_SECRET_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const TC_QUEUE_SECRET = Deno.env.get("TC_QUEUE_SECRET") ?? "";
const GEMINI_MODEL = "gemini-3.5-flash-lite";
// Temporary low-cost fallback for transient provider capacity errors (HTTP 500/502/503/504).
// This model supports PDF input, structured outputs, and the Interactions API.
const GEMINI_FALLBACK_MODEL = "gemini-3.1-flash-lite";
const GEMINI_START_TIMEOUT_MS = 60_000;

// TractorCompare AI policy: every AI finding requires human approval.
// No confidence score or source priority may bypass this gate.
const AUTO_APPROVE_VERIFIED_FINDINGS = false;
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/interactions";

if (!SUPABASE_URL || !DB_SECRET_KEY) {
  console.error("Missing Supabase server configuration. Check SUPABASE_URL and DB_SECRET_KEY.");
}

const db = createClient(SUPABASE_URL, DB_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

type AnyRow = Record<string, any>;

type SourceChoice = {
  url: string;
  sourceType: string;
  publisher: string;
  notes: string;
  isPdf: boolean;
  officialHost: string;
  priority: number;
  discoveryMethod?: string;
  discoveryParentUrl?: string | null;
  linkLabel?: string | null;
};

function json(status: number, body: AnyRow) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function normalise(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

// Deterministic model identity evidence extracted from the official HTML page.
// Punctuation between model tokens is flexible (e.g. "6S.155" / "6S 155"),
// but alphanumeric boundaries are strict so "6S.1550" cannot match "6S.155".
function extractExactModelIdentityEvidence(sourceText: string, modelName: string): string | null {
  const raw = String(sourceText ?? "");
  const parts = String(modelName ?? "").match(/[a-z0-9]+/gi) ?? [];
  if (!raw || !parts.length) return null;
  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const modelPattern = parts.map(escapeRegex).join("[\\s._,–—/\\-]*");
  const expression = new RegExp(`(^|[^a-z0-9])(${modelPattern})(?=$|[^a-z0-9])`, "i");
  const match = expression.exec(raw);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 180);
  const end = Math.min(raw.length, match.index + match[0].length + 300);
  return raw.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 600);
}

function extractExactModelVariantIdentityEvidence(sourceText: string, modelName: string, variant: string): string | null {
  const raw = String(sourceText ?? "");
  const modelParts = String(modelName ?? "").match(/[a-z0-9]+/gi) ?? [];
  const variantParts = String(variant ?? "").match(/[a-z0-9]+/gi) ?? [];
  if (!raw || !modelParts.length || !variantParts.length) return null;
  const modelPattern = modelParts.join("[\\s._,–—/\\-]*");
  const variantPattern = variantParts.join("[\\s._,–—/\\-]*");
  const expression = new RegExp("(^|[^a-z0-9])(" + modelPattern + ")[\\s._,–—/\\-]+(" + variantPattern + ")(?=$|[^a-z0-9])", "i");
  const match = expression.exec(raw);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 180);
  const end = Math.min(raw.length, match.index + match[0].length + 300);
  return raw.slice(start, end).replace(/\s+/g, " ").trim().slice(0, 600);
}

// Catalog notes such as "Catalog listing - review" are not real tractor variants.
// Treat these placeholders as an empty variant during matching and persistence.
function cleanCatalogVariant(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const key = normalise(raw);
  const placeholders = new Set([
    "cataloglistingreview",
    "cataloglisting",
    "catalogreview",
    "listingreview",
    "reviewrequired",
    "needsreview",
    "pendingreview",
    "unverified",
    "unknown",
    "notknown",
    "notspecified",
    "unspecified",
    "none",
    "null",
    "na",
    "n/a",
  ]);
  return placeholders.has(key) ? null : raw;
}

function hostOf(value: string): string {
  try {
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(candidate).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function hostMatches(candidate: string, official: string): boolean {
  const a = hostOf(candidate);
  const b = hostOf(official);
  if (!a || !b) return false;
  return a === b || a.endsWith(`.${b}`);
}

// Narrow, brand-specific allow-list for first-party manufacturer asset delivery hosts.
// New Holland's official TD5 product page links its brochure through CNH-owned asset delivery hosts.
// Do not generalize this to arbitrary CDNs or third-party hosts.
function isApprovedBrandAssetHost(brandName: string, candidate: string): boolean {
  const brandKey = normalise(brandName);
  const candidateHost = hostOf(candidate);
  if (brandKey === "newholland") {
    // New Holland Türkiye's official localized product pages are served from
    // newholland.com.tr, separate from the global agriculture.newholland.com
    // host recorded in brands.website_url. Permit this exact first-party domain
    // only; do not generalize to arbitrary country domains or CDNs.
    return candidateHost === "newholland.com.tr"
      || candidateHost === "assets.cnhindustrial.com"
      || candidateHost === "cnhi-p-001-delivery.sitecorecontenthub.cloud";
  }
  // Case IH Turkey publishes official model brochures on its first-party
  // country domain (caseih.com.tr), which is not a subdomain of caseih.com.
  // Allow only this exact official host; do not permit arbitrary third-party CDNs.
  if (brandKey === "caseih") {
    return candidateHost === "caseih.com.tr";
  }
  // Kubota's official regional product pages serve first-party tractor manuals
  // and brochures from media.kubota.io. This exact host is linked from Kubota's
  // official Australia product pages; do not permit other third-party CDNs.
  if (brandKey === "kubota") {
    return candidateHost === "media.kubota.io";
  }
  // John Deere's branded Widen tenant hosts official product brochures.
  // Permit only the exact tenant hostname, not arbitrary Widen or CDN hosts.
  if (brandKey === "johndeere") {
    return candidateHost === "johndeere.widen.net" || candidateHost === "deere.com.au";
  }
  // Landini's current global product catalogue is hosted on the Argo Tractors
  // first-party domain. Its legacy registered website (landini.it) links back
  // to this official platform. Permit this exact host only.
  if (brandKey === "landini") {
    return candidateHost === "landini-tractors.com";
  }
  // LS Mtron's global manufacturer product catalogue is hosted on lstractor.com;
  // the US regional brand website can be stored separately in brands.website_url.
  // Permit this exact manufacturer host only.
  if (brandKey === "lstractor") {
    return candidateHost === "lstractor.com";
  }
  return false;
}

// Widen issues a short-lived redirect from John Deere's branded tenant to its
// shared content-store hostname. Permit that redirect only for a source that
// started on the exact John Deere tenant and only to the exact content-store host.
function isApprovedBrandAssetRedirect(brandName: string, sourceUrl: string, finalUrl: string): boolean {
  return normalise(brandName) === "johndeere"
    && hostOf(sourceUrl) === "johndeere.widen.net"
    && hostOf(finalUrl) === "cf-store.widencdn.net";
}

function brandHostMatches(candidate: string, official: string, brandName: string): boolean {
  return hostMatches(candidate, official) || isApprovedBrandAssetHost(brandName, candidate);
}

function isHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && Boolean(u.hostname);
  } catch {
    return false;
  }
}

function isPdfSource(url: string, sourceType: string): boolean {
  // Manufacturer PDF endpoints are not always files ending in .pdf.
  // Agrale's current official endpoint is /en/pdf/gerar/{id}/... on www.agrale.com.br.
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const type = String(sourceType ?? "").toLowerCase();
    const query = parsed.search.toLowerCase();
    return path.endsWith(".pdf")
      || path.includes("/pdf/")
      || path.includes("resourcefileprotected.php")
      || /(?:^|[?&])(?:format|type|ext)=pdf(?:&|$)/i.test(query)
      || host.startsWith("pdf.")
      || type === "pdf"
      || type.includes("technical_pdf");
  } catch {
    return false;
  }
}

// Clearly non-technical corporate/legal/compliance PDFs must not be treated as
// tractor specification sources, even when linked from a model page footer.
// The rule is intentionally narrow: it blocks known legal/privacy and noise-opacity
// documents without excluding genuine engine-emissions or homologation documents.
function nonTechnicalSourceReason(url: string, label = ""): string | null {
  let decoded = String(url ?? "");
  try { decoded = decodeURIComponent(decoded); } catch { /* keep original URL */ }
  const raw = `${decoded} ${String(label ?? "")}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const text = raw.replace(/[._]+/g, " ").replace(/[-]+/g, " ");
  // Also inspect compact slugs: manufacturers often use CamelCase filenames
  // such as PoliticaDePrivacidade.pdf, which word-boundary rules miss.
  const compact = raw.replace(/[^a-z0-9]+/g, "");

  if (/\b(?:privacy policy|politica de privacidade|privacy|privacidade|cookie policy|cookies policy|terms of use|terms and conditions|legal notice|data protection policy|politica de cookies)\b/i.test(text)
      || /(?:politicadeprivacidade|privacypolicy|privacidade|cookiepolicy|politicadecookies|termsofuse|termsandconditions|legalnotice|dataprotectionpolicy)/i.test(compact)) {
    return "Corporate privacy/legal policy; not a tractor technical specification source";
  }
  if (/\b(?:opacidade ruido|noise opacity|opacity noise|noise test|noise measurement|sound level test|acoustic test report|ruido e opacidade)\b/i.test(text)
      || /(?:opacidad(?:e)?ruido|noiseopacity|opacitynoise|noisetest|noisemeasurement|soundleveltest|acoustictestreport|ruidoeopacidade)/i.test(compact)) {
    return "Noise/opacity compliance document; excluded from core tractor specification sources";
  }
  if (/\b(?:invoice|payment terms|warranty claim form|dealer application|supplier registration)\b/i.test(text)
      || /(?:invoice|paymentterms|warrantyclaimform|dealerapplication|supplierregistration)/i.test(compact)) {
    return "Administrative document; not a tractor technical specification source";
  }
  return null;
}

function evidenceSupportsValue(value: string, evidence: string): boolean {
  const normalValue = normalise(value);
  const normalEvidence = normalise(evidence);
  if (!normalValue || !normalEvidence) return false;
  if (normalEvidence.includes(normalValue)) return true;

  // Allow formatting differences in numeric values (for example 2.417 vs 2417),
  // but require every numeric component of the proposed value to appear.
  const numericParts = value.match(/\d+(?:[.,]\d+)?/g) ?? [];
  if (numericParts.length > 0) {
    return numericParts.every((part) => normalEvidence.includes(normalise(part)));
  }
  return false;
}

function officialDiscoveryFallbackUrl(brandName: string, modelName: string, configuredWebsite: string): { url: string; sourceType: string; notes: string } {
  const brandKey = normalise(brandName);
  const modelKey = normalise(modelName);
  if (brandKey === "landini") {
    // Official Landini product-range index on its current first-party domain.
    // Discovery only; model-specific pages / brochures remain required.
    return {
      url: "https://landini-tractors.com/as/en/products.html",
      sourceType: "official_website",
      notes: "Official Landini product-range index on the current first-party domain; discovery only",
    };
  }
  if (brandKey === "lstractor" && modelKey === "j") {
    // Exact LS Mtron J family page, including the J27 HST / J27 GEAR table.
    return {
      url: "https://www.lstractor.com/en/product/tractor/tractor_J",
      sourceType: "official_product_page",
      notes: "Official LS Mtron J product page; detailed models J27 HST and J27 GEAR",
    };
  }
  if (brandKey === "lstractor") {
    return {
      url: "https://www.lstractor.com/en",
      sourceType: "official_website",
      notes: "Official LS Mtron global website on the current first-party domain; discovery only",
    };
  }
  return {
    url: configuredWebsite,
    sourceType: "official_website",
    notes: "Official manufacturer homepage fallback; product page will be discovered from same-domain links/sitemap",
  };
}

function chooseSource(
  brand: AnyRow,
  modelName: string,
  storedSources: AnyRow[],
  requestedUrl?: string,
): SourceChoice | null {
  const officialWebsite = String(brand.website_url ?? "").trim();
  const officialHost = hostOf(officialWebsite);

  let chosen: AnyRow | null = null;
  if (requestedUrl) {
    if (!isHttpsUrl(requestedUrl)) {
      throw new Error("source_url güvenli bir HTTPS adresi olmalıdır.");
    }
    if (officialHost && !brandHostMatches(requestedUrl, officialWebsite, String(brand.name))) {
      throw new Error("Girilen kaynak adresi markanın kayıtlı resmî alan adıyla eşleşmiyor.");
    }
    const matchingStored = storedSources.find((s) => String(s.source_url) === requestedUrl);
    const explicitSourceRejection = nonTechnicalSourceReason(requestedUrl, String(matchingStored?.notes ?? ""));
    if (explicitSourceRejection) {
      throw new Error(`Seçilen adres teknik traktör kaynağı olarak uygun değil: ${explicitSourceRejection}. Lütfen ürün sayfasının veya teknik kataloğun resmî bağlantısını kullanın.`);
    }
    if (!officialHost && !matchingStored) {
      throw new Error("Markanın resmî web alan adı kayıtlı değil. Yalnızca data_sources tablosuna daha önce eklenmiş resmî bir kaynak kullanılabilir.");
    }
    if (matchingStored) {
      chosen = matchingStored;
    } else {
      // Keep this fallback assignment explicit for reliable editor copy/paste.
      chosen = {};
      chosen.source_url = requestedUrl;
      chosen.source_type = "official_product_specification";
      chosen.publisher = brand.name;
      chosen.notes = `${brand.name} ${modelName} official technical brochure selected from the registered manufacturer website or its approved first-party asset host`;
    }
  } else {
    const modelKey = normalise(modelName);
    const ranked = [...storedSources].sort((a, b) => {
      const score = (s: AnyRow) => {
        const url = String(s.source_url ?? "");
        const notes = String(s.notes ?? "");
        if (!isHttpsUrl(url) || (officialHost && !brandHostMatches(url, officialWebsite, String(brand.name))) || nonTechnicalSourceReason(url, notes)) return -1000;
        const text = normalise(`${url} ${notes}`);
        let n = 0;
        if (modelKey && text.includes(modelKey)) n += 100;
        const type = String(s.source_type ?? "").toLowerCase();
        if (type.includes("technical") || type.includes("specification")) n += 35;
        if (type.includes("official")) n += 20;
        if (/\.pdf(?:$|\?)/i.test(String(s.source_url ?? ""))) n += 10;
        return n;
      };
      return score(b) - score(a);
    });

    // A source belonging to a different tractor must never become the primary
    // source just because it was accessed recently. Prefer an exact model URL/note.
    chosen = ranked.find((s) => {
      const url = String(s.source_url ?? "");
      if (!isHttpsUrl(url)) return false;
      if (officialHost && !brandHostMatches(url, officialWebsite, String(brand.name))) return false;
      const notes = String(s.notes ?? "");
      if (nonTechnicalSourceReason(url, notes)) return false;
      const text = normalise(`${url} ${notes}`);
      return Boolean(modelKey && text.includes(modelKey));
    }) ?? null;

    // If no exact-model source exists, use the current first-party product index
    // for manufacturers whose legacy registered homepage is no longer the best
    // crawl entry point. This is discovery only; relevance and exact identity
    // checks remain mandatory for research evidence.
    if (!chosen && officialWebsite && isHttpsUrl(officialWebsite)) {
      const fallback = officialDiscoveryFallbackUrl(String(brand.name), modelName, officialWebsite);
      chosen = {
        source_url: fallback.url,
        source_type: fallback.sourceType,
        publisher: brand.name,
        notes: fallback.notes,
      };
    }
  }

  if (!chosen) return null;
  const url = String(chosen.source_url ?? "").trim();
  if (!isHttpsUrl(url)) return null;
  if (officialHost && !brandHostMatches(url, officialWebsite, String(brand.name))) return null;

  const type = String(chosen.source_type ?? "official_product_page");
  const modelSpecificUrl = exactModelMatch(url, modelName);
  const inferredPriority = isPdfSource(url, type)
    ? (modelSpecificUrl ? 100 : 85)
    : (modelSpecificUrl ? 95 : (/technical|specification|manual/i.test(type) ? 80 : 30));
  return {
    url,
    sourceType: type,
    publisher: String(chosen.publisher ?? brand.name),
    notes: String(chosen.notes ?? ""),
    isPdf: isPdfSource(url, type),
    officialHost: officialHost || hostOf(url),
    priority: modelSpecificUrl || isPdfSource(url, type)
      ? inferredPriority
      : Math.min(Number(chosen.source_priority ?? inferredPriority), inferredPriority),
  };
}

async function fetchPdfBase64(url: string, officialHost = hostOf(url), brandName = ""): Promise<{ base64: string; byteLength: number; contentType: string; finalUrl: string; lastModified: string | null; etag: string | null }> {
  const MAX_PDF_BYTES = 12 * 1024 * 1024;
  const preflightRejection = nonTechnicalSourceReason(url, "");
  if (preflightRejection) throw new Error(`Teknik olmayan PDF engellendi: ${preflightRejection}`);
  const response = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1", "User-Agent": "TractorCompareAI/2.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`Resmî PDF indirilemedi: HTTP ${response.status} ${response.statusText}`);
  }
  const finalUrl = response.url || url;
  if (!hostMatches(finalUrl, officialHost)
      && !isApprovedBrandAssetRedirect(brandName, url, finalUrl)) {
    throw new Error("PDF bağlantısı kayıtlı üretici alanı dışına yönlendirildi; güvenlik nedeniyle kullanılmadı.");
  }
  const finalUrlRejection = nonTechnicalSourceReason(finalUrl, url);
  if (finalUrlRejection) throw new Error(`Yönlendirilen PDF teknik kaynak değil: ${finalUrlRejection}`);

  const contentType = String(response.headers.get("content-type") ?? "unknown").split(";")[0].trim().toLowerCase();
  const announcedLength = Number(response.headers.get("content-length") ?? 0);
  if (announcedLength > MAX_PDF_BYTES) {
    throw new Error(`PDF ${Math.round(announcedLength / 1024 / 1024)} MB. Güvenli indirme sınırı 12 MB; daha küçük teknik föy veya HTML ürün sayfası kullanın.`);
  }

  if (!response.body) throw new Error("PDF yanıtında okunabilir dosya gövdesi yok.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_PDF_BYTES) {
        await reader.cancel();
        throw new Error("PDF 12 MB güvenli indirme sınırını aşıyor. Daha küçük bir teknik föy veya HTML ürün sayfası kullanın.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total < 5) throw new Error("Kaynak dosya boş veya geçersiz.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  // Check the PDF magic header. This prevents sending an HTML error page as a PDF.
  if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46 || bytes[4] !== 0x2d) {
    throw new Error(`Kaynak PDF olarak sunulmadı (Content-Type: ${contentType}). Üretici bağlantısı HTML/hata sayfası döndürmüş olabilir.`);
  }

  // Encode in chunks to avoid argument-size limits in String.fromCharCode.
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return {
    base64: btoa(binary), byteLength: total, contentType, finalUrl,
    lastModified: response.headers.get("last-modified"),
    etag: response.headers.get("etag"),
  };
}

type HtmlPage = {
  title: string;
  text: string;
  contentType: string;
  byteLength: number;
  finalUrl: string;
  status: number;
  lastModified: string | null;
  etag: string | null;
  links: Array<{ url: string; text: string }>;
};

async function fetchOfficialHtmlText(url: string, officialHost = hostOf(url)): Promise<HtmlPage> {
  const MAX_HTML_BYTES = 1024 * 1024;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
      "Accept-Language": "en-US,en;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; TractorCompareAI/1.5; +https://tractorcompare.ai)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Resmî ürün sayfası alınamadı: HTTP ${response.status} ${response.statusText}`);
  const finalUrl = response.url || url;
  if (!hostMatches(finalUrl, officialHost)) throw new Error("Üretici sayfası başka bir alana yönlendirildi; güvenlik nedeniyle takip edilmedi.");
  const contentType = String(response.headers.get("content-type") ?? "unknown").split(";")[0].trim().toLowerCase();
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`Kaynak HTML ürün sayfası değil (Content-Type: ${contentType}).`);
  }
  if (!response.body) throw new Error("Ürün sayfası yanıtının okunabilir içeriği yok.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error("Ürün sayfası 1 MB güvenli okuma sınırını aşıyor.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) throw new Error("Ürün sayfası boş döndü.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const html = new TextDecoder("utf-8").decode(bytes);
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);

  const links: Array<{ url: string; text: string }> = [];
  const linkSet = new Set<string>();
  const addHtmlLink = (hrefInput: string, rawText: string) => {
    const href = String(hrefInput ?? "").trim().replace(/&amp;/gi, "&").replace(/&#38;/gi, "&");
    if (!href || /^(?:javascript:|mailto:|tel:|#|data:)/i.test(href)) return;
    try {
      const absolute = new URL(href, finalUrl);
      if (absolute.protocol !== "https:" || !hostMatches(absolute.toString(), officialHost)) return;
      absolute.hash = "";
      const urlValue = absolute.toString();
      if (linkSet.has(urlValue)) return;
      linkSet.add(urlValue);
      const label = String(rawText ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/\s+/g, " ").trim().slice(0, 240);
      links.push({ url: urlValue, text: label });
    } catch { /* invalid or unsupported URL */ }
  };

  // Ordinary anchors, including text-only brochure / technical-data links.
  const anchorRegex = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorRegex)) {
    addHtmlLink(String(match[2] ?? ""), String(match[3] ?? ""));
    if (links.length >= 350) break;
  }

  // Embedded PDF/document endpoints used by manufacturer sites.
  const embeddedTagRegex = /<(?:iframe|embed|object|source|link)\b[^>]*>/gi;
  for (const match of html.matchAll(embeddedTagRegex)) {
    const tag = String(match[0] ?? "");
    const attr = tag.match(/\b(?:src|data|href|data-src|data-url|data-pdf|data-file)\s*=\s*(["'])(.*?)\1/i);
    if (!attr) continue;
    const label = tag.match(/\b(?:title|aria-label|type|name)\s*=\s*(["'])(.*?)\1/i)?.[2] ?? "Embedded document";
    addHtmlLink(String(attr[2] ?? ""), String(label));
    if (links.length >= 400) break;
  }

  // Common data-* document URLs and static PDF URLs embedded in inline scripts.
  const dataUrlRegex = /\b(?:data-pdf|data-file|data-document-url|data-download-url|data-href)\s*=\s*(["'])(.*?)\1/gi;
  for (const match of html.matchAll(dataUrlRegex)) addHtmlLink(String(match[2] ?? ""), "Embedded technical document");
  const rawDocumentUrlRegex = /(?:https?:)?\/\/[^"'\\\s<>]+(?:\.pdf(?:[?#][^"'\\\s<>]*)?|resourceFileProtected\.php\?[^"'\\\s<>]+)/gi;
  for (const match of html.matchAll(rawDocumentUrlRegex)) addHtmlLink(String(match[0] ?? ""), "Document URL found in page source");

  const entities: Record<string, string> = {
    "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'",
    "&lt;": "<", "&gt;": ">", "&ndash;": "–", "&mdash;": "—", "&deg;": "°",
    "&sup3;": "³", "&times;": "×", "&rsquo;": "’", "&lsquo;": "‘", "&rdquo;": "”", "&ldquo;": "“",
  };
  let visible = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|svg|noscript|iframe|header|footer|nav|form)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/td|\/th|\/h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|#39|apos|lt|gt|ndash|mdash|deg|sup3|times|rsquo|lsquo|rdquo|ldquo);/gi, (entity) => entities[entity.toLowerCase()] ?? " ")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Math.min(0x10ffff, Number(n))))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(Math.min(0x10ffff, parseInt(n, 16))))
    .replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (visible.length < 80) throw new Error("Ürün sayfasından yeterli görünür metin çıkarılamadı; sayfa JavaScript ile yükleniyor veya erişim engellenmiş olabilir.");
  return {
    title, text: visible.slice(0, 18_000), contentType, byteLength: total, finalUrl, status: response.status,
    lastModified: response.headers.get("last-modified"), etag: response.headers.get("etag"), links,
  };
}



type SourcePacket = {
  source: SourceChoice;
  title: string;
  text: string | null;
  pdfBase64: string | null;
  byteLength: number;
  contentType: string;
  finalUrl: string;
  httpStatus: number;
  lastModified: string | null;
  etag: string | null;
  documentId?: string;
};

function modelFamilyTokens(modelName: string): string[] {
  const stop = new Set(["series", "tractor", "tractors", "model", "type", "version", "global", "market"]);
  const tokens = String(modelName ?? "").toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return [...new Set(tokens.filter((token) => !stop.has(token)))].slice(0, 3);
}

function isGenericOfficialPage(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const parts = path.split("/").filter(Boolean);
    if (parts.length && /^[a-z]{2}$/.test(parts[0])) parts.shift();
    const rest = `/${parts.join("/")}`;
    // Corporate, sustainability, careers and general navigation pages are never
    // technical evidence. This prevents the product page's parent context from
    // accidentally promoting unrelated sibling links.
    return rest === "/"
      || /^\/(?:company|about|about-us|contact|careers|privacy|cookies|home|sustainability|lifeatena|environment)(?:\/.*)?$/i.test(rest)
      || /^\/(?:news|events|catalogue|catalog|catalogo|press|media)$/i.test(rest);
  } catch { return false; }
}

function hasExactTokenSequence(text: string, value: string): boolean {
  const raw = String(text ?? "");
  const parts = String(value ?? "").match(/[a-z0-9]+/gi) ?? [];
  if (!raw || !parts.length) return false;
  const pattern = parts.join("[\\s._,–—/\\-]*");
  return new RegExp("(^|[^a-z0-9])(" + pattern + ")(?=$|[^a-z0-9])", "i").test(raw);
}

// The three-character code J27 is an explicitly documented LS Mtron model.
// Permit it only as a boundary-safe exact token; do not generally relax the
// minimum length for short or ambiguous tractor series names.
function exactModelMatch(text: string, modelName: string): boolean {
  const modelKey = normalise(modelName);
  if (modelKey.length >= 4) return normalise(text).includes(modelKey);
  return modelKey === "j27" && hasExactTokenSequence(text, modelName);
}

function familyModelMatch(text: string, modelName: string): boolean {
  const compact = normalise(text);
  return modelFamilyTokens(modelName).some((token) => token.length >= 4 && compact.includes(normalise(token)));
}

// Detect explicit 2WD / 4WD labels in model variants, URLs, link labels and evidence.
// This is intentionally conservative: sources that mention both drive modes are
// treated as ambiguous for automatic writes unless the individual finding itself
// proves which drive mode the value belongs to.
function driveModeFlags(value: unknown): { twoWd: boolean; fourWd: boolean } {
  const raw = String(value ?? "").toLowerCase();
  const compact = normalise(raw);
  const twoWd = /(?:2wd|4x2|twowheeldrive|2wheeldrive)/i.test(compact)
    || /\b2\s*[- ]?wheel\s*[- ]?drive\b/i.test(raw);
  const fourWd = /(?:4wd|4x4|fourwheeldrive|4wheeldrive)/i.test(compact)
    || /\b4\s*[- ]?wheel\s*[- ]?drive\b/i.test(raw);
  return { twoWd, fourWd };
}

function variantConflictReason(
  url: string,
  label: string,
  parentUrl: string | null,
  requestedVariant: string | null,
): string | null {
  if (!requestedVariant) return null;
  const target = driveModeFlags(requestedVariant);
  if (target.twoWd === target.fourWd) return null;
  const sourceText = `${url} ${label} ${parentUrl ?? ""}`;
  const source = driveModeFlags(sourceText);
  if (source.twoWd && source.fourWd) return "Source is ambiguous: it explicitly mentions both 2WD and 4WD";
  if (target.twoWd && source.fourWd) return "Excluded 4WD source for requested 2WD tractor variant";
  if (target.fourWd && source.twoWd) return "Excluded 2WD source for requested 4WD tractor variant";
  return null;
}

function findingProvesRequestedVariant(
  requestedVariant: string | null,
  source: SourceChoice,
  evidenceText: string,
): boolean {
  if (!requestedVariant) return false;
  const target = driveModeFlags(requestedVariant);
  const combined = `${source.url} ${source.notes} ${source.discoveryParentUrl ?? ""} ${evidenceText}`;
  const observed = driveModeFlags(combined);
  if (target.twoWd && !target.fourWd) return observed.twoWd && !observed.fourWd;
  if (target.fourWd && !target.twoWd) return observed.fourWd && !observed.twoWd;
  const key = normalise(requestedVariant);
  return key.length >= 4 && normalise(combined).includes(key);
}

function sourceScore(url: string, anchorText: string, modelName: string): number {
  // Score the candidate URL and its own visible label only. Do NOT pass the
  // referring product page title/URL here: doing so made every sibling page,
  // including Sustainability pages, look like a Panther technical source.
  if (nonTechnicalSourceReason(url, anchorText)) return -500;
  if (isGenericOfficialPage(url)) return -250;
  const raw = `${url} ${anchorText}`.toLowerCase();
  const exact = exactModelMatch(raw, modelName);
  const family = familyModelMatch(raw, modelName);
  let score = 0;
  if (exact) score += 240;
  else if (family) score += 42;
  const technicalSignal = /technical|specification|technical[-_ ]?data|data[-_ ]?sheet|brochure|catalogue|catalog|manual|ficha|datasheet|download|pdf|dimension|engine|depliant|press|media/i.test(raw);
  if (technicalSignal) score += exact ? 65 : (family ? 45 : 0);
  else if (!exact && family) score = Math.min(score, 25);
  if (/\.pdf(?:$|[?#])/i.test(url) || /\/pdf\//i.test(url) || /resourcefileprotected\.php/i.test(url)) score += 35;
  if (/product|tractor|trattore|model/i.test(raw) && (exact || family)) score += 15;
  if (/parts|dealer|contact|career|privacy|cookie|event|sustainability|lifeatena|environment/i.test(raw)) score -= 100;
  if (/press|news|media/i.test(raw) && !family) score -= 80;
  return score;
}

function sourceRelevance(url: string, label: string, parentUrl: string | null, modelName: string, isPdf: boolean): { score: number; modelSpecific: boolean; preferred: boolean; reason: string; priority: number } {
  const excludedReason = nonTechnicalSourceReason(url, label);
  if (excludedReason) return { score: -500, modelSpecific: false, preferred: false, reason: excludedReason, priority: 5 };
  const targetText = `${url} ${label}`;
  const parentText = String(parentUrl ?? "");
  const targetExact = exactModelMatch(targetText, modelName);
  const parentExact = exactModelMatch(parentText, modelName);
  const familyMatch = familyModelMatch(`${targetText} ${parentText}`, modelName);
  if (isGenericOfficialPage(url)) {
    return { score: -250, modelSpecific: false, preferred: false, reason: "Excluded general/corporate page", priority: 10 };
  }
  // A PDF's generated display title often contains "Brand Model – official PDF".
  // Callers must pass only the real anchor label, never that generated title.
  // A PDF is preferred only when it has a technical/download signal AND either
  // its own URL/label identifies the model or it is linked from the exact model page.
  const explicitTechnicalSignal = /technical|specification|datasheet|data sheet|manual|brochure|depliant|catalogue|catalog|ficha|download|engine|dimensions|hydraulic|technical sheet|technical data|tractor specification/i.test(`${url} ${label}`);
  // An exact-model PDF filename is acceptable even if the manufacturer uses a
  // short label; a generic .pdf extension alone is NOT a technical signal.
  const technicalSignal = explicitTechnicalSignal || (isPdf && targetExact);
  const exactContext = targetExact || (isPdf && parentExact && explicitTechnicalSignal);
  const modelSpecific = isPdf ? exactContext && technicalSignal : targetExact;
  const preferred = isPdf
    ? Boolean(modelSpecific && technicalSignal)
    : Boolean(targetExact || (familyMatch && technicalSignal && /press|media|catalogue|catalog|technical|download/i.test(url)));
  const score = (targetExact ? 240 : (familyMatch ? 42 : 0))
    + (technicalSignal ? 65 : 0)
    + (isPdf ? 35 : 0)
    + (parentExact && isPdf && technicalSignal ? 80 : 0);
  const priority = preferred ? (isPdf ? 100 : (targetExact ? 95 : 82)) : 10;
  const reason = preferred
    ? (targetExact ? "Exact model URL or real source label" : "Technical PDF linked directly from exact model page")
    : "No positive model-specific technical evidence; not preferred";
  return { score, modelSpecific, preferred, reason, priority };
}

function isLikelyPdfLink(url: string, label: string): boolean {
  if (nonTechnicalSourceReason(url, label)) return false;
  if (isPdfSource(url, "")) return true;
  const text = `${url} ${label}`.toLowerCase();
  return /\b(pdf|brochure|depliant|technical sheet|data sheet|datasheet|manual|catalogue)\b/i.test(text)
    && /download|document|file|resource|pdf|brochure|depliant/i.test(text);
}

async function fetchSmallOfficialText(url: string, officialHost: string): Promise<{ text: string; finalUrl: string } | null> {
  const MAX_TEXT_BYTES = 512 * 1024;
  try {
    if (!isHttpsUrl(url) || !hostMatches(url, officialHost)) return null;
    const response = await fetch(url, {
      headers: { "Accept": "text/plain,application/xml,application/rss+xml,*/*;q=0.2", "User-Agent": "TractorCompareAI/1.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok || !hostMatches(response.url || url, officialHost) || !response.body) return null;
    const announcedLength = Number(response.headers.get("content-length") ?? 0);
    if (announcedLength > MAX_TEXT_BYTES) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (total < MAX_TEXT_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        const remaining = MAX_TEXT_BYTES - total;
        const piece = value.byteLength > remaining ? value.subarray(0, remaining) : value;
        chunks.push(piece);
        total += piece.byteLength;
        if (piece.byteLength < value.byteLength) { await reader.cancel(); break; }
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { text: new TextDecoder("utf-8").decode(bytes), finalUrl: response.url || url };
  } catch { return null; }
}

async function discoverOfficialSources(
  brand: AnyRow,
  modelName: string,
  primary: SourceChoice,
  requestedVariant: string | null,
): Promise<SourcePacket[]> {
  const officialWebsite = String(brand.website_url ?? primary.url);
  const registeredOfficialHost = hostOf(officialWebsite);
  const primaryHost = hostOf(primary.url);
  const firstIsPdf = isPdfSource(primary.url, primary.sourceType);
  // Some manufacturers publish localized HTML product pages on a separate
  // first-party country domain (for example John Deere Australia). When that
  // exact host is in the brand-specific allow-list, crawl that page's own host
  // rather than rejecting it against the corporate .com homepage host.
  const primaryUsesApprovedAlternateHost = Boolean(
    !firstIsPdf && primaryHost && registeredOfficialHost
      && !hostMatches(primary.url, registeredOfficialHost)
      && isApprovedBrandAssetHost(String(brand.name), primary.url)
  );
  const officialHost = primaryUsesApprovedAlternateHost
    ? primaryHost
    : (registeredOfficialHost || primary.officialHost);
  if (!officialHost || !brandHostMatches(primary.url, registeredOfficialHost || officialHost, String(brand.name))) {
    throw new Error("Birincil kaynak kayıtlı üretici alan adıyla eşleşmiyor.");
  }
  const primaryVariantConflict = variantConflictReason(primary.url, primary.linkLabel ?? primary.notes, primary.discoveryParentUrl ?? null, requestedVariant);
  if (primaryVariantConflict) {
    throw new Error(`Seçilen ana kaynak hedef varyantla uyuşmuyor: ${primaryVariantConflict}. Doğru varyantın resmî sayfası veya kataloğu gerekli.`);
  }

  const candidateMap = new Map<string, {
    url: string; label: string; score: number; priority: number; type: string;
    method: string; parentUrl: string | null;
  }>();
  const add = (url: string, label: string, score: number, priority = 80, type = "official_product_page", method = "same_domain_link", parentUrl: string | null = null) => {
    try {
      const u = new URL(url);
      u.hash = "";
      if (u.protocol !== "https:" || !brandHostMatches(u.toString(), officialHost, String(brand.name))) return;
      const normalizedUrl = u.toString();
      if (nonTechnicalSourceReason(normalizedUrl, label)) return;
      const variantConflict = variantConflictReason(normalizedUrl, label, parentUrl, requestedVariant);
      if (variantConflict) {
        console.warn(`[crawler] excluded variant-conflicting source: ${normalizedUrl} — ${variantConflict}`);
        return;
      }
      const existing = candidateMap.get(normalizedUrl);
      if (!existing || score > existing.score) {
        candidateMap.set(normalizedUrl, { url: normalizedUrl, label, score, priority, type, method, parentUrl });
      }
    } catch { /* invalid candidate */ }
  };

  // Preserve the registered source's real notes/identity here. The previous v21
  // implementation replaced them with a generic label, which made a manually
  // registered exact-model PDF fail sourceRelevance() and be excluded before
  // the PDF downloader could run. The registered notes are model identity evidence.
  const primaryEvidenceLabel = String(primary.notes ?? "").trim()
    || String(primary.linkLabel ?? "").trim()
    || "User selected / registered official source";
  add(primary.url, primaryEvidenceLabel, 1000, primary.priority, primary.sourceType, "registered_source", null);
  const siteRoot = (() => {
    try {
      return primaryUsesApprovedAlternateHost
        ? new URL(primary.url).origin
        : new URL(officialWebsite).origin;
    } catch { return `https://${officialHost}`; }
  })();
  const rootUrl = `${siteRoot}/`;
  add(rootUrl, "Official manufacturer website root (discovery only)", -120, 20, "official_website", "manufacturer_root", null);

  const htmlPages: HtmlPage[] = [];
  const htmlCache = new Map<string, HtmlPage>();
  const visitedPages = new Set<string>();
  const sourceFetchFailures: string[] = [];
  const fetchPage = async (url: string, method: string): Promise<HtmlPage | null> => {
    if (visitedPages.has(url) || !hostMatches(url, officialHost)) return null;
    visitedPages.add(url);
    try {
      const page = await fetchOfficialHtmlText(url, officialHost);
      const redirectedVariantConflict = variantConflictReason(page.finalUrl, page.title, url, requestedVariant);
      if (redirectedVariantConflict) {
        console.warn(`[crawler] excluded variant-conflicting HTML after redirect: ${page.finalUrl} — ${redirectedVariantConflict}`);
        return null;
      }
      htmlPages.push(page);
      htmlCache.set(url, page);
      htmlCache.set(page.finalUrl, page);
      const score = sourceScore(page.finalUrl, page.title, modelName);
      const relevantPage = !isGenericOfficialPage(page.finalUrl) && (exactModelMatch(page.finalUrl, modelName) || score >= 75);
      if (relevantPage && page.finalUrl !== primary.url && page.finalUrl !== rootUrl) {
        const rel = sourceRelevance(page.finalUrl, page.title, url, modelName, false);
        add(page.finalUrl, page.title || "Official related page", score, rel.priority, /press|media/i.test(page.finalUrl) ? "official_press_page" : "official_product_page", method, url);
      }
      return page;
    } catch (e) {
      const failure = `${url} [HTML discovery fetch]: ${e instanceof Error ? e.message : String(e)}`;
      sourceFetchFailures.push(failure);
      console.warn(`[crawler] HTML page skipped: ${failure}`);
      return null;
    }
  };

  if (!firstIsPdf) {
    await fetchPage(primary.url, "user_selected_page");
    if (rootUrl !== primary.url) await fetchPage(rootUrl, "manufacturer_root_link");
  }

  // Crawl a bounded set of internal Press / Media / Downloads / Technical sections.
  // This discovers model-family folders such as /press_folders/business/Panther_AC2025.
  for (let depth = 0; depth < 3; depth++) {
    const sectionCandidates: Array<{ url: string; label: string; parentUrl: string; score: number }> = [];
    for (const page of [...htmlPages]) {
      for (const link of page.links) {
        const combined = `${link.url} ${link.text}`.toLowerCase();
        const sectionLike = /press|press_folders|media|downloads|brochure|technical|resources|documents/i.test(combined);
        if (!sectionLike || visitedPages.has(link.url) || !hostMatches(link.url, officialHost)) continue;
        if (variantConflictReason(link.url, link.text, page.finalUrl, requestedVariant)) continue;
        const sectionScore = sourceScore(link.url, link.text, modelName);
        if (sectionScore < 35 || isGenericOfficialPage(link.url)) continue;
        sectionCandidates.push({ url: link.url, label: link.text, parentUrl: page.finalUrl, score: sectionScore });
      }
    }
    const uniqueSections = [...new Map(sectionCandidates.sort((a, b) => b.score - a.score).map((x) => [x.url, x])).values()];
    const batch = uniqueSections.slice(0, 2);
    if (!batch.length) break;
    for (const item of batch) {
      await fetchPage(item.url, depth === 0 ? "section_discovery" : "nested_section_discovery");
    }
  }

  // Read robots.txt and both direct + nested sitemap indexes, with strict request limits.
  const robots = await fetchSmallOfficialText(`${siteRoot}/robots.txt`, officialHost);
  const sitemapUrls = new Set<string>([`${siteRoot}/sitemap.xml`]);
  if (robots) {
    for (const match of robots.text.matchAll(/^\s*Sitemap:\s*(https:\/\/\S+)/gim)) {
      if (hostMatches(match[1], officialHost)) sitemapUrls.add(match[1]);
      if (sitemapUrls.size >= 5) break;
    }
  }
  let sitemapRequests = 0;
  const sitemapPageUrls = new Set<string>();
  for (const sitemapUrl of sitemapUrls) {
    if (sitemapRequests >= 2) break;
    sitemapRequests++;
    const sitemap = await fetchSmallOfficialText(sitemapUrl, officialHost);
    if (!sitemap) continue;
    const locs = [...sitemap.text.matchAll(/<loc>\s*(https:\/\/[^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    const childSitemaps = locs.filter((loc) => /\.xml(?:$|[?#])/i.test(loc) && hostMatches(loc, officialHost));
    for (const loc of locs) {
      if (!hostMatches(loc, officialHost) || /\.xml(?:$|[?#])/i.test(loc)) continue;
      const score = sourceScore(loc, "Sitemap URL", modelName);
      if (score >= 35) sitemapPageUrls.add(loc);
    }
    for (const child of childSitemaps.slice(0, 2)) {
      if (sitemapRequests >= 2) break;
      sitemapRequests++;
      const nested = await fetchSmallOfficialText(child, officialHost);
      if (!nested) continue;
      for (const match of nested.text.matchAll(/<loc>\s*(https:\/\/[^<\s]+)\s*<\/loc>/gi)) {
        const loc = match[1].trim();
        if (!hostMatches(loc, officialHost)) continue;
        if (variantConflictReason(loc, "Nested sitemap URL", null, requestedVariant)) continue;
        const score = sourceScore(loc, "Nested sitemap URL", modelName);
        if (score >= 35) sitemapPageUrls.add(loc);
      }
    }
  }
  for (const url of [...sitemapPageUrls].slice(0, 4)) {
    const score = sourceScore(url, "Official manufacturer sitemap", modelName);
    add(url, "Official manufacturer sitemap result", score, score >= 130 ? 95 : 85, /press|media/i.test(url) ? "official_press_page" : "official_product_page", "sitemap", null);
  }

  // Extract source links. Only PDF/document endpoints may inherit the exact-model
  // context of the referring product page. Ordinary sibling HTML links are scored
  // by their own URL and label, preventing Sustainability/Company links from being
  // promoted merely because they were linked from a model page.
  const linkCandidates: Array<{ url: string; text: string; score: number; parentUrl: string; pdfLike: boolean }> = [];
  for (const page of htmlPages) {
    for (const link of page.links) {
      if (nonTechnicalSourceReason(link.url, link.text)) continue;
      const directScore = sourceScore(link.url, link.text, modelName);
      const pdfLike = isLikelyPdfLink(link.url, link.text);
      const parentExact = exactModelMatch(`${page.finalUrl} ${page.title} ${page.text}`, modelName);
      const parentFamily = familyModelMatch(`${page.finalUrl} ${page.title} ${page.text}`, modelName);
      const pdfParentMatch = pdfLike && (parentExact || parentFamily) && !isGenericOfficialPage(link.url);
      const parentVariantContext = `${page.finalUrl} ${page.title}`;
      if (variantConflictReason(link.url, link.text, parentVariantContext, requestedVariant)) continue;
      const effectiveScore = pdfParentMatch ? Math.max(directScore, parentExact ? 320 : 125) : directScore;
      if (effectiveScore >= 35 && !isGenericOfficialPage(link.url)) {
        linkCandidates.push({ url: link.url, text: link.text || "Official internal document link", score: effectiveScore, parentUrl: page.finalUrl, pdfLike });
      }
    }
  }
  linkCandidates.sort((a, b) => b.score - a.score);
  const uniqueLinks = new Set<string>();
  for (const link of linkCandidates) {
    if (uniqueLinks.has(link.url)) continue;
    uniqueLinks.add(link.url);
    const pdfLike = link.pdfLike || isPdfSource(link.url, "");
    const rel = sourceRelevance(link.url, link.text, link.parentUrl, modelName, pdfLike);
    add(link.url, link.text, link.score, rel.priority, pdfLike ? "official_technical_pdf" : "official_product_page", pdfLike ? "official_pdf_link" : "same_domain_link", link.parentUrl);
  }

  // Keep the primary page plus the three best related official sources.
  const candidates = [...candidateMap.values()]
    .filter((candidate) => !nonTechnicalSourceReason(candidate.url, candidate.label)
      && (candidate.url === primary.url || (!isGenericOfficialPage(candidate.url) && candidate.score >= 35)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const packets: SourcePacket[] = [];
  let totalPdfBytes = 0;
  for (const candidate of candidates) {
    const preflightReason = nonTechnicalSourceReason(candidate.url, candidate.label);
    if (preflightReason) {
      console.warn(`[crawler] excluded candidate before download: ${candidate.url} — ${preflightReason}`);
      continue;
    }
    const candidateIsPdf = isPdfSource(candidate.url, candidate.type);
    const candidateRelevance = sourceRelevance(candidate.url, candidate.label, candidate.parentUrl, modelName, candidateIsPdf);
    if (candidateIsPdf && !candidateRelevance.preferred) {
      const failure = `${candidate.url} [PDF relevance]: ${candidateRelevance.reason}`;
      sourceFetchFailures.push(failure);
      console.warn(`[crawler] excluded PDF without model-specific technical signal: ${failure}`);
      continue;
    }
    const source: SourceChoice = {
      url: candidate.url,
      sourceType: candidate.type,
      publisher: String(brand.name),
      notes: candidate.label,
      isPdf: isPdfSource(candidate.url, candidate.type),
      // For an approved CNH asset PDF, validate redirects against that exact host;
      // HTML discovery remains constrained to New Holland's official website host.
      officialHost: isApprovedBrandAssetHost(brand.name, candidate.url) ? hostOf(candidate.url) : officialHost,
      priority: candidate.priority,
      discoveryMethod: candidate.method,
      discoveryParentUrl: candidate.parentUrl,
      linkLabel: candidate.label,
    };
    if (source.isPdf) {
      try {
        const pdf = await fetchPdfBase64(source.url, source.officialHost || officialHost, brand.name);
        const redirectedPdfRejection = nonTechnicalSourceReason(pdf.finalUrl, source.linkLabel ?? source.notes);
        const redirectedVariantRejection = variantConflictReason(pdf.finalUrl, source.linkLabel ?? source.notes, source.discoveryParentUrl ?? null, requestedVariant);
        if (redirectedVariantRejection) {
          const failure = `${source.url} [PDF variant check]: redirected to ${pdf.finalUrl}; ${redirectedVariantRejection}`;
          sourceFetchFailures.push(failure);
          console.warn(`[crawler] excluded variant-conflicting PDF after redirect: ${failure}`);
          continue;
        }
        if (redirectedPdfRejection) {
          const failure = `${source.url} [PDF content check]: ${redirectedPdfRejection}`;
          sourceFetchFailures.push(failure);
          console.warn(`[crawler] excluded non-technical PDF after redirect: ${failure}`);
          continue;
        }
        if (totalPdfBytes + pdf.byteLength > 12 * 1024 * 1024) {
          const failure = `${source.url} [combined PDF budget]: ${pdf.byteLength} bytes would exceed 12 MB total`;
          sourceFetchFailures.push(failure);
          console.warn(`[crawler] skipped PDF over 12 MB combined budget: ${failure}`);
          continue;
        }
        totalPdfBytes += pdf.byteLength;
        packets.push({ source, title: `${brand.name} ${modelName} – official PDF`, text: null, pdfBase64: pdf.base64, byteLength: pdf.byteLength, contentType: pdf.contentType, finalUrl: pdf.finalUrl, httpStatus: 200, lastModified: pdf.lastModified, etag: pdf.etag });
        continue;
      } catch (pdfError) {
        const failure = `${source.url} [PDF download]: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`;
        sourceFetchFailures.push(failure);
        console.warn(`[crawler] official PDF could not be downloaded: ${failure}`);
      }
    }
    try {
      const page = htmlCache.get(source.url) ?? await fetchOfficialHtmlText(source.url, officialHost);
      if (nonTechnicalSourceReason(page.finalUrl, page.title)) {
        console.warn(`[crawler] excluded non-technical HTML after redirect: ${page.finalUrl}`);
        continue;
      }
      const redirectedVariantRejection = variantConflictReason(page.finalUrl, page.title, source.discoveryParentUrl ?? null, requestedVariant);
      if (redirectedVariantRejection) {
        console.warn(`[crawler] excluded variant-conflicting HTML after redirect: ${page.finalUrl} — ${redirectedVariantRejection}`);
        continue;
      }
      packets.push({ source, title: page.title || `${brand.name} ${modelName}`, text: page.text, pdfBase64: null, byteLength: page.byteLength, contentType: page.contentType, finalUrl: page.finalUrl, httpStatus: page.status, lastModified: page.lastModified, etag: page.etag });
    } catch (error) {
      const failure = `${source.url} [HTML fallback]: ${error instanceof Error ? error.message : String(error)}`;
      sourceFetchFailures.push(failure);
      console.warn(`[crawler] skipped official source ${failure}`);
    }
  }

  const primaryPacket = packets.find((packet) => packet.source.url === primary.url);
  if (!primaryPacket) {
    // Only an automatically selected official homepage/product index may be
    // bypassed, and only when another fetched first-party packet independently
    // proves exact model relevance. A manually registered/selected primary
    // source remains mandatory and cannot be silently replaced.
    const isDiscoveryFallback = primary.sourceType === "official_website";
    const verifiedFallbackPackets = isDiscoveryFallback
      ? packets.filter((packet) => {
          const relevance = sourceRelevance(
            packet.finalUrl || packet.source.url,
            packet.title || packet.source.notes || "",
            packet.source.discoveryParentUrl ?? null,
            modelName,
            Boolean(packet.pdfBase64),
          );
          return relevance.preferred && relevance.modelSpecific;
        })
      : [];
    if (verifiedFallbackPackets.length > 0) {
      console.warn(
        `[crawler] primary discovery page unavailable; proceeding only with ${verifiedFallbackPackets.length} independently model-specific official packet(s) for ${brand.name} ${modelName}`
      );
      return verifiedFallbackPackets.slice(0, 4);
    }
    const diagnostics = sourceFetchFailures.slice(0, 8).join(" || ").slice(0, 1400);
    throw new Error(
      `Resmî kaynak paketi oluşturulamadı. Birincil kaynak: ${primary.url} [${primary.sourceType}]. `
      + `Doğrulanmış alternatif model kaynağı: bulunamadı. Kaynak tanısı: ${diagnostics || "İndirme başarısızlığı ayrıntısı yok; üretici sayfası robots/anti-bot veya JS ile oluşturulan içerik nedeniyle okunamamış olabilir."}`
    );
  }
  return [primaryPacket, ...packets.filter((packet) => packet !== primaryPacket)].slice(0, 4);
}

function canonicalInfo(specName: string): { key: string | null; className: string | null; name: string } {
  const key = normalise(specName);
  const map: Record<string, { key: string; className: string; name: string }> = {
    power: { key: "engine_power", className: "engine", name: "Engine power" },
    horsepower: { key: "engine_power", className: "engine", name: "Engine power" },
    enginepower: { key: "engine_power", className: "engine", name: "Engine power" },
    enginepowerkw: { key: "engine_power_kw", className: "engine", name: "Engine power (kW)" },
    ratedpowerkw: { key: "engine_power_kw", className: "engine", name: "Engine power (kW)" },
    engine: { key: "engine_description", className: "engine", name: "Engine description" },
    brand: { key: "engine_make", className: "engine", name: "Engine make" },
    enginemake: { key: "engine_make", className: "engine", name: "Engine make" },
    enginebrand: { key: "engine_make", className: "engine", name: "Engine make" },
    fueltype: { key: "engine_fuel_type", className: "engine", name: "Engine fuel type" },
    enginefueltype: { key: "engine_fuel_type", className: "engine", name: "Engine fuel type" },
    powersupply: { key: "engine_fuel_type", className: "engine", name: "Engine fuel type" },
    emissionstandard: { key: "engine_emission_standard", className: "engine", name: "Engine emission standard" },
    emissionsstandard: { key: "engine_emission_standard", className: "engine", name: "Engine emission standard" },
    engineemissionstandard: { key: "engine_emission_standard", className: "engine", name: "Engine emission standard" },
    cylinders: { key: "engine_cylinders", className: "engine", name: "Engine cylinders" },
    numberofcylinders: { key: "engine_cylinders", className: "engine", name: "Engine cylinders" },
    enginecylinders: { key: "engine_cylinders", className: "engine", name: "Engine cylinders" },
    cooling: { key: "engine_cooling_system", className: "engine", name: "Engine cooling system" },
    coolingtype: { key: "engine_cooling_system", className: "engine", name: "Engine cooling system" },
    enginecoolingsystem: { key: "engine_cooling_system", className: "engine", name: "Engine cooling system" },
    enginedisplacement: { key: "engine_displacement", className: "engine", name: "Engine displacement" },
    displacement: { key: "engine_displacement", className: "engine", name: "Engine displacement" },
    torque: { key: "engine_torque", className: "engine", name: "Maximum torque" },
    maximumtorque: { key: "engine_torque", className: "engine", name: "Maximum torque" },
    enginetorque: { key: "engine_torque", className: "engine", name: "Maximum torque" },
    ratedrpm: { key: "engine_rated_speed", className: "engine", name: "Engine rated speed" },
    engineratedrpm: { key: "engine_rated_speed", className: "engine", name: "Engine rated speed" },
    ratedspeed: { key: "engine_rated_speed", className: "engine", name: "Engine rated speed" },
    engineratedspeed: { key: "engine_rated_speed", className: "engine", name: "Engine rated speed" },
    enginetype: { key: "engine_description", className: "engine", name: "Engine description" },
    enginehpkw: { key: "engine_power", className: "engine", name: "Engine power" },
    weight: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    weightkg: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    operatingweight: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    operatingweightkg: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    tractorweight: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    machineweight: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    kerbweight: { key: "weight_kg", className: "dimensions_weights", name: "Weight" },
    groundclearance: { key: "ground_clearance", className: "dimensions_weights", name: "Ground clearance" },
    turningradius: { key: "turning_radius", className: "dimensions_weights", name: "Turning radius" },
    pitch: { key: "pitch", className: "dimensions_weights", name: "Pitch" },
    drivetrain: { key: "drivetrain", className: "powertrain", name: "Drivetrain" },
    drivetype: { key: "drivetrain", className: "powertrain", name: "Drivetrain" },
    transmissiontype: { key: "transmission_type", className: "transmission", name: "Transmission type" },
    transmissiongearconfiguration: { key: "transmission_gear_configuration", className: "transmission", name: "Transmission gear configuration" },
    gearbox: { key: "transmission_type", className: "transmission", name: "Transmission type" },
    gearboxcontrol: { key: "transmission_control", className: "transmission", name: "Transmission control" },
    transmissioncontrol: { key: "transmission_control", className: "transmission", name: "Transmission control" },
    forwardgears: { key: "transmission_forward_gears", className: "transmission", name: "Forward gears" },
    transmissionforwardgears: { key: "transmission_forward_gears", className: "transmission", name: "Forward gears" },
    reversegears: { key: "transmission_reverse_gears", className: "transmission", name: "Reverse gears" },
    transmissionreversegears: { key: "transmission_reverse_gears", className: "transmission", name: "Reverse gears" },
    noofspeed: { key: "transmission_gear_configuration", className: "transmission", name: "Transmission gear configuration" },
    numberofspeed: { key: "transmission_gear_configuration", className: "transmission", name: "Transmission gear configuration" },
    clutch: { key: "clutch_type", className: "transmission", name: "Clutch type" },
    clutchtype: { key: "clutch_type", className: "transmission", name: "Clutch type" },
    hydraulicmainflow: { key: "hydraulic_main_flow", className: "hydraulics", name: "Main hydraulic flow" },
    mainhydraulicflow: { key: "hydraulic_main_flow", className: "hydraulics", name: "Main hydraulic flow" },
    hydraulicpumpflow: { key: "hydraulic_main_flow", className: "hydraulics", name: "Hydraulic pump flow" },
    implementpump: { key: "hydraulic_main_flow", className: "hydraulics", name: "Implement pump flow" },
    implementpumpflow: { key: "hydraulic_main_flow", className: "hydraulics", name: "Implement pump flow" },
    hydraulicremoteflow: { key: "hydraulic_remote_flow", className: "hydraulics", name: "Remote hydraulic flow" },
    remoteflow: { key: "hydraulic_remote_flow", className: "hydraulics", name: "Remote hydraulic flow" },
    hydraulicpressure: { key: "hydraulic_pressure", className: "hydraulics", name: "Hydraulic pressure" },
    hydraulicsystemtype: { key: "hydraulic_system_type", className: "hydraulics", name: "Hydraulic system type" },
    rearliftcapacity: { key: "rear_lift_capacity", className: "hydraulics", name: "Rear lift capacity" },
    hydraulicliftcapacity: { key: "rear_lift_capacity", className: "hydraulics", name: "Rear lift capacity" },
    liftingcapacity: { key: "rear_lift_capacity", className: "hydraulics", name: "Rear lift capacity" },
    liftingsystemtype: { key: "rear_lift_system_type", className: "hydraulics", name: "Rear lifting system type" },
    draftcontrol: { key: "draft_control", className: "hydraulics", name: "Draft control" },
    rearhitchcategory: { key: "three_point_linkage_category", className: "implements", name: "Rear hitch category" },
    threepointhitch: { key: "three_point_linkage_category", className: "implements", name: "Three-point hitch category" },
    threepointlinkagecategory: { key: "three_point_linkage_category", className: "implements", name: "Three-point linkage category" },
    category3pthitch: { key: "three_point_linkage_category", className: "implements", name: "Three-point hitch category" },
    category3pointhitch: { key: "three_point_linkage_category", className: "implements", name: "Three-point hitch category" },
    category3pthitchkgflinkend: { key: "rear_lift_capacity", className: "hydraulics", name: "Rear lift capacity" },
    category3pthitchlinkend: { key: "rear_lift_capacity", className: "hydraulics", name: "Rear lift capacity" },
    mechanicaltoplink: { key: "top_link_category", className: "hydraulics", name: "Mechanical top link category" },
    hydraulicreservoircapacity: { key: "hydraulic_oil_capacity", className: "hydraulics", name: "Hydraulic oil capacity" },
    transmissionoilcapacity: { key: "transmission_oil_capacity", className: "powertrain", name: "Transmission oil capacity" },
    hydraulicpumpcount: { key: "hydraulic_pump_count", className: "hydraulics", name: "Hydraulic pump count" },
    pump: { key: "hydraulic_pump_count", className: "hydraulics", name: "Hydraulic pump count" },
    rearhydraulicspoolvalves: { key: "rear_hydraulic_spool_valves", className: "hydraulics", name: "Rear hydraulic spool valves" },
    rearliftcontrol: { key: "hydraulic_lift_control", className: "hydraulics", name: "Hydraulic lift control" },
    controlsystem: { key: "hydraulic_lift_control", className: "hydraulics", name: "Hydraulic lift control" },
    hydrauliccontroltype: { key: "hydraulic_lift_control", className: "hydraulics", name: "Hydraulic lift control" },
    pto: { key: "pto_type", className: "power_take_off", name: "PTO type" },
    ptonominalspeed: { key: "pto_nominal_speed", className: "power_take_off", name: "PTO nominal speed" },
    ptospeed: { key: "pto_nominal_speed", className: "power_take_off", name: "PTO nominal speed" },
    ptoengagement: { key: "pto_type", className: "power_take_off", name: "PTO engagement" },
    ptocontrol: { key: "pto_control", className: "power_take_off", name: "PTO control" },
    ptops: { key: "pto_power", className: "power_take_off", name: "PTO power" },
    ptopower: { key: "pto_power", className: "power_take_off", name: "PTO power" },
    ptopowerkw: { key: "pto_power_kw", className: "power_take_off", name: "PTO power (kW)" },
    rearpto: { key: "pto_nominal_speed", className: "power_take_off", name: "Rear PTO speed" },
    rearptospeed: { key: "pto_nominal_speed", className: "power_take_off", name: "Rear PTO speed" },
    steeringtype: { key: "steering_type", className: "steering", name: "Steering type" },
    braketype: { key: "brake_type", className: "brakes", name: "Brake type" },
    rearbrakingsystem: { key: "rear_braking_system", className: "chassis", name: "Rear braking system" },
    reardifferentiallock: { key: "rear_differential_lock", className: "powertrain", name: "Rear differential lock" },
    fronttire: { key: "front_tire_size", className: "tires", name: "Front tire size" },
    fronttiresize: { key: "front_tire_size", className: "tires", name: "Front tire size" },
    reartire: { key: "rear_tire_size", className: "tires", name: "Rear tire size" },
    reartiresize: { key: "rear_tire_size", className: "tires", name: "Rear tire size" },
    wheelbase: { key: "wheelbase", className: "dimensions_weights", name: "Wheelbase" },
    length: { key: "overall_length", className: "dimensions_weights", name: "Overall length" },
    overalllength: { key: "overall_length", className: "dimensions_weights", name: "Overall length" },
    totallength: { key: "overall_length", className: "dimensions_weights", name: "Overall length" },
    width: { key: "overall_width", className: "dimensions_weights", name: "Overall width" },
    overallwidth: { key: "overall_width", className: "dimensions_weights", name: "Overall width" },
    height: { key: "overall_height", className: "dimensions_weights", name: "Overall height" },
    overallheight: { key: "overall_height", className: "dimensions_weights", name: "Overall height" },
    fronttrack: { key: "front_track_width", className: "dimensions_weights", name: "Front track width" },
    reartrack: { key: "rear_track_width", className: "dimensions_weights", name: "Rear track width" },
    maximumspeed: { key: "maximum_speed", className: "dimensions_weights", name: "Maximum speed" },
    maxspeed: { key: "maximum_speed", className: "dimensions_weights", name: "Maximum speed" },
    forwardspeed: { key: "forward_speed_range", className: "performance", name: "Forward speed range" },
    forwardspeedrange: { key: "forward_speed_range", className: "performance", name: "Forward speed range" },
    fueltankcapacity: { key: "fuel_tank_capacity", className: "capacities", name: "Fuel tank capacity" },
    tankcapacity: { key: "fuel_tank_capacity", className: "capacities", name: "Fuel tank capacity" },
    batteryvoltage: { key: "battery_voltage", className: "electrical", name: "Battery voltage" },
    batterycapacity: { key: "battery_capacity", className: "electrical", name: "Battery capacity" },
    alternator: { key: "alternator", className: "electrical", name: "Alternator" },
    safety: { key: "safety_equipment", className: "safety", name: "Safety equipment" },
    rops: { key: "rops_position", className: "safety", name: "ROPS position" },
    rearmirror: { key: "rear_view_mirror_count", className: "operator_station", name: "Rear-view mirror count" },
    rearviewmirror: { key: "rear_view_mirror_count", className: "operator_station", name: "Rear-view mirror count" },
    mechanicallyadjustableseat: { key: "operator_seat_configuration", className: "operator_station", name: "Operator seat configuration" },
    worklights: { key: "front_work_lights_count", className: "electrical", name: "Front work lights count" },
    towhook: { key: "tow_hook", className: "implements", name: "Tow hook" },
  };
  return map[key] ? { ...map[key] } : { key: null, className: null, name: specName };
}
function splitCompositeSpecification(spec: AnyRow): AnyRow[] {
  const originalName = String(spec?.spec_name ?? "").trim();
  const value = String(spec?.spec_value ?? "").trim();
  const evidence = String(spec?.evidence_text ?? "").trim();
  const unit = String(spec?.unit ?? "").trim() || null;
  if (!originalName || !value || !evidence) return [];

  let confidence = Number(spec.confidence ?? 0);
  if (!Number.isFinite(confidence)) confidence = 0;
  confidence = Math.max(0, Math.min(1, confidence > 1 ? confidence / 100 : confidence));
  const pageNumber = Number.isInteger(Number(spec.page_number)) && Number(spec.page_number) > 0 ? Number(spec.page_number) : null;
  const sourceUrl = String(spec.source_url ?? "").trim() || null;
  const out: AnyRow[] = [];
  const push = (name: string, val: string, u: string | null, key?: string | null, cls?: string | null, evidenceText?: string) => {
    const canonical = key === undefined ? canonicalInfo(name) : { key, className: cls ?? null, name };
    out.push({
      spec_name: canonical.name,
      spec_value: val,
      unit: u,
      evidence_text: (evidenceText || evidence).slice(0, 2000),
      page_number: pageNumber,
      confidence,
      source_url: sourceUrl,
      canonical_key: canonical.key,
      comparison_class: canonical.className,
      measurement_standard: String(spec.measurement_standard ?? "").trim() || null,
      rated_rpm: Number.isInteger(Number(spec.rated_rpm)) && Number(spec.rated_rpm) > 0 ? Number(spec.rated_rpm) : null,
    });
  };

  const nameKey = normalise(originalName);
  const combined = `${value} ${unit ?? ""}`.trim();
  const combinedEvidence = `${originalName}: ${evidence}`.slice(0, 2000);

  // Paired manufacturer power fields must be split into independent comparable values.
  // Examples: "Engine Hp(kW) 27 (19.8)" and "PTO PS 21.8 (16.0)".
  if (nameKey === "enginehpkw" || nameKey === "ptops") {
    const pair = value.match(/^\s*([\d.,]+)\s*\(\s*([\d.,]+)\s*\)\s*$/);
    const unitText = String(unit ?? "").toLowerCase();
    const parseNumber = (raw: string) => {
      const v = raw.trim();
      return v.includes(",") ? (/,\d{3}$/.test(v) ? v.replace(/,/g, "") : v.replace(",", ".")) : v;
    };
    if (pair) {
      if (nameKey === "enginehpkw") {
        const primaryUnit = /\bps\b/.test(unitText) ? "PS" : "HP";
        push("Engine power", parseNumber(pair[1]), primaryUnit, "engine_power", "engine", combinedEvidence);
        push("Engine power (kW)", parseNumber(pair[2]), "kW", "engine_power_kw", "engine", combinedEvidence);
      } else {
        push("PTO power", parseNumber(pair[1]), "PS", "pto_power", "power_take_off", combinedEvidence);
        push("PTO power (kW)", parseNumber(pair[2]), "kW", "pto_power_kw", "power_take_off", combinedEvidence);
      }
      return out;
    }
  }

  // Length x Width x Height is a three-field manufacturer dimension row.
  if (nameKey === "lengthxwidthxheight" || nameKey === "overalldimensions") {
    const parts = value.split(/\s*[x×]\s*/i).map((part) => part.trim());
    if (parts.length === 3 && parts.every((part) => /^[\d.,]+$/.test(part))) {
      const parseDimension = (raw: string) => raw.includes(",")
        ? (/,\d{3}$/.test(raw) ? raw.replace(/,/g, "") : raw.replace(",", "."))
        : raw;
      push("Overall length", parseDimension(parts[0]), unit, "overall_length", "dimensions_weights", combinedEvidence);
      push("Overall width", parseDimension(parts[1]), unit, "overall_width", "dimensions_weights", combinedEvidence);
      push("Overall height", parseDimension(parts[2]), unit, "overall_height", "dimensions_weights", combinedEvidence);
      return out;
    }
  }

  // Rated power often arrives as one bilingual unit string; store kW and HP separately.
  if (nameKey === "ratedpower" || nameKey === "ratedpowerece r120".replace(/\s/g, "")) {
    let parsed = 0;
    const kw = combined.match(/([\d.,]+)\s*(?:kw|kilowatts?)/i);
    const hp = combined.match(/([\d.,]+)\s*(?:hp|cv|ps)/i);
    if (kw) { push("Engine power (kW)", kw[1].replace(",", "."), "kW", "engine_power_kw", "engine", combinedEvidence); parsed++; }
    if (hp) { push("Engine power", hp[1].replace(",", "."), "HP", "engine_power", "engine", combinedEvidence); parsed++; }
    if (parsed) return out;
  }

  // A gearbox row such as "9+3 mechanical" is two fields, not a single gearbox type.
  if (nameKey === "gearboxtype") {
    let parsed = 0;
    const gears = combined.match(/(\d+)\s*\+\s*(\d+)/);
    const type = combined.match(/\b(mechanical|hydrostatic|powershift|power\s*shuttle|synchro\s*shuttle|shuttle|CVT|continuously\s*variable)\b/i);
    if (gears) { push("Transmission gear configuration", `${gears[1]}+${gears[2]}`, "gears", "transmission_gear_configuration", "transmission"); parsed++; }
    if (type) { push("Transmission type", type[1].replace(/\s+/g, " "), null, "transmission_type", "transmission"); parsed++; }
    if (parsed) return out;
  }

  // Generic "Capacity" is only a hydraulic flow when the unit explicitly says
  // L/min. Other capacities remain unclassified; no lift/tank meaning is guessed.
  if (nameKey === "capacity") {
    const flow = combined.match(/([\d.,]+)\s*(l\s*\/\s*min|lpm|litres?\s+per\s+minute|liters?\s+per\s+minute)/i);
    if (flow) push("Main hydraulic flow", flow[1].replace(",", "."), "L/min", "hydraulic_main_flow", "hydraulics");
    else push(originalName, value, unit, null, null);
    return out;
  }

  // Generic "Type" is mapped only for explicit hydraulic circuit vocabulary.
  if (nameKey === "type") {
    if (/\b(open\s*cent(?:re|er)|closed\s*cent(?:re|er)|load[- ]sensing|constant[- ]flow|pressure[- ]compensated)\b/i.test(combined)) {
      push("Hydraulic system type", value, null, "hydraulic_system_type", "hydraulics");
    } else {
      push(originalName, value, unit, null, null);
    }
    return out;
  }

  // Hydraulic "capacity" is flow only when the source supplies a flow unit.
  if (nameKey === "hydrauliccapacity") {
    const flow = combined.match(/([\d.,]+)\s*(l\s*\/\s*min|lpm|litres?\s+per\s+minute|liters?\s+per\s+minute)/i);
    if (flow) {
      push("Main hydraulic flow", flow[1].replace(",", "."), "L/min", "hydraulic_main_flow", "hydraulics");
    } else {
      push(originalName, value, unit, null, null);
    }
    return out;
  }

  if (nameKey === "pump") {
    const count = combined.match(/(?:no\.?\s*)?(\d+)/i);
    if (count) push("Hydraulic pump count", String(Number(count[1])), "count", "hydraulic_pump_count", "hydraulics");
    else push(originalName, value, unit, null, null);
    return out;
  }

  if (nameKey === "rearhydraulicspoolvalves") {
    const valve = combined.match(/(\d+)\s+(.+)/i);
    if (valve) {
      push("Rear hydraulic spool valve count", String(Number(valve[1])), "count", "rear_hydraulic_spool_valve_count", "hydraulics");
      push("Rear hydraulic spool valve type", valve[2].trim(), null, "rear_hydraulic_spool_valve_type", "hydraulics");
    } else {
      push(originalName, value, unit, "rear_hydraulic_spool_valves", "hydraulics");
    }
    return out;
  }

  if (nameKey === "rearviewmirror" || nameKey === "rearmirror") {
    const count = combined.match(/(?:no\.?\s*)?(\d+)/i);
    if (count) push("Rear-view mirror count", String(Number(count[1])), "count", "rear_view_mirror_count", "operator_station");
    else push(originalName, value, unit, "rear_view_mirror_count", "operator_station");
    return out;
  }

  if (nameKey === "worklights") {
    const lights = combined.match(/(\d+)\s*(front|rear)?/i);
    if (lights) {
      const position = String(lights[2] ?? "front").toLowerCase();
      const key = position === "rear" ? "rear_work_lights_count" : "front_work_lights_count";
      const name = position === "rear" ? "Rear work lights count" : "Front work lights count";
      push(name, String(Number(lights[1])), "count", key, "electrical");
    } else push(originalName, value, unit, "work_lights", "electrical");
    return out;
  }

  if (nameKey === "mechanicallyadjustableseat") {
    // The row label describes seat adjustment; the value describes belt equipment.
    push("Seat adjustment", "Mechanically adjustable", null, "seat_adjustment", "operator_station", combinedEvidence);
    if (/seat\s*belts?/i.test(combined)) {
      push("Seat belt equipment", "With seat belts", null, "seat_belt_equipment", "operator_station", combinedEvidence);
    }
    return out;
  }

  if (nameKey === "engine") {
    let parsed = 0;
    const cylinders = combined.match(/\b(\d+)\s*(?:cylinders?|cylindres?|cilindros?|cilindri|zylinder)\b/i);
    if (cylinders) { push("Engine cylinders", cylinders[1], "cylinders", "engine_cylinders", "engine"); parsed++; }
    const displacement = combined.match(/\b([\d.,]+)\s*(cc|cm³|cm3|cubic\s*cm|litres?|liters?|l)\b/i);
    if (displacement) {
      const n = displacement[1];
      const u = displacement[2]; // Keep the manufacturer's original unit; do not convert.
      push("Engine displacement", n, u, "engine_displacement", "engine"); parsed++;
    }
    const emission = combined.match(/\b(stage\s*[ivx0-9]+|tier\s*[1-5][a-z]?)\b/i);
    if (emission) { push("Engine emission standard", emission[1].replace(/\s+/g, " "), null, "engine_emission_standard", "engine"); parsed++; }
    const fuel = combined.match(/\b(diesel|petrol|gasoline|electric|hybrid|LPG|CNG)\b/i);
    if (fuel) { push("Engine fuel type", fuel[1], null, "engine_fuel_type", "engine"); parsed++; }
    const make = combined
      .replace(/\b\d+\s*(?:cylinders?|cylindres?|cilindros?|cilindri|zylinder)\b/ig, " ")
      .replace(/\b[\d.,]+\s*(?:cc|cm³|cm3|cubic\s*cm|litres?|liters?|l)\b/ig, " ")
      .replace(/\b(?:stage\s*[ivx0-9]+|tier\s*[1-5][a-z]?|diesel|petrol|gasoline|electric|hybrid|LPG|CNG)\b/ig, " ")
      .replace(/[|,/–—-]+/g, " ").replace(/\s+/g, " ").trim();
    if (make && normalise(make).length >= 3 && !/^engine$/i.test(make)) { push("Engine make", make, null, "engine_make", "engine"); parsed++; }
    if (parsed === 0) push("Engine description", value, unit, "engine_description", "engine");
    return out;
  }

  if (nameKey === "transmission") {
    let parsed = 0;
    const drive = combined.match(/\b(4\s*WD|2\s*WD|4x4|2x4|4-wheel\s*drive|2-wheel\s*drive)\b/i);
    if (drive) { push("Drivetrain", drive[1], null, "drivetrain", "powertrain"); parsed++; }
    const directionalGears = combined.match(/\b(\d+)\s*(?:forward|fwd)\b[\s,;/+-]{0,20}(\d+)\s*(?:reverse|rev)\b/i);
    const gears = combined.match(/\b(\d+)\s*\+\s*(\d+)\b/);
    if (directionalGears) {
      push("Forward gears", directionalGears[1], "gears", "transmission_forward_gears", "powertrain");
      push("Reverse gears", directionalGears[2], "gears", "transmission_reverse_gears", "powertrain");
      parsed += 2;
    } else if (gears) {
      // A bare 9+3 notation is preserved as a configuration; direction is not guessed.
      push("Transmission gear configuration", `${gears[1]}+${gears[2]}`, "gears", "transmission_gear_configuration", "transmission");
      parsed++;
    }
    const type = combined.match(/\b(mechanical|hydrostatic|powershift|power\s*shuttle|synchro\s*shuttle|shuttle|CVT|continuously\s*variable)\b/i);
    if (type) { push("Transmission type", type[1].replace(/\s+/g, " "), null, "transmission_type", "transmission"); parsed++; }
    if (parsed === 0) push("Transmission description", value, unit, "transmission_description", "powertrain");
    return out;
  }

  // LS-style table labels: "Implement Pump" carries a flow unit, while
  // "Category, 3pt hitch (kgf, Linkend)" is the linkage lift-capacity row.
  if (nameKey === "implementpump" || nameKey === "implementpumpflow") {
    if (/^(?:l\s*\/\s*min|lpm)$/i.test(unit ?? "")) {
      push("Main hydraulic flow", value, "L/min", "hydraulic_main_flow", "hydraulics", combinedEvidence);
    } else {
      push(originalName, value, unit, null, null);
    }
    return out;
  }

  const info = canonicalInfo(originalName);
  const weightUnitIsKg = Boolean(unit && /^kg(?:s)?$/i.test(unit.trim()));
  if (info.key === "weight_kg" && !weightUnitIsKg) {
    push(originalName, value, unit, null, null);
  } else if (info.key) {
    push(info.name, value, unit, info.key, info.className);
  } else {
    // A generic word such as Capacity is not enough to infer rear lift capacity,
    // hydraulic capacity, tank volume, or any other specialized comparison key.
    push(originalName, value, unit, null, null);
  }
  return out;
}

const SPEC_OUTPUT_SCHEMA: AnyRow = {
  type: "object",
  properties: {
    model_found: { type: "boolean" },
    model_name: { type: "string" },
    model_year: { type: ["integer", "null"] },
    variant: { type: ["string", "null"] },
    market: { type: "string" },
    source_title: { type: "string" },
    model_identity_evidence: { type: "string" },
    summary: { type: "string" },
    specifications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          spec_name: { type: "string" },
          spec_value: { type: "string" },
          unit: { type: ["string", "null"] },
          evidence_text: { type: "string" },
          page_number: { type: ["integer", "null"] },
          confidence: { type: "number" },
          source_url: { type: ["string", "null"] },
          measurement_standard: { type: ["string", "null"] },
          rated_rpm: { type: ["integer", "null"] },
        },
        required: ["spec_name", "spec_value", "unit", "evidence_text", "page_number", "confidence", "source_url", "measurement_standard", "rated_rpm"],
      },
    },
  },
  required: ["model_found", "model_name", "model_year", "variant", "market", "source_title", "model_identity_evidence", "summary", "specifications"],
};

async function callGeminiWithRetry(payload: AnyRow): Promise<{ response: Response; body: AnyRow; attempts: number; model: string }> {
  const models = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL];
  let lastResponse: Response | null = null;
  let lastBody: AnyRow = {};
  let totalAttempts = 0;
  let lastModel = GEMINI_MODEL;

  // Two bounded attempts per model keep the Edge Function within its execution budget.
  // Start calls allow 60 seconds for manufacturer PDFs; a transport timeout is returned to the queue
  // as a retryable failure rather than immediately resending a large payload and risking duplicates.
  // Only explicit transient HTTP responses trigger the model fallback.
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    lastModel = model;
    for (let attempt = 1; attempt <= 2; attempt++) {
      totalAttempts++;
      const requestPayload = { ...payload, model };
      const response = await fetch(GEMINI_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY, "Api-Revision": "2026-05-20" },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(GEMINI_START_TIMEOUT_MS),
      });
      const body = await response.json().catch(() => ({}));
      lastResponse = response;
      lastBody = body;
      if (response.ok && body?.id) {
        if (model !== GEMINI_MODEL) console.warn(`[gemini] fallback model succeeded: ${model}`);
        return { response, body, attempts: totalAttempts, model };
      }

      const message = String(body?.error?.message ?? "").toLowerCase();
      const dailyQuota = /per day|daily|per-day|requests per day|limit:\s*\d+.*day|quota exceeded|resource exhausted/i.test(message);
      const transientServerError = [500, 502, 503, 504].includes(response.status);
      const retryableRateLimit = response.status === 429 && !dailyQuota;
      const transient = transientServerError || retryableRateLimit;
      if (!transient || dailyQuota) {
        return { response, body, attempts: totalAttempts, model };
      }

      if (attempt === 2) {
        if (transientServerError && modelIndex < models.length - 1) {
          console.warn(`[gemini] model ${model} returned HTTP ${response.status} twice; trying fallback ${models[modelIndex + 1]}`);
          break;
        }
        return { response, body, attempts: totalAttempts, model };
      }

      const delayMs = 4_000;
      console.warn(`[gemini] transient HTTP ${response.status} on ${model}; retry ${attempt + 1}/2 after ${delayMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  if (!lastResponse) throw new Error("Gemini API isteği başlatılamadı.");
  return { response: lastResponse, body: lastBody, attempts: totalAttempts, model: lastModel };
}

function isRetryableProviderError(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  if (/per day|daily quota|requests per day|limit:\s*\d+.*day|quota exceeded|resource exhausted/.test(lower)) return false;
  return [500, 502, 503, 504].includes(status) || (status === 429 && !/quota exceeded|resource exhausted/.test(lower));
}

function queueAuthorized(req: Request): boolean {
  if (!TC_QUEUE_SECRET) return false;
  const supplied = req.headers.get("x-queue-secret") ?? "";
  if (!supplied || supplied.length !== TC_QUEUE_SECRET.length) return false;
  let diff = 0;
  for (let i = 0; i < supplied.length; i++) diff |= supplied.charCodeAt(i) ^ TC_QUEUE_SECRET.charCodeAt(i);
  return diff === 0;
}

async function enqueueCatalog() {
  const { data: tractors, error } = await db.from("tractors")
    .select("id,brand_id,status")
    .neq("status", "archived")
    .limit(2000);
  if (error) throw new Error(`Katalog kuyruğa alınamadı: ${error.message}`);
  const { data: recentRuns, error: runsError } = await db.from("ai_research_runs")
    .select("tractor_id,status,completed_at")
    .eq("status", "completed")
    .gte("completed_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
    .limit(5000);
  if (runsError) throw new Error(`Son araştırmalar okunamadı: ${runsError.message}`);
  const researched = new Set((recentRuns ?? []).map((r: AnyRow) => String(r.tractor_id ?? "")).filter(Boolean));
  const { data: existingQueue, error: queueReadError } = await db.from("tractor_research_queue")
    .select("id,tractor_id,status,completed_at,updated_at")
    .limit(3000);
  if (queueReadError) throw new Error(`Mevcut kuyruk kayıtları okunamadı: ${queueReadError.message}`);
  const queuedByTractor = new Map((existingQueue ?? []).map((q: AnyRow) => [String(q.tractor_id), q]));
  const cutoffMs = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const newRows: AnyRow[] = [];
  const requeueRows: AnyRow[] = [];
  let skippedRecent = 0;
  let skippedAlreadyQueued = 0;
  for (const tractor of tractors ?? []) {
    const tractorId = String(tractor.id);
    if (researched.has(tractorId)) { skippedRecent++; continue; }
    const existing = queuedByTractor.get(tractorId) as AnyRow | undefined;
    const row = {
      priority: tractor.status === "published" ? 10 : 50,
      status: "queued",
      attempt_count: 0,
      last_run_id: null,
      last_error: null,
      next_attempt_at: new Date().toISOString(),
      completed_at: null,
      updated_at: new Date().toISOString(),
    };
    if (!existing) {
      newRows.push({ tractor_id: tractor.id, ...row });
    } else if (existing.status === "completed" && existing.completed_at && new Date(existing.completed_at).getTime() < cutoffMs) {
      requeueRows.push({ id: existing.id, ...row });
    } else {
      skippedAlreadyQueued++;
    }
  }
  if (newRows.length) {
    const { error: insertError } = await db.from("tractor_research_queue").insert(newRows);
    if (insertError) throw new Error(`Yeni araştırma kuyruğu kayıtları yazılamadı: ${insertError.message}`);
  }
  for (const row of requeueRows) {
    const { id, ...values } = row;
    const { error: updateError } = await db.from("tractor_research_queue").update(values).eq("id", id);
    if (updateError) throw new Error(`Eski araştırma kuyruğu kaydı yenilenemedi: ${updateError.message}`);
  }
  const queued = newRows.length + requeueRows.length;
  return json(200, { success: true, queued_candidates: queued, inserted_new: newRows.length, requeued_stale_completed: requeueRows.length, skipped_recently_researched: skippedRecent, skipped_already_queued: skippedAlreadyQueued, message: "Araştırma kuyruğu güncellendi. process_queue bir, process_queue_batch ise güvenli biçimde en fazla üç traktör işler." });
}

async function queueStats() {
  const statuses = ["queued", "running", "retry", "completed", "failed", "needs_source"];
  const counts: AnyRow = {};
  for (const status of statuses) {
    const { count, error } = await db.from("tractor_research_queue").select("id", { count: "exact", head: true }).eq("status", status);
    if (error) throw new Error(`Kuyruk durumu okunamadı: ${error.message}`);
    counts[status] = count ?? 0;
  }
  return json(200, { success: true, queue: counts });
}

async function processQueue() {
  const { data: claimed, error: claimError } = await db.rpc("tc_claim_next_tractor_research");
  if (claimError) throw new Error(`Kuyruktan iş alınamadı: ${claimError.message}`);
  const item = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!item) return json(200, { success: true, message: "İşlenecek kuyruk kaydı yok." });

  const { data: tractor, error: tractorError } = await db.from("tractors").select("*").eq("id", item.tractor_id).single();
  if (tractorError || !tractor) {
    await db.from("tractor_research_queue").update({ status: "failed", last_error: tractorError?.message ?? "Traktör kaydı bulunamadı.", updated_at: new Date().toISOString() }).eq("id", item.id);
    return json(404, { success: false, error: "Kuyruktaki traktör kaydı bulunamadı.", queue_id: item.id });
  }
  const { data: brand, error: brandError } = await db.from("brands").select("name,website_url").eq("id", tractor.brand_id).single();
  if (brandError || !brand) {
    await db.from("tractor_research_queue").update({ status: "failed", last_error: brandError?.message ?? "Marka bulunamadı.", updated_at: new Date().toISOString() }).eq("id", item.id);
    return json(404, { success: false, error: "Kuyruktaki traktörün markası bulunamadı.", queue_id: item.id });
  }

  let response: Response;
  if (item.last_run_id) {
    response = await pollResearch({ run_id: item.last_run_id });
  } else {
    response = await startResearch({
      action: "start",
      brand: brand.name,
      model: tractor.model_name,
      model_year: tractor.model_year,
      variant: cleanCatalogVariant(tractor.variant),
      market: tractor.market ?? "global",
      target_tractor_id: tractor.id,
    });
  }
  const result = await response.json().catch(() => ({}));
  const now = new Date().toISOString();
  const runId = String(result.run_id ?? item.last_run_id ?? "") || null;
  const message = [result.error, result.details?.message, result.message].filter(Boolean).map(String).join(" | ");
  if (result.success && (result.model_found === false || result.tractor_match_required === true)) {
    const reviewMessage = result.model_found === false
      ? "Resmî sayfada tam model kimliği doğrulanamadı; kaynak/model kontrolü gerekiyor."
      : "Birden fazla katalog kaydı eşleşti veya kayıt eşleştirmesi belirsiz; manuel kontrol gerekiyor.";
    await db.from("tractor_research_queue").update({ status: "needs_source", last_run_id: runId, last_error: reviewMessage, updated_at: now }).eq("id", item.id);
  } else if (result.success && (result.review_status === "needs_source")) {
    await db.from("tractor_research_queue").update({ status: "needs_source", last_run_id: runId, last_error: "Araştırma tamamlandı ancak teknik bulgular kayıt altına alınamadı; kaynak/model denetimi gerekiyor.", updated_at: now }).eq("id", item.id);
  } else if (result.success && (result.review_status || result.status === "completed" || result.message === "Bu araştırma daha önce tamamlandı.")) {
    await db.from("tractor_research_queue").update({ status: "completed", last_run_id: runId, last_error: null, completed_at: now, updated_at: now }).eq("id", item.id);
  } else if (result.success && (response.status === 202 || result.status === "running")) {
    const next = new Date(Date.now() + 60_000).toISOString();
    await db.from("tractor_research_queue").update({ status: "retry", last_run_id: runId, next_attempt_at: next, last_error: "Gemini işlemi devam ediyor; sonraki çağrıda durum kontrol edilecek.", updated_at: now }).eq("id", item.id);
  } else if (response.status === 422) {
    await db.from("tractor_research_queue").update({ status: "needs_source", last_run_id: runId, last_error: message.slice(0, 1500), updated_at: now }).eq("id", item.id);
  } else if ((isRetryableProviderError(Number(result.http_status ?? response.status), message) || (/503|service_unavailable|high demand/i.test(message) && result.status === "failed")) && Number(item.attempt_count ?? 0) < 30) {
    const delayMinutes = Math.min(60, Math.pow(2, Math.min(Number(item.attempt_count ?? 1), 5)));
    const stillPolling = Boolean(item.last_run_id) && result.status !== "failed" && response.status !== 422;
    await db.from("tractor_research_queue").update({ status: "retry", last_run_id: stillPolling ? String(item.last_run_id) : (response.status === 202 ? runId : null), next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(), last_error: message.slice(0, 1500), updated_at: now }).eq("id", item.id);
  } else {
    await db.from("tractor_research_queue").update({ status: "failed", last_run_id: runId, last_error: message.slice(0, 1500) || `HTTP ${response.status}`, updated_at: now }).eq("id", item.id);
  }
  return json(200, { success: Boolean(result.success), queue_id: item.id, tractor_id: tractor.id, brand: brand.name, model: tractor.model_name, http_status: response.status, research: result });
}

// Sequential batch processing keeps the existing SKIP LOCKED claim RPC,
// avoids parallel Gemini bursts, and reserves 65 seconds for one slow job
// within the 105-second batch guard.
async function processQueueBatch(body: AnyRow) {
  const requested = Number(body.batch_size ?? body.max_items ?? 3);
  const batchSize = Number.isFinite(requested) ? Math.max(1, Math.min(3, Math.trunc(requested))) : 3;
  const startedAt = Date.now();
  const maxRuntimeMs = 105_000;
  const reserveForOneSlowJobMs = 65_000;
  const results: AnyRow[] = [];
  let stopReason = "batch_limit_reached";

  for (let index = 0; index < batchSize; index++) {
    if (Date.now() - startedAt >= maxRuntimeMs - reserveForOneSlowJobMs) {
      stopReason = "runtime_guard_reserved_for_slow_job";
      break;
    }

    let response: Response;
    let payload: AnyRow;
    try {
      response = await processQueue();
      payload = await response.json().catch(() => ({}));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ success: false, error: message.slice(0, 1200) });
      stopReason = "worker_exception";
      break;
    }

    if (payload.message === "İşlenecek kuyruk kaydı yok.") {
      stopReason = "queue_empty";
      break;
    }

    results.push({
      success: Boolean(payload.success),
      queue_id: payload.queue_id ?? null,
      tractor_id: payload.tractor_id ?? null,
      brand: payload.brand ?? null,
      model: payload.model ?? null,
      http_status: payload.http_status ?? response.status,
      run_id: payload.research?.run_id ?? null,
      research_status: payload.research?.review_status ?? payload.research?.status ?? null,
      specifications_found: payload.research?.specifications_found ?? null,
      pending_findings_saved: payload.research?.pending_findings_saved ?? null,
      automatic_spec_updates: payload.research?.specifications_updated_automatically ?? null,
      source_count: payload.research?.source_count ?? null,
      pdf_count: payload.research?.pdf_count ?? null,
      model_used: payload.research?.model_used ?? null,
      error: payload.error ?? payload.research?.error ?? null,
      details: payload.research?.details ?? null,
    });

    // Stop after an upstream 5xx for a claimed item. Do not consume more queue jobs
    // while the model provider is timing out or unavailable. The claimed item is
    // already placed into retry by processQueue; remaining jobs stay queued.
    const itemHttpStatus = Number(payload.http_status ?? response.status);
    if (!payload.success && itemHttpStatus >= 500) {
      stopReason = "upstream_error";
      break;
    }

    // Unexpected outer worker failures should not consume more queue items.
    if (response.status >= 500 && !payload.queue_id) {
      stopReason = "worker_http_error";
      break;
    }
  }

  const failed = results.filter((item) => item.success === false).length;
  return json(200, {
    success: true,
    requested_batch_size: batchSize,
    processed: results.length,
    failed,
    elapsed_ms: Date.now() - startedAt,
    stop_reason: stopReason,
    results,
    message: "Toplu kuyruk çalışması tamamlandı. Her traktör ayrı kaynak ve bulgu kaydıyla işlendi.",
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function findingFingerprint(row: AnyRow): string {
  const rawName = normalise(row.spec_name);
  let canonical = String(row.canonical_key ?? canonicalInfo(String(row.spec_name ?? "")).key ?? normalise(row.spec_name));
  let value = normalise(row.spec_value);
  let unit = normalise(row.unit ?? "");

  // Stable aliases let a previously pending raw row be reused after it becomes atomic.
  if ((rawName === "hydrauliccapacity" || rawName === "capacity") && /(?:l\s*\/\s*min|lpm|litres?\s+per\s+minute|liters?\s+per\s+minute)/i.test(`${row.unit ?? ""} ${row.spec_value ?? ""}`)) {
    canonical = "hydraulic_main_flow";
    unit = normalise("L/min");
  }
  if (rawName === "type" && /open\s*cent(?:re|er)|closed\s*cent(?:re|er)|load[- ]sensing/i.test(String(row.spec_value ?? ""))) {
    canonical = "hydraulic_system_type";
    unit = "";
  }
  if (rawName === "pump") {
    const count = String(row.spec_value ?? "").match(/(?:no\.?\s*)?(\d+)/i);
    if (count) { canonical = "hydraulic_pump_count"; value = normalise(String(Number(count[1]))); unit = normalise("count"); }
  }
  if (rawName === "rearviewmirror" || rawName === "rearmirror") {
    const count = String(row.spec_value ?? "").match(/(?:no\.?\s*)?(\d+)/i);
    if (count) { canonical = "rear_view_mirror_count"; value = normalise(String(Number(count[1]))); unit = normalise("count"); }
  }
  if (rawName === "worklights") {
    const lights = String(row.spec_value ?? "").match(/(\d+)\s*(front|rear)?/i);
    if (lights) {
      canonical = String(lights[2] ?? "front").toLowerCase() === "rear" ? "rear_work_lights_count" : "front_work_lights_count";
      value = normalise(String(Number(lights[1])));
      unit = normalise("count");
    }
  }

  return [
    canonical,
    value,
    unit,
    normalise(row.measurement_standard ?? ""),
    String(Number(row.rated_rpm ?? 0)),
  ].join("::");
}

async function startResearch(body: AnyRow) {
  if (!GEMINI_API_KEY) return json(500, { success: false, error: "GEMINI_API_KEY Edge Function secret tanımlı değil." });
  const brandInput = String(body.brand ?? "").trim();
  const modelInput = String(body.model ?? "").trim();
  const yearInput = body.model_year === null || body.model_year === undefined || body.model_year === "" ? null : Number(body.model_year);
  const variantInput = cleanCatalogVariant(body.variant);
  const marketInput = String(body.market ?? "global").trim() || "global";
  if (!brandInput || !modelInput) return json(400, { success: false, error: "brand ve model alanları zorunludur." });
  if (brandInput.length > 100 || modelInput.length > 120) return json(400, { success: false, error: "Marka veya model adı çok uzun." });
  if (yearInput !== null && (!Number.isInteger(yearInput) || yearInput < 1900 || yearInput > 2100)) return json(400, { success: false, error: "model_year geçerli bir yıl olmalıdır." });

  const { data: brand, error: brandError } = await db.from("brands").select("id,name,website_url").ilike("name", brandInput).maybeSingle();
  if (brandError) throw new Error(`Marka sorgusu başarısız: ${brandError.message}`);
  if (!brand) return json(404, { success: false, error: `Marka bulunamadı: ${brandInput}` });

  // Queue-originated research is pinned to the exact tractor row that was claimed.
  // This is not fuzzy matching: the ID must belong to the same brand and exact model.
  const targetTractorId = String(body.target_tractor_id ?? "").trim() || null;
  let pinnedTarget: AnyRow | null = null;
  if (targetTractorId) {
    const { data: candidate, error: targetError } = await db.from("tractors")
      .select("id,brand_id,model_name,model_year,variant,market,status")
      .eq("id", targetTractorId).maybeSingle();
    if (targetError) throw new Error(`Kuyruk hedef modeli doğrulanamadı: ${targetError.message}`);
    if (!candidate || candidate.status === "archived"
      || String(candidate.brand_id) !== String(brand.id)
      || normalise(candidate.model_name) !== normalise(modelInput)) {
      return json(409, { success: false, error: "Kuyruk hedef ID'si marka ve model adıyla birebir eşleşmiyor; araştırma başlatılmadı.", target_tractor_id: targetTractorId });
    }
    if (yearInput !== null && Number(candidate.model_year) !== yearInput) {
      return json(409, { success: false, error: "Kuyruk hedef ID'sinin model yılı istenen yılla eşleşmiyor.", target_tractor_id: targetTractorId });
    }
    const storedVariant = cleanCatalogVariant(candidate.variant);
    if (variantInput && (!storedVariant || normalise(storedVariant) !== normalise(variantInput))) {
      return json(409, { success: false, error: "Kuyruk hedef ID'sinin varyantı istenen varyantla birebir eşleşmiyor.", target_tractor_id: targetTractorId });
    }
    pinnedTarget = candidate;
  }

  const { data: storedSources, error: sourceError } = await db.from("data_sources")
    .select("publisher,source_url,source_type,notes,accessed_at,source_priority")
    .ilike("publisher", String(brand.name)).order("accessed_at", { ascending: false }).limit(50);
  if (sourceError) throw new Error(`Kaynak listesi okunamadı: ${sourceError.message}`);

  const explicitUrl = body.source_url ? String(body.source_url).trim() : undefined;
  const source = chooseSource(brand, modelInput, storedSources ?? [], explicitUrl);
  if (!source) return json(422, { success: false, error: "Bu marka için güvenilir resmî kaynak bulunamadı.", hint: "brands.website_url alanına üreticinin HTTPS web adresini ekleyin." });

  const query = `${brand.name} / ${modelInput}${yearInput ? ` ${yearInput}` : ""} official tractor specifications`;
  const { data: run, error: runError } = await db.from("ai_research_runs").insert({
    trigger_type: "manual", status: "running", brand_id: brand.id, tractor_id: pinnedTarget?.id ?? null,
    search_query: query, requested_model: modelInput, requested_year: yearInput,
    requested_variant: variantInput, requested_market: marketInput, source_url: source.url,
    gemini_model: GEMINI_MODEL, summary: "Üreticinin resmî ürün sayfası, teknik bağlantıları ve katalog kaynakları taranıyor.",
  }).select("*").single();
  if (runError || !run) throw new Error(`Araştırma kaydı oluşturulamadı: ${runError?.message ?? "Bilinmeyen hata"}`);

  let packets: SourcePacket[];
  try {
    packets = await discoverOfficialSources(brand, modelInput, source, variantInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.from("ai_research_runs").update({ status: "failed", error_message: message.slice(0, 2000), result_meta: { phase: "official_source_discovery", diagnostic: message.slice(0, 2000) }, completed_at: new Date().toISOString() }).eq("id", run.id);
    return json(422, { success: false, error: "Resmî kaynak taraması tamamlanamadı.", details: message, run_id: run.id });
  }

  const brandKeyForSource = normalise(brand.name);
  const documentRows = await Promise.all(packets.map(async (packet) => {
    const contentHash = await sha256Hex(packet.text ?? packet.pdfBase64 ?? packet.finalUrl);
    const versionLabel = packet.lastModified || packet.etag || `sha256:${contentHash.slice(0, 16)}`;
    const relevance = sourceRelevance(
      packet.source.url,
      String(packet.source.linkLabel ?? packet.source.notes ?? ""),
      packet.source.discoveryParentUrl ?? null,
      modelInput,
      packet.pdfBase64 !== null,
    );
    const isPreferredTechnicalSource = relevance.preferred;
    const effectivePriority = relevance.priority;
    // Keep both document metadata and data_sources metadata consistent.
    packet.source.priority = effectivePriority;
    return {
      run_id: run.id,
      source_url: packet.source.url,
      title: packet.title.slice(0, 500),
      source_type: packet.pdfBase64 ? "pdf" : "web_page",
      accessed_at: new Date().toISOString(),
      content_hash: contentHash,
      version_label: versionLabel.slice(0, 250),
      version_rank: null,
      is_preferred_technical_source: isPreferredTechnicalSource,
      source_priority: effectivePriority,
      source_relevance_score: relevance.score,
      model_specific: relevance.modelSpecific,
      source_relevance_reason: relevance.reason,
      content_bytes: packet.byteLength,
      discovery_method: packet.source.discoveryMethod ?? "registered_source",
      discovery_parent_url: packet.source.discoveryParentUrl ?? null,
      link_label: packet.source.linkLabel ?? packet.source.notes ?? null,
      final_url: packet.finalUrl,
      http_status: packet.httpStatus,
      content_chars: packet.text?.length ?? null,
      source_last_modified: packet.lastModified,
      source_etag: packet.etag,
      notes: `${packet.source.notes}\nOfficial same-domain source; HTTP ${packet.httpStatus}; priority ${packet.source.priority}; version ${versionLabel}; SHA-256 ${contentHash}; ${packet.pdfBase64 ? `PDF ${packet.byteLength} bytes` : `${packet.text?.length ?? 0} extracted characters`}.\n${packet.text && extractExactModelIdentityEvidence(packet.text, modelInput) ? `TC_EXACT_MODEL_EVIDENCE:${normalise(modelInput)}:${extractExactModelIdentityEvidence(packet.text, modelInput)}` : "TC_EXACT_MODEL_EVIDENCE:none"}\n${packet.text && variantInput && brandKeyForSource === "lstractor" && normalise(modelInput) === "j27" && extractExactModelVariantIdentityEvidence(packet.text, modelInput, variantInput) ? `TC_EXACT_VARIANT_EVIDENCE:${normalise(modelInput)}:${normalise(variantInput)}:${extractExactModelVariantIdentityEvidence(packet.text, modelInput, variantInput)}` : "TC_EXACT_VARIANT_EVIDENCE:not_required_or_not_found"}`,
    };
  }));
  const { data: documents, error: documentsError } = await db.from("ai_research_documents").insert(documentRows).select("id,source_url,source_type,source_priority,notes");
  if (documentsError || !documents?.length) {
    await db.from("ai_research_runs").update({ status: "failed", error_message: `Kaynak belgeleri kaydedilemedi: ${documentsError?.message ?? "Kayıt dönmedi"}`, completed_at: new Date().toISOString() }).eq("id", run.id);
    throw new Error(`Kaynak belgeleri kaydedilemedi: ${documentsError?.message ?? "Kayıt dönmedi"}`);
  }
  const docsByUrl = new Map<string, AnyRow>();
  for (const doc of documents) docsByUrl.set(String(doc.source_url), doc);
  for (const packet of packets) packet.documentId = String(docsByUrl.get(packet.source.url)?.id ?? "");
  for (const packet of packets) await getOrCreateDataSource(brand.name, packet.source);

  const prompt = `You are a strict agricultural machinery technical researcher. You MUST use ONLY the attached source material fetched by this application from the manufacturer's official domain. Never use prior knowledge, other websites, assumptions, typical values, or inferred values.

REQUESTED IDENTITY
Brand: ${brand.name}
Exact model: ${modelInput}
Requested year: ${yearInput ?? "not specified"}
Requested variant: ${variantInput ?? "not specified"}
Market: ${marketInput}

RESEARCH RULES
1. Confirm the EXACT model. Similar names, adjacent models and family-series pages are not enough. If exact identity is not proven, model_found=false and specifications=[]
2. Extract only explicit values for that exact model and requested variant. A table row or text must clearly apply to that exact model/variant. For LS Mtron J27, the official J family page has separate J27 HST and J27 GEAR columns: use only the requested column and never combine values across them.
3. Prefer official model-specific technical sheets/manuals/PDFs over short marketing pages. A newer source is not automatically better unless its publication/version date proves that.
4. Ignore legal/privacy policies, cookies/terms, general corporate documents, and noise/opacity compliance PDFs when extracting tractor specifications. Do not infer technical values from them even if they are linked from the product page.
4. For every spec return the exact source_url from the source labels, a short verbatim evidence_text, and PDF page_number when applicable.
5. Do not merge measurements with different standards, rated RPM, variant, market or year. Put measurement_standard and rated_rpm in separate fields.
6. Do NOT reinterpret generic "Capacity". It might be lifting, tank, load or another capacity. Keep the exact source label; do not rename it "Rear lift capacity" unless the source says so.
7. Do not place a combined engine or transmission paragraph in a single field when the parts are explicit. You may return atomic items such as Engine make, Engine cylinders, Engine displacement, Engine fuel type, Engine emission standard, Drivetrain, Forward gears, Reverse gears and Transmission type.
8. For transmission notation 9+3, do not assume direction unless source context clearly says forward/reverse gear counts. If ambiguous return the original combined label/value.
9. Keep units exactly as shown. Do not convert units. Use confidence from 0 to 1 (not 0 to 100); 1.0 only for explicit exact-source values.
10. Include at most 40 specs. Use null for absent fields. No invented model years or variants. A brochure publication/print/copyright/access date is NOT a tractor model year; set model_year=null unless the source explicitly identifies the tractor's model year.
11. STRICT VARIANT RULE: Requested variant is ${variantInput ?? "not specified"}. Never take a value from a conflicting sibling version (for example 2WD vs 4WD, cabin vs platform). When a source or table contains multiple variants, extract a value only when the relevant row/column is explicitly tied to the requested variant; quote that variant in evidence_text. If the correct column cannot be established, omit the value or leave it pending. Do not infer that sibling variants share a specification.

SOURCE MATERIAL (all URLs belong to the registered manufacturer's official domain):
${packets.map((packet, i) => `\n--- SOURCE ${i + 1} ---\nURL: ${packet.source.url}\nTITLE: ${packet.title}\nTYPE: ${packet.pdfBase64 ? "OFFICIAL PDF DOCUMENT ATTACHED" : "OFFICIAL WEB PAGE TEXT"}\n${packet.text ? packet.text : "PDF content is attached as a document input part. Read its tables and footnotes directly."}`).join("\n")}

Return the exact requested JSON object. For each specification, source_url MUST be exactly one of the URLs above. Do not create URLs. If no reliable exact-model specifications exist, return an empty array.`;

  const inputParts: AnyRow[] = [{ type: "text", text: prompt }];
  for (const packet of packets) {
    if (packet.pdfBase64) inputParts.push({ type: "document", data: packet.pdfBase64, mime_type: "application/pdf" });
  }
  const totalHtmlChars = packets.reduce((sum, packet) => sum + (packet.text?.length ?? 0), 0);
  const geminiPayload: AnyRow = {
    model: GEMINI_MODEL,
    input: inputParts,
    response_format: { type: "text", mime_type: "application/json", schema: SPEC_OUTPUT_SCHEMA },
    generation_config: { max_output_tokens: 12000 },
    store: true,
  };

  console.log(`[start] Gemini primary=${GEMINI_MODEL}; fallback=${GEMINI_FALLBACK_MODEL}; requested variant=${variantInput ?? "unspecified"}; official sources=${packets.length}; HTML chars=${totalHtmlChars}; PDFs=${packets.filter((p) => p.pdfBase64).length}`);
  let gemini: { response: Response; body: AnyRow; attempts: number; model: string };
  try {
    gemini = await callGeminiWithRetry(geminiPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.from("ai_research_runs").update({ status: "failed", error_message: message.slice(0, 2000), completed_at: new Date().toISOString() }).eq("id", run.id);
    return json(502, { success: false, error: "Gemini bağlantı isteği başarısız oldu.", details: message, run_id: run.id });
  }

  const { response: geminiResponse, body: geminiBody, attempts } = gemini;
  if (!geminiResponse.ok || !geminiBody.id) {
    const message = String(geminiBody?.error?.message ?? `Gemini HTTP ${geminiResponse.status}`);
    await db.from("ai_research_runs").update({ status: "failed", error_message: message.slice(0, 2000), result_meta: { http_status: geminiResponse.status, retry_attempts: attempts }, completed_at: new Date().toISOString() }).eq("id", run.id);
    return json(502, { success: false, error: "Gemini araştırması başlatılamadı.", http_status: geminiResponse.status, details: geminiBody?.error ?? message, run_id: run.id, model_used: gemini.model, retry_attempts: attempts });
  }
  if (String(geminiBody.status ?? "").toLowerCase() === "failed") {
    const details = interactionDiagnostics(geminiBody);
    const firstError = Array.isArray(geminiBody.errors) ? geminiBody.errors[0] : null;
    const message = String(firstError?.message ?? firstError?.code ?? "Gemini interaction failed.");
    await db.from("ai_research_runs").update({ status: "failed", gemini_interaction_id: geminiBody.id, gemini_model: gemini.model, error_message: message.slice(0, 2000), result_meta: details, completed_at: new Date().toISOString() }).eq("id", run.id);
    return json(502, { success: false, run_id: run.id, status: "failed", error: message, diagnostics: details });
  }

  const { error: updateRunError } = await db.from("ai_research_runs").update({
    gemini_interaction_id: geminiBody.id,
    gemini_model: gemini.model,
    status: "running",
    summary: `Gemini ${packets.length} resmî kaynak üzerinde teknik özellikleri çıkarıyor.`,
    error_message: null,
    result_meta: { sources_discovered: packets.length, source_urls: packets.map((p) => p.source.url), retry_attempts: attempts, extracted_html_chars: totalHtmlChars },
  }).eq("id", run.id);
  if (updateRunError) throw new Error(`Gemini işi kaydedilemedi: ${updateRunError.message}`);

  const hasModelOutput = Array.isArray(geminiBody.steps) && geminiBody.steps.some((step: AnyRow) => step?.type === "model_output");
  const interactionStatus = String(geminiBody.status ?? "").toLowerCase();
  if (interactionStatus === "completed" || hasModelOutput || typeof geminiBody.output_text === "string") {
    try {
      const result = await completeResearch({ ...run, gemini_interaction_id: geminiBody.id, gemini_model: gemini.model }, geminiBody);
      return json(200, {
        ...result,
        interaction_id: geminiBody.id,
        model_used: gemini.model,
        source_count: packets.length,
        source_urls: packets.map((p) => p.source.url),
        source_fetched_text_chars: totalHtmlChars,
        pdf_count: packets.filter((p) => p.pdfBase64).length,
        retry_attempts: attempts,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db.from("ai_research_runs").update({ status: "failed", error_message: message.slice(0, 2000), completed_at: new Date().toISOString() }).eq("id", run.id);
      return json(500, { success: false, run_id: run.id, status: "failed", error: message, interaction_id: geminiBody.id });
    }
  }
  return json(202, {
    success: true,
    message: "Gemini isteği kabul edildi; kaynak taraması ve çıkarım devam ediyor.",
    status: geminiBody.status ?? "in_progress",
    run_id: run.id,
    interaction_id: geminiBody.id,
    brand: brand.name,
    model: modelInput,
    model_used: GEMINI_MODEL,
    source_count: packets.length,
    source_urls: packets.map((p) => p.source.url),
    source_fetched_text_chars: totalHtmlChars,
    next_action: "status",
  });
}


function extractModelTextAndCitations(interaction: AnyRow): { text: string; citations: string[] } {
  const texts: string[] = [];
  const citations = new Set<string>();
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];

  for (const step of steps) {
    if (step?.type !== "model_output") continue;
    const content = Array.isArray(step.content) ? step.content : [];
    for (const block of content) {
      if (block?.type === "text" && typeof block.text === "string") texts.push(block.text);
      const annotations = Array.isArray(block?.annotations) ? block.annotations : [];
      for (const annotation of annotations) {
        if (annotation?.type === "url_citation" && typeof annotation.url === "string") {
          citations.add(annotation.url);
        }
      }
    }
  }

  if (texts.length === 0 && typeof interaction.output_text === "string") texts.push(interaction.output_text);
  if (texts.length === 0 && Array.isArray(interaction.outputs)) {
    for (const item of interaction.outputs) if (typeof item?.text === "string") texts.push(item.text);
  }
  return { text: texts.join("\n").trim(), citations: [...citations] };
}

function parseJsonOutput(text: string): AnyRow {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch { /* try to isolate JSON */ }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
  throw new Error("Gemini yanıtında geçerli JSON bulunamadı.");
}

async function getOrCreateDataSource(brandName: string, source: SourceChoice) {
  const { data: existing, error: readError } = await db.from("data_sources")
    .select("id,source_priority").eq("source_url", source.url).limit(1).maybeSingle();
  if (readError) throw new Error(`Kaynak kontrolü başarısız: ${readError.message}`);
  if (existing?.id) {
    if (Number(existing.source_priority ?? 0) < source.priority) {
      await db.from("data_sources").update({ source_priority: source.priority, accessed_at: new Date().toISOString() }).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data: created, error: insertError } = await db.from("data_sources").insert({
    publisher: brandName,
    source_url: source.url,
    source_type: source.sourceType,
    accessed_at: new Date().toISOString(),
    notes: source.notes || "Official manufacturer source used by TractorCompare AI research",
    source_priority: source.priority,
  }).select("id").single();
  if (insertError || !created) throw new Error(`Kaynak veritabanına eklenemedi: ${insertError?.message ?? "Bilinmeyen hata"}`);
  return created.id;
}


async function completeResearch(runInput: AnyRow, interaction: AnyRow) {
  const runId = String(runInput?.id ?? "").trim();
  if (!runId) throw new Error("Araştırma kaydı tamamlanamadı: run_id eksik.");
  const { data: storedRun, error: storedRunError } = await db.from("ai_research_runs").select("*").eq("id", runId).single();
  if (storedRunError || !storedRun) throw new Error(`Araştırma kaydının tam satırı okunamadı: ${storedRunError?.message ?? "Kayıt bulunamadı."}`);
  const run: AnyRow = { ...(runInput ?? {}), ...storedRun };
  if (typeof run.brand_id !== "string" || !run.brand_id.trim()) throw new Error(`Araştırma kaydında brand_id eksik (run_id=${runId}).`);

  const { data: brand, error: brandError } = await db.from("brands").select("id,name,website_url").eq("id", run.brand_id).single();
  if (brandError || !brand) throw new Error(`Araştırma markası bulunamadı: ${brandError?.message ?? ""}`);
  const { data: documents, error: documentsError } = await db.from("ai_research_documents")
    .select("id,source_url,source_type,notes,source_priority,source_relevance_score,source_relevance_reason,is_preferred_technical_source,model_specific,final_url,http_status,content_chars,content_bytes,content_hash,source_last_modified,source_etag,version_label")
    .eq("run_id", run.id)
    .order("is_preferred_technical_source", { ascending: false })
    .order("source_priority", { ascending: false })
    .order("source_relevance_score", { ascending: false });
  if (documentsError || !documents?.length) throw new Error(`Araştırma kaynak belgeleri bulunamadı: ${documentsError?.message ?? ""}`);

  const officialHost = hostOf(String(brand.website_url ?? "")) || hostOf(String(documents[0].source_url));
  const documentMap = new Map<string, AnyRow>();
  const sourceChoices: SourceChoice[] = documents.map((doc: AnyRow) => {
    const url = String(doc.source_url);
    documentMap.set(url, doc);
    return {
      url,
      sourceType: String(doc.source_type ?? "web_page"),
      publisher: brand.name,
      notes: String(doc.notes ?? ""),
      isPdf: String(doc.source_type) === "pdf" || isPdfSource(url, String(doc.source_type ?? "")),
      officialHost,
      priority: Number(doc.source_priority ?? (String(doc.source_type) === "pdf" ? 100 : 80)),
    };
  });

  const { text: outputText, citations: apiCitations } = extractModelTextAndCitations(interaction);
  if (!outputText) throw new Error("Gemini tamamlandı ancak metin yanıtı boş geldi.");
  const result = parseJsonOutput(outputText);
  const requestedModel = String(run.requested_model ?? String(run.search_query ?? "").replace(/^.*?\s\/\s/, "").replace(/\s+official tractor specifications.*$/i, "")).trim();
  const resultModel = String(result.model_name ?? requestedModel).trim() || requestedModel;
  const resultYear = result.model_year === null || result.model_year === undefined || result.model_year === "" ? null : Number(result.model_year);
  const safeResultYear = resultYear !== null && Number.isInteger(resultYear) && resultYear >= 1900 && resultYear <= 2100
    ? resultYear
    : (Number.isInteger(Number(run.requested_year)) && Number(run.requested_year) >= 1900 && Number(run.requested_year) <= 2100 ? Number(run.requested_year) : null);
  const identityEvidence = String(result.model_identity_evidence ?? "").trim();
  const requestedModelKey = normalise(requestedModel);
  const resultModelKey = normalise(resultModel);
  const brandKey = normalise(brand.name);
  // Gemini may return a fully qualified name ("Brand Model") while the catalog
  // stores only the model designation ("Model"). Accept only an exact match
  // after removing one leading, exact brand prefix; do not use fuzzy matching.
  const resultModelWithoutBrand = brandKey && resultModelKey.startsWith(brandKey)
    ? resultModelKey.slice(brandKey.length)
    : resultModelKey;
  const requestedVariant = cleanCatalogVariant(run.requested_variant);
  const lsJ27Identity = brandKey === "lstractor" && requestedModelKey === "j27";
  const resultModelWithVariant = requestedVariant
    ? `${requestedModelKey}${normalise(requestedVariant)}`
    : "";
  const modelNameMatches = resultModelKey === requestedModelKey
    || resultModelWithoutBrand === requestedModelKey
    || Boolean(resultModelWithVariant && (resultModelKey === resultModelWithVariant || resultModelKey === `${brandKey}${resultModelWithVariant}`));
  const identityEvidenceMatches = (requestedModelKey.length >= 4 || lsJ27Identity)
    && hasExactTokenSequence(identityEvidence, requestedModel)
    && (!lsJ27Identity || (Boolean(requestedVariant)
      && hasExactTokenSequence(identityEvidence, `${requestedModel} ${requestedVariant}`)));
  const strictAiIdentityOk = Boolean(result.model_found) && modelNameMatches && identityEvidenceMatches;

  const requestedYear = run.requested_year === null || run.requested_year === undefined ? null : Number(run.requested_year);
  const resultVariant = cleanCatalogVariant(result.variant);
  const requestedMarket = String(run.requested_market ?? "global").trim() || "global";
  const resultMarket = String(result.market ?? "").trim();
  const requestedMarketIsGeneric = normalise(requestedMarket) === "global";
  // "global" is the catalog default, not proof that a market-specific source
  // applies worldwide. When the official source identifies a concrete market,
  // preserve that market as a separate catalog identity.
  const targetMarket = requestedMarketIsGeneric && resultMarket && normalise(resultMarket) !== "global"
    ? resultMarket
    : requestedMarket;
  const marketMatch = requestedMarketIsGeneric
    || (Boolean(resultMarket) && normalise(resultMarket) === normalise(requestedMarket));
  const targetYear = requestedYear !== null ? requestedYear : safeResultYear;
  const targetVariant = requestedVariant || resultVariant;
  const yearMatch = requestedYear === null || (resultYear !== null && resultYear === requestedYear);
  const variantMatch = !requestedVariant || (resultVariant && normalise(resultVariant) === normalise(requestedVariant));

  // A queue-pinned catalog ID can compensate for a model-classifier false negative
  // only when the exact ID is still valid AND the fetched official HTML itself
  // contains a boundary-safe exact model token. A family page alone cannot pass.
  let pinnedTractor: AnyRow | null = null;
  let pinnedSourceEvidence: AnyRow | null = null;
  const pinnedTractorId = String(run.tractor_id ?? "").trim();
  if (pinnedTractorId) {
    const { data: candidate, error: pinnedError } = await db.from("tractors")
      .select("id,brand_id,model_name,model_year,variant,market,status")
      .eq("id", pinnedTractorId).maybeSingle();
    if (pinnedError) throw new Error(`Araştırma hedef traktörü okunamadı: ${pinnedError.message}`);
    if (candidate && candidate.status !== "archived"
      && String(candidate.brand_id) === String(brand.id)
      && normalise(candidate.model_name) === requestedModelKey
      && (requestedYear === null || Number(candidate.model_year) === requestedYear)
      && normalise(candidate.market ?? "global") === normalise(targetMarket)
      && (!requestedVariant || (cleanCatalogVariant(candidate.variant) && normalise(cleanCatalogVariant(candidate.variant)) === normalise(requestedVariant)))) {
      pinnedTractor = candidate;
      const evidenceMarker = `TC_EXACT_MODEL_EVIDENCE:${requestedModelKey}:`;
      const variantEvidenceMarker = requestedVariant
        ? `TC_EXACT_VARIANT_EVIDENCE:${requestedModelKey}:${normalise(requestedVariant)}:`
        : null;
      pinnedSourceEvidence = documents.find((doc: AnyRow) =>
        String(doc.notes ?? "").includes(evidenceMarker)
        && (!lsJ27Identity || Boolean(variantEvidenceMarker && String(doc.notes ?? "").includes(variantEvidenceMarker)))
        && Boolean(doc.model_specific)
        && Number(doc.http_status) === 200
        && Number(doc.source_relevance_score ?? 0) >= 100
        && (hostMatches(String(doc.final_url ?? doc.source_url), officialHost)
          || isApprovedBrandAssetHost(brand.name, String(doc.final_url ?? doc.source_url)))
      ) ?? null;
    }
  }
  const pinnedIdentityOk = Boolean(pinnedTractor && pinnedSourceEvidence);
  const identityOk = strictAiIdentityOk || pinnedIdentityOk;
  const modelFound = (strictAiIdentityOk || pinnedIdentityOk) && yearMatch && Boolean(variantMatch) && marketMatch;
  const summary = String(result.summary ?? (modelFound ? `${brand.name} ${resultModel} modeli resmî kaynakta bulundu.` : "İstenen model resmî kaynakta doğrulanamadı."));

  let tractor: AnyRow | null = null;
  let createdTractorId: string | null = null;
  let publishedModel = false;
  if (modelFound && pinnedTractorId) {
    // Queue-originated research must stay attached to its exact catalog row.
    // Never create a second tractor or silently switch to a sibling model.
    if (pinnedTractor) {
      tractor = pinnedTractor;
      publishedModel = pinnedTractor.status === "published";
    } else {
      console.warn(
        `[identity] Pinned queue target could not be verified; no tractor will be created. run=${run.id}`
      );
    }
  } else if (modelFound) {
    const { data: possibleTractors, error: tractorReadError } = await db.from("tractors")
      .select("id,model_name,model_year,variant,market,status")
      .eq("brand_id", brand.id).neq("status", "archived").limit(1000);
    if (tractorReadError) throw new Error(`Traktör kaydı kontrol edilemedi: ${tractorReadError.message}`);
    const sameName = (possibleTractors ?? []).filter((item: AnyRow) => normalise(item.model_name) === normalise(requestedModel));
    const sameMarketRows = sameName.filter((item: AnyRow) => normalise(item.market ?? "global") === normalise(targetMarket));
    // Identity details found in an official source are just as important as
    // details supplied by the queue. A generic global/unknown catalog row must
    // never absorb a South Africa / 2021 / Platform-specific research result.
    const hasExplicitIdentityDetail = targetYear !== null || Boolean(targetVariant);
    const identityMatches = sameMarketRows.filter((item: AnyRow) => {
      if (targetYear !== null && Number(item.model_year) !== targetYear) return false;
      if (targetVariant) {
        const storedVariant = cleanCatalogVariant(item.variant);
        if (!storedVariant || normalise(storedVariant) !== normalise(targetVariant)) return false;
      }
      return true;
    });
    if (identityMatches.length === 1) {
      tractor = identityMatches[0];
    } else if (identityMatches.length > 1) {
      console.warn(`[identity] Multiple active ${brand.name}/${requestedModel} rows match; no findings attached.`);
    } else {
      const canCreateDistinctIdentity = sameMarketRows.length === 0 || hasExplicitIdentityDetail;
      if (canCreateDistinctIdentity) {
        const { data: newTractor, error: createError } = await db.from("tractors").insert({
          brand_id: brand.id,
          model_name: requestedModel,
          model_year: targetYear,
          variant: targetVariant,
          market: targetMarket,
          status: "draft",
        }).select("id,model_name,model_year,variant,market,status").single();
        if (createError || !newTractor) throw new Error(`Yeni model taslak olarak eklenemedi: ${createError?.message ?? "Bilinmeyen hata"}`);
        tractor = newTractor;
        createdTractorId = newTractor.id;
      }
    }
    publishedModel = Boolean(tractor && tractor.status === "published" && identityMatches.length === 1);
  }

  const rawSpecs = Array.isArray(result.specifications) ? result.specifications.slice(0, 40) : [];
  const atomicSpecs = rawSpecs.flatMap((spec: AnyRow) => splitCompositeSpecification(spec));
  let pendingCount = 0;
  let approvedCount = 0;
  let publishedSpecCount = 0;
  let duplicateCount = 0;
  let skippedCount = Math.max(0, rawSpecs.length - atomicSpecs.length);
  const findingIdsToReview: AnyRow[] = [];

  if (modelFound && tractor && atomicSpecs.length) {
    const findingRows: AnyRow[] = [];
    for (const spec of atomicSpecs) {
      const requestedSourceUrl = String(spec.source_url ?? "").trim();
      const matchedSource = requestedSourceUrl && documentMap.has(requestedSourceUrl)
        ? sourceChoices.find((src) => src.url === requestedSourceUrl)
        : sourceChoices[0];
      const finalSource = matchedSource ?? sourceChoices[0];
      const doc = documentMap.get(finalSource.url);
      if (!doc) { skippedCount++; continue; }
      if (requestedSourceUrl && !documentMap.has(requestedSourceUrl)) { skippedCount++; continue; }
      const specName = String(spec.spec_name ?? "").trim();
      const specValue = String(spec.spec_value ?? "").trim();
      const evidence = String(spec.evidence_text ?? "").trim();
      if (!specName || !specValue || !evidence) { skippedCount++; continue; }
      let confidenceRaw = Number(spec.confidence ?? 0);
      if (!Number.isFinite(confidenceRaw)) confidenceRaw = 0;
      const confidence = Math.max(0, Math.min(1, confidenceRaw > 1 ? confidenceRaw / 100 : confidenceRaw));
      const pageNumber = Number.isInteger(Number(spec.page_number)) && Number(spec.page_number) > 0 ? Number(spec.page_number) : null;
      findingRows.push({
        run_id: run.id,
        document_id: doc.id,
        tractor_id: tractor.id,
        proposed_brand_name: brand.name,
        proposed_model_name: requestedModel,
        proposed_model_year: targetYear,
        proposed_variant: targetVariant,
        proposed_market: targetMarket,
        spec_name: specName,
        spec_value: specValue,
        unit: spec.unit,
        evidence_text: evidence.slice(0, 2000),
        page_number: pageNumber,
        confidence,
        review_status: "pending",
        review_notes: !publishedModel
          ? "Draft/yeni katalog modeli: bulgu kaydedildi; yayımlama için modelin onaylanması gerekir."
          : "Resmî kaynak ve atomik teknik alan kontrolleri bekleniyor.",
        created_tractor_id: createdTractorId,
        created_at: new Date().toISOString(),
        canonical_key: spec.canonical_key,
        comparison_class: spec.comparison_class,
        measurement_standard: spec.measurement_standard,
        rated_rpm: spec.rated_rpm,
        source_url: finalSource.url,
      });
    }

    let insertedFindings: AnyRow[] = [];
    let reusedPendingFindings: AnyRow[] = [];
    if (findingRows.length) {
      const { data: previousFindings, error: previousError } = await db.from("ai_research_findings")
        .select("id,spec_name,spec_value,unit,canonical_key,measurement_standard,rated_rpm,review_status,inserted_spec_id")
        .eq("tractor_id", tractor.id).limit(7000);
      if (previousError) throw new Error(`Mevcut araştırma bulguları okunamadı: ${previousError.message}`);
      const existingByKey = new Map<string, AnyRow>();
      for (const old of previousFindings ?? []) {
        if (String(old.review_status ?? "") === "rejected") continue;
        const key = findingFingerprint(old);
        if (!existingByKey.has(key)) existingByKey.set(key, old);
      }
      const uniqueRows: AnyRow[] = [];
      for (const row of findingRows) {
        const key = findingFingerprint(row);
        const previous = existingByKey.get(key);
        if (previous) {
          duplicateCount++;
          // A previous pending finding can be revalidated against the newly crawled
          // official source and safely written to tractor_specs without inserting a
          // second duplicate finding row. Keep the old run/document history intact.
          if (String(previous.review_status) === "pending") {
            reusedPendingFindings.push({ ...row, id: previous.id, _reused_pending: true });
          }
          continue;
        }
        existingByKey.set(key, { ...row, id: null, review_status: "new" });
        uniqueRows.push(row);
      }
      if (uniqueRows.length) {
        const { data, error: insertError } = await db.from("ai_research_findings").insert(uniqueRows)
          .select("id,spec_name,spec_value,unit,evidence_text,page_number,confidence,canonical_key,comparison_class,measurement_standard,rated_rpm,source_url,document_id");
        if (insertError) throw new Error(`Araştırma bulguları kaydedilemedi: ${insertError.message}`);
        insertedFindings = data ?? [];
      }
      pendingCount = insertedFindings.length + reusedPendingFindings.length;
    }

    // High-confidence atomic specifications can be written to an exactly matched
    // existing/new draft model, but the tractor itself remains draft. A model becomes
    // publicly visible only through the separate model publication workflow.
    // Human-managed tractor_specs rows are never overwritten; only AI-managed rows can be upgraded.
    if (AUTO_APPROVE_VERIFIED_FINDINGS && tractor && identityOk && !pinnedIdentityOk) {
      const { data: currentSpecs, error: specsError } = await db.from("tractor_specs")
        .select("id,spec_name,spec_value,unit,canonical_key,measurement_standard,rated_rpm,managed_by_ai,source_priority,source_document_id")
        .eq("tractor_id", tractor.id).limit(1500);
      if (specsError) throw new Error(`Mevcut teknik özellikler okunamadı: ${specsError.message}`);
      const current = currentSpecs ?? [];
      // v18: infer canonical metadata for legacy labels without changing their values.
      // This protects human-managed Engine power / Operating weight rows from duplicates.
      for (const item of current) {
        if (!item.canonical_key) {
          const inferred = canonicalInfo(String(item.spec_name ?? ""));
          if (inferred.key) {
            const { error: metadataError } = await db.from("tractor_specs")
              .update({ canonical_key: inferred.key, comparison_class: inferred.className })
              .eq("id", item.id).is("canonical_key", null);
            if (!metadataError) {
              item.canonical_key = inferred.key;
              item.comparison_class = inferred.className;
            } else {
              console.warn(`[canonical] legacy metadata not updated for ${item.id}: ${metadataError.message}`);
            }
          }
        }
      }
      const oldDocumentIds = [...new Set(current.map((item: AnyRow) => String(item.source_document_id ?? "")).filter(Boolean))];
      const oldDocumentMap = new Map<string, AnyRow>();
      if (oldDocumentIds.length) {
        const { data: oldDocs, error: oldDocsError } = await db.from("ai_research_documents")
          .select("id,source_url,content_hash,source_last_modified,version_label")
          .in("id", oldDocumentIds);
        if (oldDocsError) throw new Error(`Önceki teknik özellik kaynak sürümleri okunamadı: ${oldDocsError.message}`);
        for (const oldDoc of oldDocs ?? []) oldDocumentMap.set(String(oldDoc.id), oldDoc);
      }
      for (const finding of [...insertedFindings, ...reusedPendingFindings]) {
        const key = String(finding.canonical_key ?? "").trim();
        const doc = documents.find((d: AnyRow) => String(d.id) === String(finding.document_id));
        const priority = Number(doc?.source_priority ?? 0);
        const source = sourceChoices.find((s) => s.url === finding.source_url) ?? sourceChoices[0];
        const pageEvidenceOk = !source.isPdf || finding.page_number !== null;
        const evidenceOk = String(finding.evidence_text ?? "").trim().length >= 6 && evidenceSupportsValue(String(finding.spec_value), String(finding.evidence_text));
        const variantEvidenceOk = findingProvesRequestedVariant(requestedVariant, source, String(finding.evidence_text ?? ""));
        const safeToPublish = Boolean(key)
          && variantEvidenceOk
          && Number(finding.confidence) >= 0.985
          && evidenceOk
          && pageEvidenceOk
          && priority >= 85
          && identityOk
          && yearMatch
          && Boolean(variantMatch);
        if (!safeToPublish) {
          if (!variantEvidenceOk) {
            await db.from("ai_research_findings").update({
              review_status: "pending",
              review_notes: requestedVariant
                ? "Teknik bulgu hedef varyantı kaynak bağlantısı veya kanıt metniyle açıkça doğrulamıyor; yanlış varyanta yazılmaması için otomatik aktarım durduruldu."
                : "Katalog kaydında varyant belirtilmediği için teknik özellik otomatik aktarılmadı; varyant doğrulaması gerekiyor.",
            }).eq("id", finding.id);
          }
          continue;
        }
        const sameKey = current.filter((item: AnyRow) => String(item.canonical_key ?? canonicalInfo(String(item.spec_name ?? "")).key ?? "") === key);
        const sameScopedValue = sameKey.find((item: AnyRow) =>
          normalise(item.spec_value) === normalise(finding.spec_value)
          && normalise(item.unit ?? "") === normalise(finding.unit ?? "")
          && String(item.measurement_standard ?? "") === String(finding.measurement_standard ?? "")
          && Number(item.rated_rpm ?? 0) === Number(finding.rated_rpm ?? 0)
        );
        const sourceId = await getOrCreateDataSource(brand.name, source);
        if (sameScopedValue) {
          if (sameScopedValue.managed_by_ai) {
            await db.from("tractor_specs").update({
              source_id: sourceId,
              source_document_id: finding.document_id,
              evidence_text: finding.evidence_text,
              source_priority: priority,
              last_verified_at: new Date().toISOString(),
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq("id", sameScopedValue.id);
          }
          await db.from("ai_research_findings").update({ review_status: "duplicate", review_notes: "Aynı kanonik özellik ve aynı ölçüm kapsamı zaten mevcut.", reviewed_at: new Date().toISOString() }).eq("id", finding.id);
          pendingCount--;
          duplicateCount++;
          continue;
        }
        const conflicting = sameKey.find((item: AnyRow) =>
          normalise(item.unit ?? "") === normalise(finding.unit ?? "")
          && String(item.measurement_standard ?? "") === String(finding.measurement_standard ?? "")
          && Number(item.rated_rpm ?? 0) === Number(finding.rated_rpm ?? 0)
        );
        if (conflicting && !conflicting.managed_by_ai) {
          await db.from("ai_research_findings").update({ review_status: "pending", review_notes: "Aynı kanonik özellikte insan tarafından yönetilen kayıt var; AI bu değeri otomatik değiştirmedi." }).eq("id", finding.id);
          continue;
        }
        if (conflicting && conflicting.managed_by_ai) {
          const oldPriority = Number(conflicting.source_priority ?? 0);
          const oldDoc = oldDocumentMap.get(String(conflicting.source_document_id ?? ""));
          const newDoc = doc;
          const oldDate = oldDoc?.source_last_modified ? Date.parse(String(oldDoc.source_last_modified)) : NaN;
          const newDate = newDoc?.source_last_modified ? Date.parse(String(newDoc.source_last_modified)) : NaN;
          const newerPublishedVersion = Number.isFinite(oldDate) && Number.isFinite(newDate) && newDate > oldDate;
          const provablyOlderPublishedVersion = Number.isFinite(oldDate) && Number.isFinite(newDate) && newDate < oldDate;
          const sameOfficialSourceChanged = Boolean(oldDoc?.source_url)
            && String(oldDoc.source_url) === String(newDoc?.source_url)
            && Boolean(oldDoc?.content_hash) && Boolean(newDoc?.content_hash)
            && String(oldDoc.content_hash) !== String(newDoc.content_hash);
          if (priority < oldPriority || provablyOlderPublishedVersion) {
            await db.from("ai_research_findings").update({ review_status: "pending", review_notes: provablyOlderPublishedVersion
              ? "Yeni kaynak sürüm tarihi mevcut kaynaktan eski; otomatik değer değişikliği yapılmadı."
              : "Mevcut AI kaynağının önceliği daha yüksek; daha düşük öncelikli kaynak otomatik değişiklik yapmadı." }).eq("id", finding.id);
            continue;
          }
          if (priority === oldPriority && !newerPublishedVersion && !sameOfficialSourceChanged) {
            await db.from("ai_research_findings").update({ review_status: "pending", review_notes: "Aynı öncelikteki önceki AI kaynağına göre daha yeni yayımlanmış sürüm veya içerik değişimi kanıtlanamadı; otomatik değer değişikliği yapılmadı." }).eq("id", finding.id);
            continue;
          }
        }
        const write = {
          tractor_id: tractor.id,
          spec_name: finding.spec_name,
          spec_value: finding.spec_value,
          unit: finding.unit,
          source_id: sourceId,
          canonical_key: finding.canonical_key,
          comparison_class: finding.comparison_class,
          measurement_standard: finding.measurement_standard,
          rated_rpm: finding.rated_rpm,
          evidence_text: finding.evidence_text,
          source_document_id: finding.document_id,
          source_priority: priority,
          managed_by_ai: true,
          last_verified_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        let writeError: AnyRow | null = null;
        let writtenId: string | null = null;
        if (conflicting?.id) {
          const { data: updated, error: updateError } = await db.from("tractor_specs").update(write).eq("id", conflicting.id).select("id").single();
          writeError = updateError;
          writtenId = updated?.id ?? null;
        } else {
          const { data: inserted, error: insertError } = await db.from("tractor_specs").insert(write).select("id").single();
          writeError = insertError;
          writtenId = inserted?.id ?? null;
        }
        if (writeError || !writtenId) {
          await db.from("ai_research_findings").update({ review_status: "pending", review_notes: `Otomatik teknik özellik güncellemesi başarısız: ${writeError?.message ?? "ID dönmedi"}` }).eq("id", finding.id);
          continue;
        }
        await db.from("ai_research_findings").update({
          review_status: "approved",
          review_notes: conflicting
            ? "Yüksek güvenli resmî kaynak, aynı ölçüm kapsamındaki önceki AI yönetimli değeri güncelledi."
            : (publishedModel
              ? "Yüksek güvenli resmî kaynak ve kanıt kontrolleri sağlandı; teknik özellik eklendi."
              : "Yüksek güvenli resmî kaynak ve kanıt kontrolleri sağlandı; teknik özellik taslak traktör kaydına eklendi. Traktörün kendisi yayımlanmadı."),
          reviewed_at: new Date().toISOString(),
          inserted_spec_id: writtenId,
        }).eq("id", finding.id);
        pendingCount--;
        approvedCount++;
        if (publishedModel) publishedSpecCount++;
        if (conflicting) {
          const index = current.findIndex((item: AnyRow) => item.id === conflicting.id);
          if (index >= 0) current[index] = { ...write, id: conflicting.id };
        } else current.push({ ...write, id: writtenId });
      }
    }
  }

  const finalSummary = !modelFound
    ? `${brand.name} ${requestedModel} modeli bu resmî kaynaklarda doğrulanamadı. Otomatik model veya teknik özellik yayımlanmadı. ${summary}`
    : !tractor
      ? `${brand.name} ${requestedModel} resmî kaynakta bulundu; ancak katalog eşleştirmesi belirsiz olduğu için yeni kayıt açılmadı. ${atomicSpecs.length} atomik özellik adayı incelenmeden bekletildi.`
      : `${brand.name} ${requestedModel} resmî kaynaklarda doğrulandı. ${rawSpecs.length} ham aday ${atomicSpecs.length} karşılaştırılabilir teknik alana ayrıştırıldı; ${approvedCount} teknik özellik güvenli biçimde eklendi/güncellendi, ${publishedSpecCount} yayımlanmış modele işlendi, ${pendingCount} bulgu incelemede kaldı. Traktörün model durumu değiştirilmedi.`;

  const orderedDocuments = [...documents].sort((a: AnyRow, b: AnyRow) =>
    Number(Boolean(b.is_preferred_technical_source)) - Number(Boolean(a.is_preferred_technical_source))
    || Number(b.source_priority ?? 0) - Number(a.source_priority ?? 0)
    || Number(b.source_relevance_score ?? 0) - Number(a.source_relevance_score ?? 0)
  );
  const preferredPrimaryDocument = orderedDocuments.find((doc: AnyRow) => Boolean(doc.is_preferred_technical_source)) ?? orderedDocuments[0];
  const sourceUrls = orderedDocuments.map((doc: AnyRow) => String(doc.source_url));
  const citations = [...new Set([...apiCitations, ...atomicSpecs.map((s: AnyRow) => String(s.source_url ?? "")).filter((u: string) => sourceUrls.includes(u))])];
  const preservedDocumentNotes = documents
    .map((doc: AnyRow) => String(doc.notes ?? "").slice(0, 2200))
    .join("\n---\n");
  await db.from("ai_research_documents").update({
    notes: `${preservedDocumentNotes}\n\nGemini summary: ${summary}. Sources: ${sourceUrls.join(" | ")}. Citations: ${citations.join(" | ")}`.slice(0, 4000),
  }).eq("run_id", run.id);

  const resultMeta = {
    model_found: modelFound,
    model_name: requestedModel,
    specifications_found: rawSpecs.length,
    atomic_specifications: atomicSpecs.length,
    findings_saved: pendingCount + approvedCount + duplicateCount,
    pending_findings: pendingCount,
    specifications_written_automatically: approvedCount,
    published_specifications: publishedSpecCount,
    duplicates: duplicateCount,
    skipped_findings: skippedCount,
    citations,
    source_urls: sourceUrls,
    created_tractor_id: createdTractorId,
    matched_tractor_id: tractor?.id ?? null,
    tractor_match_required: modelFound && !tractor,
    identity_verification_mode: pinnedIdentityOk ? "queue_pinned_id_plus_exact_official_html_model_text" : "strict_gemini_identity",
    pinned_target_tractor_id: pinnedTractorId || null,
    pinned_source_identity_verified: pinnedIdentityOk,
  };
  const { error: finishError } = await db.from("ai_research_runs").update({
    status: "completed",
    tractor_id: tractor?.id ?? run.tractor_id ?? null,
    summary: finalSummary,
    result_meta: resultMeta,
    error_message: null,
    completed_at: new Date().toISOString(),
  }).eq("id", run.id);
  if (finishError) throw new Error(`Araştırma tamamlandı ancak run durumu güncellenemedi: ${finishError.message}`);

  console.log(`[complete] run=${run.id} model_found=${modelFound} sources=${documents.length} atomic=${atomicSpecs.length} published=${approvedCount} pending=${pendingCount}`);
  return {
    success: true,
    message: "Traktör araştırması tamamlandı.",
    run_id: run.id,
    brand: brand.name,
    model: requestedModel,
    model_found: modelFound,
    summary: finalSummary,
    model_used: String(run.gemini_model ?? GEMINI_MODEL),
    source_url: String(preferredPrimaryDocument.source_url),
    source_type: preferredPrimaryDocument.source_type,
    cited_sources: citations.length,
    source_count: orderedDocuments.length,
    source_urls: sourceUrls,
    source_discovery_methods: orderedDocuments.map((doc: AnyRow) => ({
      source_url: doc.source_url,
      source_type: doc.source_type,
      source_priority: doc.source_priority,
      is_preferred_technical_source: doc.is_preferred_technical_source,
      source_relevance_reason: doc.source_relevance_reason,
    })),
    specifications_found: rawSpecs.length,
    atomic_specifications: atomicSpecs.length,
    pending_findings_saved: pendingCount,
    published_automatically: publishedSpecCount,
    specifications_updated_automatically: approvedCount,
    duplicate_findings: duplicateCount,
    skipped_findings: skippedCount,
    created_tractor_id: createdTractorId,
    matched_tractor_id: tractor?.id ?? null,
    tractor_match_required: modelFound && !tractor,
    review_status: pendingCount > 0
      ? "pending"
      : (modelFound && !tractor
        ? "needs_model_match"
        : (modelFound && tractor && (rawSpecs.length === 0 || (pendingCount + approvedCount + duplicateCount) === 0)
          ? "needs_source"
          : "completed")),
    result: resultMeta,
  };
}


function interactionDiagnostics(interaction: AnyRow): AnyRow {
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
  const stepSummaries = steps.slice(0, 20).map((step: AnyRow) => {
    const summary: AnyRow = { type: String(step?.type ?? "unknown") };
    for (const key of ["error", "error_code", "error_message", "message", "reason", "status"]) {
      if (step?.[key] !== undefined && step?.[key] !== null) summary[key] = step[key];
    }
    if (step?.result && typeof step.result === "object") {
      const result = step.result as AnyRow;
      const resultSummary: AnyRow = {};
      for (const key of ["error", "error_code", "error_message", "message", "reason", "status"]) {
        if (result[key] !== undefined && result[key] !== null) resultSummary[key] = result[key];
      }
      if (Object.keys(resultSummary).length) summary.result = resultSummary;
    } else if (typeof step?.result === "string" && /error|failed|denied|quota|limit/i.test(step.result)) {
      summary.result_excerpt = step.result.slice(0, 500);
    }
    return summary;
  });

  // The Interactions API may put generation failures in a top-level `errors`
  // array. Keep this field visible: earlier diagnostics omitted it and therefore
  // hid the actual reason why a background interaction failed.
  const topLevelErrors = interaction.errors ?? null;
  const errorSummary = Array.isArray(topLevelErrors)
    ? topLevelErrors.slice(0, 10).map((item: any) => {
        if (typeof item === "string") return item.slice(0, 2000);
        if (item && typeof item === "object") {
          const summary: AnyRow = {};
          for (const key of ["code", "message", "type", "status", "reason", "details", "retryable"]) {
            if (item[key] !== undefined && item[key] !== null) summary[key] = item[key];
          }
          // Preserve any provider-specific error shape that is not covered above.
          if (Object.keys(summary).length === 0) summary.raw = JSON.stringify(item).slice(0, 2000);
          return summary;
        }
        return item;
      })
    : topLevelErrors;

  // v21.2/v21.3: expose only the parsed model-identity diagnostics needed to explain
  // why the strict catalog identity gate accepted or rejected this run. This
  // reads the already-stored Gemini interaction; it does not launch a new run
  // or change any database records.
  const { text: modelOutputText } = extractModelTextAndCitations(interaction);
  let parsedModelOutput: AnyRow | null = null;
  if (modelOutputText) {
    try { parsedModelOutput = parseJsonOutput(modelOutputText); }
    catch (error) {
      console.warn(`[diagnose] stored model output could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const specPreview = Array.isArray(parsedModelOutput?.specifications)
    ? parsedModelOutput.specifications.slice(0, 8).map((item: AnyRow) => ({
        spec_name: item?.spec_name ?? null,
        spec_value: item?.spec_value ?? null,
        unit: item?.unit ?? null,
        evidence_text: typeof item?.evidence_text === "string" ? item.evidence_text.slice(0, 500) : null,
        page_number: item?.page_number ?? null,
        confidence: item?.confidence ?? null,
      }))
    : [];

  return {
    interaction_id: interaction.id ?? null,
    status: interaction.status ?? null,
    model: interaction.model ?? null,
    created: interaction.created ?? null,
    updated: interaction.updated ?? null,
    error: interaction.error ?? null,
    error_code: interaction.error_code ?? interaction.errorCode ?? null,
    error_message: interaction.error_message ?? interaction.errorMessage ?? null,
    failure_reason: interaction.failure_reason ?? interaction.failureReason ?? null,
    errors: errorSummary,
    incomplete_details: interaction.incomplete_details ?? null,
    step_types: steps.map((step: AnyRow) => String(step?.type ?? "unknown")),
    steps: stepSummaries,
    usage: interaction.usage ?? null,
    response_keys: Object.keys(interaction ?? {}),
    model_output_chars: modelOutputText.length,
    model_identity: parsedModelOutput ? {
      model_found: parsedModelOutput.model_found ?? null,
      model_name: parsedModelOutput.model_name ?? null,
      model_year: parsedModelOutput.model_year ?? null,
      variant: parsedModelOutput.variant ?? null,
      market: parsedModelOutput.market ?? null,
      model_identity_evidence: typeof parsedModelOutput.model_identity_evidence === "string"
        ? parsedModelOutput.model_identity_evidence.slice(0, 2000)
        : null,
      summary: typeof parsedModelOutput.summary === "string" ? parsedModelOutput.summary.slice(0, 1200) : null,
      specifications_count: Array.isArray(parsedModelOutput.specifications) ? parsedModelOutput.specifications.length : 0,
      specifications_preview: specPreview,
    } : null,
    model_output_parse_error: modelOutputText && !parsedModelOutput ? "Gemini çıktısı JSON olarak ayrıştırılamadı; interaction step detaylarını kontrol edin." : null,
  };
}

async function diagnoseResearch(body: AnyRow) {
  if (!GEMINI_API_KEY) return json(500, { success: false, error: "GEMINI_API_KEY Edge Function secret tanımlı değil." });
  const runId = String(body.run_id ?? "").trim();
  if (!runId) return json(400, { success: false, error: "diagnose işlemi için run_id zorunludur." });

  const { data: run, error: runError } = await db
    .from("ai_research_runs")
    .select("id,status,gemini_interaction_id,gemini_model,error_message")
    .eq("id", runId)
    .maybeSingle();
  if (runError) throw new Error(`Araştırma kaydı okunamadı: ${runError.message}`);
  if (!run) return json(404, { success: false, error: "Araştırma kaydı bulunamadı." });
  if (!run.gemini_interaction_id) {
    return json(409, { success: false, run_id: run.id, status: run.status, error: "Bu araştırma için Gemini interaction ID kaydedilmemiş.", saved_error: run.error_message });
  }

  const response = await fetch(`${GEMINI_API}/${encodeURIComponent(run.gemini_interaction_id)}`, {
    method: "GET",
    headers: { "x-goog-api-key": GEMINI_API_KEY, "Api-Revision": "2026-05-20" },
    signal: AbortSignal.timeout(20_000),
  });
  const interaction = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(502, {
      success: false,
      run_id: run.id,
      http_status: response.status,
      google_error: interaction?.error ?? interaction,
      saved_error: run.error_message,
    });
  }

  return json(200, {
    success: true,
    run_id: run.id,
    saved_run_status: run.status,
    saved_error: run.error_message,
    diagnostics: interactionDiagnostics(interaction),
    note: "Bu tanılama isteği araştırma kaydını değiştirmez.",
  });
}

async function pollResearch(body: AnyRow) {
  if (!GEMINI_API_KEY) return json(500, { success: false, error: "GEMINI_API_KEY Edge Function secret tanımlı değil." });
  const runId = String(body.run_id ?? "").trim();
  if (!runId) return json(400, { success: false, error: "status işlemi için run_id zorunludur." });

  const { data: run, error: runError } = await db
    .from("ai_research_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (runError) throw new Error(`Araştırma kaydı okunamadı: ${runError.message}`);
  if (!run) return json(404, { success: false, error: "Araştırma kaydı bulunamadı." });

  if (run.status === "completed") {
    return json(200, {
      success: true,
      message: "Bu araştırma daha önce tamamlandı.",
      run_id: run.id,
      status: run.status,
      summary: run.summary,
      result: run.result_meta ?? null,
    });
  }
  if (run.status === "failed") {
    return json(200, { success: false, run_id: run.id, status: "failed", error: run.error_message });
  }
  if (!run.gemini_interaction_id) {
    return json(409, { success: false, run_id: run.id, status: run.status, error: "Gemini interaction ID bu araştırma kaydında bulunamadı." });
  }

  console.log(`[poll] run=${run.id}`);
  const response = await fetch(`${GEMINI_API}/${encodeURIComponent(run.gemini_interaction_id)}`, {
    method: "GET",
    headers: {
      "x-goog-api-key": GEMINI_API_KEY,
      "Api-Revision": "2026-05-20",
    },
    signal: AbortSignal.timeout(20_000),
  });
  const interaction = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorText = String(interaction?.error?.message ?? `Gemini HTTP ${response.status}`);
    return json(502, { success: false, run_id: run.id, status: "running", error: errorText });
  }

  const status = String(interaction.status ?? "unknown").toLowerCase();
  if (status === "in_progress" || status === "running" || status === "queued" || status === "pending") {
    return json(202, {
      success: true,
      run_id: run.id,
      status: "running",
      gemini_status: status,
      message: "Araştırma devam ediyor. Biraz sonra aynı run_id ile status çağrısını tekrarlayın.",
    });
  }

  if (status === "failed" || status === "cancelled") {
    const diagnostics = interactionDiagnostics(interaction);
    const firstProviderError = Array.isArray(interaction?.errors) ? interaction.errors[0] : null;
    const providerErrorMessage = typeof firstProviderError === "string"
      ? firstProviderError
      : firstProviderError?.message ?? firstProviderError?.error?.message ?? null;
    const message = String(
      interaction?.error?.message ??
      interaction?.error_message ??
      interaction?.errorMessage ??
      interaction?.failure_reason ??
      providerErrorMessage ??
      `Gemini işlemi ${status} durumuna geçti. Google yanıtında açık hata mesajı bulunamadı; diagnostics.errors alanını inceleyin.`
    );
    await db.from("ai_research_runs").update({
      status: "failed",
      error_message: message.slice(0, 2000),
      result_meta: diagnostics,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json(200, { success: false, run_id: run.id, status: "failed", error: message, diagnostics });
  }

  if (status !== "completed") {
    return json(202, {
      success: true,
      run_id: run.id,
      status: "running",
      gemini_status: status,
      message: "Gemini henüz tamamlandı durumunu bildirmedi. Biraz sonra tekrar kontrol edin.",
    });
  }

  try {
    const result = await completeResearch(run, interaction);
    return json(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[complete] run=${run.id} error=${message}`);
    await db.from("ai_research_runs").update({
      status: "failed",
      error_message: message.slice(0, 2000),
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json(500, { success: false, run_id: run.id, status: "failed", error: message });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Yalnızca POST desteklenir." });

  try {
    if (!SUPABASE_URL || !DB_SECRET_KEY) {
      return json(500, { success: false, error: "Supabase secret yapılandırması eksik. SUPABASE_URL ve DB_SECRET_KEY kontrol edilmeli." });
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json(400, { success: false, error: "Geçerli JSON gövdesi gönderilmelidir." });

    const action = String(body.action ?? "start").toLowerCase();
    if (["enqueue_catalog", "process_queue", "process_queue_batch", "queue_stats"].includes(action)) {
      if (!queueAuthorized(req)) return json(401, { success: false, error: "Araştırma kuyruğu için x-queue-secret başlığı geçerli olmalıdır." });
      if (action === "enqueue_catalog") return await enqueueCatalog();
      if (action === "process_queue") return await processQueue();
      if (action === "process_queue_batch") return await processQueueBatch(body);
      if (action === "queue_stats") return await queueStats();
    }
    if (action === "start" || action === "research") return await startResearch(body);
    if (action === "status" || action === "poll") return await pollResearch(body);
    if (action === "diagnose") return await diagnoseResearch(body);
    return json(400, { success: false, error: "Geçersiz action. start, status, diagnose, enqueue_catalog, process_queue, process_queue_batch veya queue_stats kullanın." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[request] ${message}`);
    return json(500, { success: false, error: message });
  }
});

// END OF FILE - complete TractorCompare AI Edge Function v21.15 source (12 MB PDF cap, 60-second Gemini start timeout, 1 MB HTML reader, alternate official manufacturer host support, upstream-error batch isolation; sequential batch queue worker).
