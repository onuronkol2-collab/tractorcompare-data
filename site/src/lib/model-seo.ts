import {hasInternationalSonalikaContext,SONALIKA_EXPORT_COPY} from "./sonalika-context-i18n.ts";
import type { TractorRecord } from "./catalog.ts";
import { officialManufacturerSourceUrl,reviewedIndependentSourceUrl } from "./catalog.ts";
import {INDEPENDENT_SOURCE_COPY} from "./independent-source-i18n.ts";
import { localizedPath, type Locale } from "./locales.ts";
import { t } from "./ui.ts";
import { marketDisplayName } from "./market-display.ts";
import {primaryTractorPhoto,tractorPhotoAlt} from "./tractor-photos.ts";
import {matchedHeadlinePowerSource,nominalManufacturerSnippet} from "./model-evidence-answers.ts";
import {reviewedLongTitleRow} from "./reviewed-long-model-title-identities.ts";

/** The original manufacturer identity, equipment and market are never inferred. */
/** Editorial microcopy for actual, published model facts.
 * Search titles, descriptions and visible introductory copy share these strings.
 * No generated sales claims, inferred manufacturer figures or unsupported sources.
 */
const MODEL_COPY: Record<Locale, {
  specs:(count:number)=>string; empty:string; power:(hp:number)=>string;
  withSources:string; withoutSources:string; note:(value:string)=>string;
}> = {
  en:{
    specs:n=>`${n} published technical specifications.`,
    empty:"Technical specifications have not yet been published.",
    power:hp=>`Engine power: ${hp} HP.`,
    withSources:"Manufacturer source links are included where verified.",
    withoutSources:"No verified manufacturer source link is currently available.",
    note:value=>`Configuration note: ${value}.`
  },
  tr:{
    specs:n=>`${n} yayımlanmış teknik özellik.`,
    empty:"Bu model için henüz teknik özellik yayımlanmadı.",
    power:hp=>`Motor gücü: ${hp} HP.`,
    withSources:"Doğrulanmış üretici kaynaklarına bağlantılar sunulur.",
    withoutSources:"Bu model için henüz doğrulanmış üretici kaynağı bağlantısı bulunmuyor.",
    note:value=>`Varyant notu: ${value}.`
  },
  zh:{
    specs:n=>`已收录 ${n} 项技术参数。`,
    empty:"此型号暂无已发布的技术参数。",
    power:hp=>`发动机功率：${hp} HP。`,
    withSources:"已提供经核实的制造商来源链接。可据此核对具体车型与技术参数。",
    withoutSources:"此型号目前没有已核实的制造商资料链接。",
    note:value=>`配置说明：${value}。`
  },
  hi:{
    specs:n=>`${n} प्रकाशित तकनीकी विवरण उपलब्ध हैं।`,
    empty:"इस मॉडल के तकनीकी विवरण अभी प्रकाशित नहीं हुए हैं।",
    power:hp=>`इंजन पावर: ${hp} HP।`,
    withSources:"सत्यापित निर्माता स्रोतों के लिंक उपलब्ध हैं।",
    withoutSources:"इस मॉडल के लिए सत्यापित निर्माता स्रोत का लिंक अभी उपलब्ध नहीं है।",
    note:value=>`वेरिएंट संबंधी टिप्पणी: ${value}।`
  },
  "pt-br":{
    specs:n=>`${n} especificações técnicas publicadas.`,
    empty:"Ainda não há especificações técnicas publicadas para este modelo.",
    power:hp=>`Potência do motor: ${hp} HP.`,
    withSources:"Links para fontes do fabricante são fornecidos quando verificados.",
    withoutSources:"Não há links verificados de fontes do fabricante para este modelo.",
    note:value=>`Observação sobre a versão: ${value}.`
  },
  fr:{
    specs:n=>`${n} caractéristiques techniques publiées.`,
    empty:"Aucune caractéristique technique n'est encore publiée pour ce modèle.",
    power:hp=>`Puissance moteur : ${hp} HP.`,
    withSources:"Des liens vers les sources du constructeur sont fournis après vérification.",
    withoutSources:"Aucun lien constructeur vérifié n'est disponible pour ce modèle.",
    note:value=>`Précision sur la version : ${value}.`
  },
  de:{
    specs:n=>`${n} veröffentlichte technische Angaben.`,
    empty:"Für dieses Modell liegen noch keine veröffentlichten technischen Angaben vor.",
    power:hp=>`Motorleistung: ${hp} HP.`,
    withSources:"Verifizierte Herstellerquellen sind verlinkt.",
    withoutSources:"Für dieses Modell liegt derzeit kein geprüfter Herstellerquellen-Link vor.",
    note:value=>`Hinweis zur Ausführung: ${value}.`
  },
  ru:{
    specs:n=>`Опубликовано технических характеристик: ${n}.`,
    empty:"Для этой модели пока нет опубликованных технических характеристик.",
    power:hp=>`Мощность двигателя: ${hp} HP.`,
    withSources:"Доступны ссылки на проверенные источники производителя.",
    withoutSources:"Для этой модели пока нет проверенной ссылки на источник производителя.",
    note:value=>`Примечание о комплектации: ${value}.`
  },
  ja:{
    specs:n=>`公開済みの技術仕様は${n}項目です。`,
    empty:"このモデルの技術仕様はまだ公開されていません。",
    power:hp=>`エンジン出力：${hp} HP。`,
    withSources:"確認済みメーカー情報源へのリンクを掲載しています。",
    withoutSources:"確認済みメーカー資料へのリンクは現在ありません。",
    note:value=>`仕様上の注記：${value}。`
  },
  es:{
    specs:n=>`${n} especificaciones técnicas publicadas.`,
    empty:"Todavía no hay especificaciones técnicas publicadas para este modelo.",
    power:hp=>`Potencia del motor: ${hp} HP.`,
    withSources:"Se incluyen enlaces a fuentes del fabricante cuando están verificadas.",
    withoutSources:"Este modelo aún no tiene enlaces verificados a fuentes del fabricante.",
    note:value=>`Nota sobre la variante: ${value}.`
  }
};

/**
 * Concise, genuinely localized technical title nouns. When a full title grows
 * verbose, drop generic wording first — never cut a brand, model, market,
 * equipment variant or year with an arbitrary character slice.
 */
const CONCISE_SPECS_TITLE:Record<Locale,string>={
  en:"Specs",tr:"Özellikleri",zh:"技术参数",hi:"तकनीकी विवरण",
  "pt-br":"Ficha técnica",fr:"Fiche technique",de:"Daten",
  ru:"Характеристики",ja:"仕様",es:"Datos técnicos"
};

// Bounded search-intent pilot: only the reviewed landing pages. The actual
// compare action already exists on TractorDetail, including without hydration.
// Preserve every existing evidence/identity sentence; add a cue only if it fits.
const COMPARE_SEARCH_PILOT: Partial<Record<Locale, readonly string[]>> = {
  tr:["tafe-6028-m-9686ae98","tumosan-8095-163f043b","landini-5-085-afbb2f1e","valtra-a85-70571d3c"],
  de:["ls-tractor-j27-e424cd0c","ls-tractor-j27-19685234","valtra-n175-caa65b80"],
  hi:["sonalika-125-812d14fd","swaraj-735-fe-7c7b069f"],
  en:["swaraj-735-fe-7c7b069f","swaraj-744-xt-c16bdd6d"],
  "pt-br":["tafe-6028-m-9686ae98"],
};
const COMPARE_SEARCH_CUE: Partial<Record<Locale,string>> = {
  tr:"Modelleri karşılaştırın.",de:"Modelle vergleichen.",
  hi:"मॉडल की तुलना करें।",en:"Compare models.","pt-br":"Compare modelos.",
};

/** Append only an honest navigation benefit, not a technical or ranking claim. */
export function addReviewedCompareSearchCue(
  description:string, tractor:Pick<TractorRecord,"slug"|"specifications">, lang:Locale
):string {
  // Both exact J27 records are publicly available (GEAR and HST).
  // Avoid implying equal transmission or performance; this is a navigation cue.
  const isJ27Variant=lang==="de"&&["ls-tractor-j27-e424cd0c","ls-tractor-j27-19685234"].includes(tractor.slug);
  const cue=isJ27Variant?"Varianten vergleichen.":COMPARE_SEARCH_CUE[lang];
  if(!cue || !tractor.specifications.length || !COMPARE_SEARCH_PILOT[lang]?.includes(tractor.slug))return description;
  if(description.includes(cue) || description.length+1+cue.length>160)return description;
  return description+" "+cue;
}

/** Keep original source/variant notes available without pretending to translate them. */
export function originalVariantNote(tractor:Pick<TractorRecord,"variant">):string|null {
  return tractor.variant?.split(";").slice(1).join(";").trim() || null;
}

/** Published catalogue rows reviewed read-only on 2026-11-24. Remove
 * repeated model-name/market wording only from the search title. Exact
 * variant and market matching makes this opt-in, not a general truncation.
 * Keep the original source record, description and JSON-LD untouched. */
function compactReviewedTitleVariant(tractor:TractorRecord, rawVariant:string|null,
 rawMarket:string|null, current:string|null):string|null {
 const name=tractor.model_name;
 if(tractor.brand_name==="McCormick" && rawMarket==="Europe"){
  if(/^X2\.0(?:55|60) (?:GE|STD)$/.test(name) &&
    rawVariant===name.split(" ").at(-1)+" / synchro shuttle")return "synchro shuttle";
  if(/^X4\.(?:080|090|100|110|120) F (?:Cab|Platform)$/.test(name) &&
    rawVariant==="Orchard F / "+name.split(" ").at(-1)+" / Speed Four")return "Orchard / Speed Four";
  if(/^X4\.(?:085|095|105|110|120) T[FM]$/.test(name) &&
    rawVariant===name.split(" ").at(-1)+" crawler / metal track shoes")return "crawler / metal track shoes";
  if(/^X6\.(?:413|414|415) P6-Drive$/.test(name) &&
    rawVariant==="P6-Drive / standard gearbox")return "standard gearbox";
  if(/^X6\.(?:616|618) XtraShift$/.test(name) &&
    rawVariant==="XtraShift / standard gearbox")return "standard gearbox";
  if(/^X7\.(?:417|418|617|618|620|621|623|624) (?:P6|VT)-Drive$/.test(name)){
   const drive=name.split(" ").at(-1);
   if(rawVariant==="Clever Cab / "+drive)return "Clever Cab";
   if(drive==="P6-Drive" && rawVariant==="Efficient / P6-Drive")return "Efficient";
  }
 }
 if(tractor.brand_name==="Mahindra" && rawMarket==="India"){
  if(name==="JIVO 225 DI 4WD NT" && rawVariant==="India 4WD / 8F x 4R / narrow track")return "8F x 4R / narrow track";
  if(name==="JIVO 245 VINEYARD" && rawVariant==="India 4WD / 8F x 4R / vineyard")return "4WD / 8F x 4R";
  if(name==="JIVO 365 DI 4WD" && rawVariant==="India 4WD / 8F x 8R / 9.5x20 tyre")return "8F x 8R / 9.5x20 tyre";
  if(name==="NOVO 755 DI PP 4WD V1" && rawVariant==="India 4WD / 15F x 15R / creeper optional")return "15F x 15R / creeper optional";
  if(name==="YUVRAJ 215 NXT NT" && rawVariant==="India 2WD / 6F x 3R / narrow track")return "2WD / 6F x 3R / narrow track";
  if(/^OJA (?:2124|2127|2130)$/.test(name) && rawVariant==="4WD (India)")return "4WD";
  if(name==="NOVO 605 DI PS V1" && rawVariant==="India 2WD / 15F x 3R")return "2WD / 15F x 3R";
  if(name==="JIVO 225 DI 4WD" && rawVariant==="India 4WD / 8F x 4R / manufacturer configuration")return "8F x 4R";
  if(name==="JIVO 305 DI 4WD" && rawVariant==="India 4WD / 8F x 4R / manufacturer specification")return "8F x 4R";
 }
 if(tractor.brand_name==="Kioti" && rawMarket==="US"){
  if(name==="CX2510" && rawVariant==="US / gear / open station")return "gear / open station";
  if(name==="CX2510H" && rawVariant==="US / HST / open station")return "HST / open station";
  if(name==="CX2510H CAB" && rawVariant==="US / factory cab")return "factory cab";
 }
 if(tractor.brand_name==="LS Tractor" && rawMarket==="US"){
  if(/^MT12[25]$/.test(name) && rawVariant==="US official product / ROPS HST")return "ROPS HST";
  if(name==="MT573C" && rawVariant==="US official product / synchro cab")return "synchro cab";
 }
 if(tractor.brand_name==="Sonalika" && rawMarket==="India"){
  if(name==="GT 22 4WD" && rawVariant==="4WD / 6F + 2R / single clutch")return "6F + 2R / single clutch";
  if(name==="Tiger DI 42 PP 4WD" && rawVariant==="4WD / 8F+2R / constant mesh / power steering")return "8F+2R / constant mesh / power steering";
 }
 if(tractor.brand_name==="Swaraj" && name==="855 FE Protek" && rawMarket==="India" &&
    rawVariant==="2WD/4WD configurable model family")return "2WD/4WD configurable";
 if(tractor.brand_name==="Antonio Carraro" && ((name==="TONY 8900 SR" && rawMarket==="Europe") ||
    (name==="TONY 8900 TR" && rawMarket==="Australia")) &&
    rawVariant==="Stage V / ROPS or Air cab options")return "Stage V / ROPS or Air cab";
 return current;
}

// Exact published variant rows reviewed on 2026-11-24. These are display-only
// editorial changes: no source, equipment claim, market or record is rewritten.
// Unknown or edited configurations must keep their original representation.
const REVIEWED_TYM_TITLE_VARIANTS: Record<string, readonly string[]> = {
  T2024:["2500H / 2-range HST / ROPS","2500R / 6F x 2R / ROPS"],
  T2026:["2500HL / 2- or 3-range HST","2500L / manual 6F x 2R or 9F x 3R"],
  T3025:["F25 / ROPS / SS 12F×12R or HST 3-range options"],
  T3048:["F50CHN / F50C cab / 3-range HST","F50CN / F50C cab / 12F x 12R"],
  T4048:["5025C / cab / 12F x 12R","5025CH / cab / 3-range HST",
    "5025H / 3-range HST / ROPS","5025R / 12F x 12R / ROPS"],
  T4058:["6225C / cab / 12F x 12R","6225CH / cab / 3-range HST"],
  T5068:["T68 / Series 5 / cab / 24F x 24R"],
};
const SHORT_INTERNATIONAL_TITLE: Record<Locale,string> = {
  en:"International",tr:"Uluslararası",zh:"国际",hi:"अंतरराष्ट्रीय",
  "pt-br":"Internacional",fr:"International",de:"International",
  ru:"Междунар. каталог",ja:"国際",es:"Internacional",
};
function reviewedRemainingTitleIdentity(tractor:TractorRecord, rawVariant:string|null,
  rawMarket:string|null, variant:string|null, market:string|null, lang:Locale) {
  const name=tractor.model_name;
  // The actual stored market is International; retain the explicit catalogue
  // wording in the full description and page. Do not turn it into "global".
  if(tractor.brand_name==="TYM" && rawMarket==="International" && rawVariant &&
      Object.hasOwn(REVIEWED_TYM_TITLE_VARIANTS,name) && REVIEWED_TYM_TITLE_VARIANTS[name].includes(rawVariant)) {
    return {variant:rawVariant.replaceAll(" / ",", ").replaceAll(" x ","×"),
      market:SHORT_INTERNATIONAL_TITLE[lang]};
  }
  if(tractor.brand_name==="Sonalika" && name==="FP-18" &&
      rawMarket==="International" && rawVariant==="Manufacturer export FP-18 / 2WD") {
    return {variant:"2WD / export",market:SHORT_INTERNATIONAL_TITLE[lang]};
  }
  if(tractor.brand_name==="Sonalika" && rawMarket==="India") {
    if(name==="DI 35" && rawVariant==="2WD DI 35 / RX / Sikander family options")
      return {variant:"2WD / RX / Sikander family options",market};
    if(name==="DI 30 Baagban" && rawVariant==="India 2WD / orchard / 8F+2R / rear tire options")
      return {variant:"2WD, orchard, 8F+2R, rear tire options",market};
    if(name==="GT 20" && rawVariant==="India 2WD 6F+2R / single clutch / tyre options")
      return {variant:"2WD 6F+2R, single clutch, tyre options",market};
  }
  // Exact published records checked against the anonymous catalogue on 24 Nov.
  // Compact display separators and repeated regional labels, not equipment.
  // Preserve the unmodified source strings in the description and JSON-LD.
  if (tractor.brand_name==="Farmtrac" && rawMarket==="India") {
    if (name==="45 Powermaxx" && rawVariant==="India / 2WD / constant-mesh 8F+2R")
      return {variant:"2WD, constant-mesh 8F+2R",market};
    if (name==="60 Powermaxx" && rawVariant==="India / 2WD / T20 16F+4R")
      return {variant:"2WD, T20 16F+4R",market};
  }
  if (tractor.brand_name==="Hattat" && rawMarket==="Türkiye" &&
      /^B (?:3055|3065|3085|3095|3105)$/.test(name) &&
      rawVariant==="Stage V · 4WD · ROPS · 12F/12R")
    return {variant:"Stage V, 4WD, ROPS, 12F/12R",market};
  if (tractor.brand_name==="Erkunt" && rawMarket==="Türkiye" && rawVariant) {
    const gears:Record<string,string>={"Bereket 60 E":"12F/12R","Bereket 65 E":"12F/12R",
      "Bereket 65 E+":"12F/12R","Kıymet 90 Lüks":"16F/16R","Nimet 75 E+":"24F/24R",
      "Nimet 75 Lüks":"16F/16R","Servet 85 Lüks":"16F/16R"};
    const gear=gears[name];
    if (gear && rawVariant==="CRD5 eCapra · 4WD · kabin · "+gear) {
      const cab:Record<Locale,string>={en:"cab",tr:"kabin",zh:"驾驶室",hi:"केबिन",
        "pt-br":"cabine",fr:"cabine",de:"Kabine",ru:"кабина",ja:"キャブ",es:"cabina"};
      return {variant:"CRD5 eCapra, 4WD, "+cab[lang]+", "+gear,market};
    }
  }
  if (tractor.brand_name==="IRUM" && name==="TAGRO 102" && rawMarket==="Romania" &&
      rawVariant==="Stage V / F36 FPT / 12F-12R / 4WD / cab")
    return {variant:"Stage V, F36 FPT, 12F-12R, 4WD, cab",market};
  if (tractor.brand_name==="Iseki" && rawMarket==="Europe" && rawVariant) {
    const reviewed:Record<string,readonly string[]>={
      TG6407:["TG6 Stage V / Dual clutch / cab / GMWJCYE4","TG6 Stage V / Dual clutch / rear ROPS / GMWJRE4"],
      TG6507:["TG6 Stage V / Dual clutch / cab / GMWJCYE4","TG6 Stage V / HST / cab / HMWJCYE4"],
      TG6557:["TG6 Stage V / Power shuttle / cab / MWJCYE4"],
      TG6687:["TG6 Stage V / HST / cab / HMWJCYE4","TG6 Stage V / Power shuttle / cab / MWJCYE4",
        "TG6 Stage V / Power shuttle / ROPS / WJRE4"]
    };
    if (reviewed[name]?.includes(rawVariant)) return {variant:rawVariant.replaceAll(" / ",", "),market};
  }
  return {variant,market};
}

export function modelSeoMetadata(tractor: TractorRecord, lang: Locale) {
  const model = tractor.brand_name + " " + tractor.model_name;
  // The three verified manufacturer families below contain *catalogue-source notes*
  // in the stored variant/market strings. Keep those complete originals in the
  // visible technical record and structured-data disambiguatingDescription, but
  // do not repeat editorial source wording in search titles. Unlike a blind
  // character truncation, this never drops a real 2WD/4WD, Stage V or engine
  // designation. Unrecognized variants retain the full original identity.
  const rawVariant = tractor.variant?.split(";")[0]?.trim() || null;
  const rawMarket = tractor.market?.trim() || null;
  const isSwarajTarget = tractor.brand_name === "Swaraj"
    && /^Target (?:625|630) (?:2WD|4WD)$/.test(tractor.model_name)
    && rawVariant === "Target India / exact 2WD or 4WD configuration"
    && rawMarket === "India (Swaraj Target manufacturer data)";
  const isLamborghiniStageV = tractor.brand_name === "Lamborghini Trattori"
    && /^Spire [SV] 80 Target$/.test(tractor.model_name)
    && rawVariant === "Spire S/V Target / Stage V 2025 brochure"
    && rawMarket === "Europe (manufacturer Stage V 04/2025)";
  const isHistoricalBelarus = tractor.brand_name === "Belarus"
    && /^(?:112N-01|132N|152)$/.test(tractor.model_name)
    && rawVariant === "Honda GX390 · historical manufacturer catalogue"
    && rawMarket === "Unspecified (historical catalogue)";

  // Two exact source-note cases verified against published public records:
  // the brochure/measurement wording is NOT an equipment trim. Retain the
  // verbatim variant in the visible record and disambiguatingDescription.
  const isAgraleCargoSourceNote = tractor.brand_name === "Agrale"
    && tractor.model_name === "4125 Cargo"
    && rawVariant === "Brazil / Cargo / NBR ISO 1585 25 cv at 2400rpm"
    && rawMarket === "Brazil";
  const isSpireFSourceNote = tractor.brand_name === "Lamborghini Trattori"
    && tractor.model_name === "Spire F 80 Target"
    && rawVariant === "Stage V / F 80 model / OEM brochure 04-2025"
    && rawMarket === "Europe";
  // Two published Deutz-Fahr 5D identities differed ONLY in their full,
  // 60+ character catalogue variant. The old <=48 check discarded both and
  // produced 20 duplicate model titles across ten languages (5065 D / 5075 D).
  // Keep the real GS vs non-GS distinction, never the source-document date.
  const isDeutz5DSourceVariant = tractor.brand_name === "Deutz-Fahr"
    && /^(?:5055|5065|5075|5090|5100) D$/.test(tractor.model_name)
    && rawMarket === "Türkiye"
    && (rawVariant === "5D Series GS / Stage V (Türkiye 2025 manufacturer brochure)"
      || rawVariant === "5D Series (non-GS) / Stage V (Türkiye 2025 manufacturer brochure)");
  const deutzIdentityLabel = rawVariant?.startsWith("5D Series GS")
    ? "5D GS · Stage V" : "5D non-GS · Stage V";
  // Exact, published source-note rows checked against Supabase on 2026-11-22.
  // Keep the complete variant/market unmodified in the catalogue and JSON-LD.
  // These display-only labels remove bibliography prose from search titles;
  // real equipment differences (2WD/4WD, gearing, Stage V, i-HMT, region)
  // must remain visible. Unknown or later-edited strings use raw identity.
  const reviewedSourceNotes =
    tractor.brand_name === "LS Tractor" && tractor.model_name === "MT573CPS"
      && rawMarket === "US" && rawVariant === "US official product / power shuttle cab"
      ? {variant:"power shuttle cab",markets:["US"]}
    : tractor.brand_name === "McCormick" && tractor.model_name === "X5.085"
      && rawVariant === "Stage V X5.085 / 09-2023 brochure"
      && rawMarket === "Europe / Turkey (manufacturer 09/2023)"
      ? {variant:"Stage V",markets:["Europe","Turkey"]}
    : tractor.brand_name === "Steyr" && tractor.model_name === "6440 CERVUS CVT"
      && rawVariant === "CERVUS CVT"
      && rawMarket === "International (STEYR 2025 brochure)"
      ? {variant:null,markets:["International"]}
    : tractor.brand_name === "Valtra" && tractor.model_name === "T215"
      && rawVariant === "T Series"
      && rawMarket === "Europe / UK 2025 manufacturer brochure"
      ? {variant:"T Series",markets:["Europe","UK"]}
    : tractor.brand_name === "Yanmar" && tractor.model_name === "YT347"
      && rawVariant === "YT3 i-HMT"
      && rawMarket === "Turkey (manufacturer YT3 model table)"
      ? {variant:"YT3 i-HMT",markets:["Turkey"]}
    : tractor.brand_name === "Mahindra" && tractor.model_name === "JIVO 225 DI"
      && rawVariant === "India 2WD / 8F x 4R / manufacturer configuration"
      && rawMarket === "India"
      ? {variant:"2WD / 8F x 4R",markets:["India"]}
    : tractor.brand_name === "Mahindra" && tractor.model_name === "JIVO 245 DI"
      && rawVariant === "India 4WD / 8F x 4R / exact JIVO 245 DI"
      && rawMarket === "India"
      ? {variant:"4WD / 8F x 4R",markets:["India"]}
    : tractor.brand_name === "Sonalika" && tractor.model_name === "Tiger DI 55 III"
      && rawVariant === "India / Tiger DI 55 III original / 12F×3R"
      && rawMarket === "India"
      ? {variant:"12F×3R",markets:["India"]}
    // Same source-note pattern applies to a verified, bounded manufacturer
    // family. The names and original notes below were read from the published
    // catalog, and different equipment variants remain separate.
    : tractor.brand_name === "Valtra"
      && /^(?:F\d+|G\d+e?|N\d+e?|Q\d+|S\d+|T\d+e?)$/.test(tractor.model_name)
      && rawMarket === "Europe / UK 2025 manufacturer brochure"
      ? {variant:rawVariant,markets:["Europe","UK"]}
    : tractor.brand_name === "Valtra"
      && /^A(?:75|85|95|105|115)$/.test(tractor.model_name)
      && rawMarket === "International (2025 brochure)"
      ? {variant:rawVariant,markets:["International"]}
    : tractor.brand_name === "Valtra" && tractor.model_name === "S416"
      && rawMarket === "Europe / Valtra 2025–26 manufacturer documents"
      && rawVariant === "S Series"
      ? {variant:"S Series",markets:["Europe"]}
    : tractor.brand_name === "Steyr"
      && /^6(?:360|390|440) CERVUS CVT$/.test(tractor.model_name)
      && rawVariant === "CERVUS CVT"
      && rawMarket === "International (STEYR 2025 brochure)"
      ? {variant:null,markets:["International"]}
    : tractor.brand_name === "Steyr"
      && /^6(?:170|180|200) IMPULS$/.test(tractor.model_name)
      && rawVariant === "IMPULS"
      && rawMarket === "International (2026 manufacturer brochure)"
      ? {variant:null,markets:["International"]}
    : tractor.brand_name === "SAME"
      && /^DORADO NATURAL /.test(tractor.model_name)
      && rawVariant === "Stage IIIA / 2019 brochure"
      && rawMarket === "Europe"
      ? {variant:"Stage IIIA",markets:["Europe"]}
    : tractor.brand_name === "Landini"
      && /^2-0(?:45|50|60)$/.test(tractor.model_name)
      && rawVariant === "Serie 2 / Tier 3 / 2017 brochure"
      && rawMarket === "Italy"
      ? {variant:"Serie 2 · Tier 3",markets:["Italy"]}
    : tractor.brand_name === "Zetor"
      && /^61(?:30|40|50|70)$/.test(tractor.model_name)
      && rawVariant === "6 Series / Stage V · manufacturer table"
      && rawMarket === "International (Stage V specification)"
      ? {variant:"6 Series · Stage V",markets:["International"]}
    : tractor.brand_name === "Yanmar" && tractor.model_name === "YT359"
      && rawVariant === "YT3 i-HMT"
      && rawMarket === "Turkey (manufacturer YT3 model table)"
      ? {variant:"YT3 i-HMT",markets:["Turkey"]}
    : tractor.brand_name === "Mahindra"
      && tractor.model_name === "JIVO 225 DI 4WD"
      && rawVariant === "India 4WD / 8F x 4R / manufacturer configuration"
      && rawMarket === "India"
      ? {variant:"4WD / 8F x 4R",markets:["India"]}
    : tractor.brand_name === "Mahindra"
      && tractor.model_name === "YUVRAJ 215 NXT"
      && rawVariant === "India 2WD / 6F x 3R / manufacturer configuration"
      && rawMarket === "India"
      ? {variant:"2WD / 6F x 3R",markets:["India"]}
    : tractor.brand_name === "Mahindra"
      && tractor.model_name === "JIVO 305 DI 4WD"
      && rawVariant === "India 4WD / 8F x 4R / manufacturer specification"
      && rawMarket === "India"
      ? {variant:"4WD / 8F x 4R",markets:["India"]}
    : null;
  const variantLabel = isSwarajTarget ? null
    : isLamborghiniStageV || isSpireFSourceNote ? "Stage V"
    : isHistoricalBelarus ? "Honda GX390"
    : isAgraleCargoSourceNote ? null
    : isDeutz5DSourceVariant ? deutzIdentityLabel
    : reviewedSourceNotes ? reviewedSourceNotes.variant
    : rawVariant;
  const marketLabel = !rawMarket || rawMarket.toLowerCase() === "global" ? null
    : isSwarajTarget ? marketDisplayName("India",lang)
    : isLamborghiniStageV ? marketDisplayName("Europe",lang)
    : reviewedSourceNotes
      ? reviewedSourceNotes.markets.map(region=>marketDisplayName(region,lang)).join(" / ")
    : marketDisplayName(rawMarket, lang);
  const buildTitle=(titleVariant:string|null,titleMarket=marketLabel,reviewedLong=false)=>{
  const qualifiers = [
    titleVariant && (reviewedLong || titleVariant.length <= 48) ? titleVariant : null,
    titleMarket, tractor.model_year == null ? null : String(tractor.model_year)
  ].filter((part):part is string=>Boolean(part));
  const identityQualifiers=qualifiers.length ? " — " + qualifiers.join(" · ") : "";
  const fullTitle=model + " " + t(lang,"modelSpecsTitle") + identityQualifiers + " | TractorVS";
  // 60 characters is an audit-tool guidance value, not a Google hard limit.
  // Prefer a shorter title only when ALL real model/variant/market/year
  // qualifiers survive untouched. Otherwise prefer the localized concise
  // technical noun; never cut an identifying value just to satisfy a tool.
  const conciseTitle=model + " " + CONCISE_SPECS_TITLE[lang] + identityQualifiers + " | TractorVS";
  // Preserve already-short, genuinely localized titles byte-for-byte.
  // OpenSEO 2026-11-24: the 60-character identity-only fallback produced
  // identical ES/FR/RU titles for Başak 5120 despite translated page content.
  // Keep a natural localized technical noun before chasing an advisory
  // character count. Remove the optional site name, never the model identity.
  // Extremely long identities retain the previous non-truncating fallback.
  const conciseWithoutSiteName=model + " " + CONCISE_SPECS_TITLE[lang] + identityQualifiers;
  const identityWithoutSiteName=model + identityQualifiers;
  return fullTitle.length<=60 ? fullTitle
    : conciseTitle.length<=60 ? conciseTitle
    : conciseWithoutSiteName.length<=105 ? conciseWithoutSiteName
    : identityWithoutSiteName;

  };
  const originalTitle=buildTitle(variantLabel);
  const compactVariant=compactReviewedTitleVariant(tractor,rawVariant,rawMarket,variantLabel);
  const compactTitle=compactVariant!==variantLabel?buildTitle(compactVariant):originalTitle;
  // Do not churn short titles or replace an existing one with a longer title.
  const previouslyReviewedTitle=originalTitle.length>60 && compactTitle.length<originalTitle.length?compactTitle:originalTitle;
  const reviewedIdentity=reviewedRemainingTitleIdentity(tractor,rawVariant,rawMarket,
    compactVariant,marketLabel,lang);
  const remainingTitle=buildTitle(reviewedIdentity.variant,reviewedIdentity.market);
  const shorterTitle=previouslyReviewedTitle.length>60 && remainingTitle.length<previouslyReviewedTitle.length
    ? remainingTitle : previouslyReviewedTitle;
  // The prior 48-character variant filter suppressed the two genuine T97
  // equipment choices. Remove only the verified bibliography wording.
  const t97=tractor.brand_name==="Iseki" && tractor.model_name==="T97 Series" &&
    rawVariant==="T97 Cabin / T97 ROPS (manufacturer specification)" &&
    rawMarket==="International (ISEKI global catalogue)";
  const txgs=tractor.brand_name==="Iseki" && tractor.model_name==="TXGS24" &&
    rawVariant==="UK official TXGS24 brochure / 4WD hydrostatic / ROPS" &&
    rawMarket==="United Kingdom";
  const restoredIsekiVariant=tractor.brand_name==="Iseki" && rawMarket==="Europe" &&
    reviewedIdentity.variant!==variantLabel && Boolean(reviewedIdentity.variant) &&
    reviewedIdentity.variant!.length<=48 && Boolean(variantLabel && variantLabel.length>48);
  const reviewedLong=reviewedLongTitleRow(tractor.brand_name,tractor.model_name,rawVariant,rawMarket,tractor.model_year ?? null);
  // An explicitly reviewed real configuration is more important than length.
  // Do not choose the previous shorter title if it had lost the entire variant.
  // For these exact reviewed records preserve a native technical title noun
  // even when the full mechanical configuration exceeds the advisory budget.
  // This avoids identical ES/PT-BR titles without deleting factual qualifiers.
  const reviewedLongTitle=reviewedLong ? buildTitle(reviewedLong.variant, reviewedLong.market
    ? marketDisplayName(reviewedLong.market,lang) : marketLabel, true) : null;
  const needsLocalizedLongNoun=reviewedLong && tractor.brand_name==="Antonio Carraro" &&
    ["TONY 8700 V","TONY 8900 TRG"].includes(tractor.model_name) &&
    (lang==="es" || lang==="pt-br") && reviewedLongTitle &&
    !reviewedLongTitle.includes(CONCISE_SPECS_TITLE[lang]);
  const fullReviewedTitle=needsLocalizedLongNoun
    ? reviewedLongTitle!.replace(model+" — ",model+" "+CONCISE_SPECS_TITLE[lang]+" — ")
    : reviewedLong ? buildTitle(reviewedLong.variant, reviewedLong.market
    ? marketDisplayName(reviewedLong.market,lang) : marketLabel, true)
    : t97 ? buildTitle("Cabin / ROPS",SHORT_INTERNATIONAL_TITLE[lang])
    : txgs ? buildTitle("4WD hydrostatic / ROPS") : restoredIsekiVariant ? remainingTitle : shorterTitle;

  // Full live audit 45594475241: four ES/PT-BR titles exceed the guidance
  // only because of the generic technical noun. Keep every exact qualifier.
  const title=needsLocalizedLongNoun && fullReviewedTitle.length>105
    ? fullReviewedTitle.replace(model+" "+CONCISE_SPECS_TITLE[lang]+" — ",model+" "+(lang==="es"?"Datos":"Ficha")+" — ")
    : fullReviewedTitle;

  const copy = MODEL_COPY[lang];
  const sourceCount = new Set(tractor.specifications.map(spec =>
    officialManufacturerSourceUrl(spec, tractor.brand_name)).filter(Boolean)).size;
  const independentCount = new Set(tractor.specifications.map(spec =>
    reviewedIndependentSourceUrl(spec)).filter(Boolean)).size;
  const variantContext = originalVariantNote(tractor);
  const details = [variantLabel, marketLabel,
    tractor.model_year == null ? null : String(tractor.model_year)]
    .filter((part):part is string=>Boolean(part));
  const identity = model + (details.length ? " (" + details.join(" · ") + ")" : "");
  // Search snippets must never assert an engine power number merely because
  // an unsourced catalogue summary field contains one. The numeric claim
  // only appears when the exact HP value matches dated, reviewed evidence.
  // Sonalika's explicitly qualified *category* (not engine test output)
  // retains its separate manufacturer-market wording.
  const headlinePower=matchedHeadlinePowerSource(tractor);
  const countSentence=tractor.specifications.length ? copy.specs(tractor.specifications.length) : copy.empty;
  const powerSentence=tractor.horsepower == null ? null : (hasInternationalSonalikaContext(tractor)
    ? SONALIKA_EXPORT_COPY[lang].hpDescription(tractor.horsepower)
    : headlinePower ? copy.power(tractor.horsepower) : null);
  const nominalSentence=nominalManufacturerSnippet(tractor,lang);
  const manufacturerSentence=sourceCount ? copy.withSources : (independentCount ? null : copy.withoutSources);
  const independentSentence=independentCount ? INDEPENDENT_SOURCE_COPY[lang].seoOnlyIndependent : null;
  const noteSentence=variantContext && lang === "en" ? copy.note(variantContext.replace(/[.。।]+$/u, "")) : null;
  const segments = [identity+".",countSentence,powerSentence,nominalSentence,manufacturerSentence,independentSentence,noteSentence]
    .filter((part):part is string=>Boolean(part));
  const description=segments.join(" ");
  // The full, source-aware editorial explanation remains visible on the page.
  // Build the search snippet separately from complete sentences rather than
  // cutting a technical value, market, or source qualifier mid-word.
  // 160 is an editorial target, not a Google ranking or display guarantee.
  // A generic count should not displace a verified, query-relevant power
  // fact. Never discard exact market/variant/year to fit such a fact.
  // A truly long identity may exceed the advisory limit by itself.
  let searchDescription=identity+".";
  const addSentence=(sentence:string|null):boolean=>{
    if(!sentence||searchDescription.length+1+sentence.length>160)return false;
    searchDescription+=" "+sentence;
    return true;
  };
  const independentLabel=INDEPENDENT_SOURCE_COPY[lang].label+
    (lang==="zh"||lang==="ja"?"。":lang==="hi"?"।":".");
  const addIndependent=():boolean=>{
    if(!independentSentence)return false;
    // Keep useful specification coverage alongside provenance when both fit
    // only with the existing concise source label. Never weaken the label.
    const fullWithCount=searchDescription.length+2+independentSentence.length+countSentence.length;
    if(fullWithCount>160&&addSentence(independentLabel))return true;
    return addSentence(independentSentence)||addSentence(independentLabel);
  };
  const independentPower=headlinePower?.sourceType==="independent"&&!hasInternationalSonalikaContext(tractor);
  // A standalone independent power figure must retain its provenance.
  if(independentPower){
    if(independentSentence&&powerSentence&&
        searchDescription.length+2+independentLabel.length+powerSentence.length<=160){
      addSentence(independentLabel);
      addSentence(powerSentence);
    }else{
      addIndependent();
    }
  }else{
    addSentence(powerSentence);
  }
  if(!independentPower&&independentSentence)addIndependent();
  addSentence(nominalSentence);
  addSentence(countSentence);
  addSentence(manufacturerSentence);
  addSentence(noteSentence);
  // A long identity must not leave the entire snippet in source-language
  // wording. Live audit 2026-11-24: TONY 8700 V repeated identical
  // descriptions across DE/ES/PT-BR and EN/FR when no full sentence fit.
  // Reuse the reviewed localized technical noun, without shortening the
  // variant, market or year, or adding a new unsupported numeric claim.
  // 160 remains guidance: an exact identity plus useful language context
  // may legitimately exceed it. Empty records must stay explicitly empty.
  if(searchDescription===identity+"."){
    searchDescription=tractor.specifications.length
      ? model+" — "+CONCISE_SPECS_TITLE[lang]+identity.slice(model.length)+"."
      : identity+". "+copy.empty;
  }
  // The same full live audit found 16 overlong snippets on four exact
  // reviewed records. Use the existing reviewed equipment identity only for
  // this metadata advisory, never for the visible explanation or JSON-LD.
  // Do not shorten unknown variants or introduce an unsupported power claim.
  const auditedSnippetRow=reviewedLong && (
    (reviewedLong.brand==="ArmaTrac" && ["804 Fruit Garden Cabin","804.4 Fruit Garden ROPS"].includes(reviewedLong.model)) ||
    (reviewedLong.brand==="Yanmar" && ["YM347","YM359"].includes(reviewedLong.model)));
  if(auditedSnippetRow && tractor.specifications.length && searchDescription.length>160){
    const reviewedMarket=reviewedLong.market ? marketDisplayName(reviewedLong.market,lang) : marketLabel;
    const qualifiers=[reviewedLong.variant,reviewedMarket,tractor.model_year==null?null:String(tractor.model_year)].filter(Boolean).join(" · ");
    const compact=model+" — "+CONCISE_SPECS_TITLE[lang]+" ("+qualifiers+").";
    if(compact.length<=160 && compact.length<searchDescription.length)searchDescription=compact;
  }
  searchDescription=addReviewedCompareSearchCue(searchDescription,tractor,lang);
  return {title,description,searchDescription};
}

/**
 * TractorVS is an independent specifications catalogue, not a seller.
 *
 * Vehicle is a subclass of schema.org/Product, so Google asks for an Offer,
 * Review or AggregateRating on every model page even though the site does
 * not collect verified offers or ratings. Do not invent those claims.
 *
 * Keep the indexed WebPage, its breadcrumbs, a stable identity for the
 * documented tractor, and links to actual manufacturer evidence. The
 * manufacturer-backed specification values remain visible in the HTML
 * comparison cards, without claiming Product rich-result eligibility.
 */
export function modelStructuredData(tractor: TractorRecord, lang: Locale, siteUrl: string) {
  const pageUrl = new URL(localizedPath(lang, "/tractors/" + tractor.slug + "/"), siteUrl).toString();
  const listUrl = new URL(localizedPath(lang, "/tractors/"), siteUrl).toString();
  const homeUrl = new URL(localizedPath(lang, "/"), siteUrl).toString();
  const name = tractor.brand_name + " " + tractor.model_name;
  const meta = modelSeoMetadata(tractor, lang);
  const sourceLinks = [...new Set(tractor.specifications.flatMap((spec) => [
    officialManufacturerSourceUrl(spec, tractor.brand_name), reviewedIndependentSourceUrl(spec),
  ]).filter((url): url is string => Boolean(url)))].slice(0, 12);

  const subject: Record<string, unknown> = {
    "@type": "Thing",
    "@id": pageUrl + "#tractor",
    name,
    url: pageUrl,
    identifier: tractor.tractor_id,
    description: meta.description,
  };
  const identityContext = [tractor.variant, tractor.market, tractor.model_year]
    .filter((part) => part !== null && part !== undefined && String(part).trim())
    .map(String);
  if (identityContext.length) subject.disambiguatingDescription = identityContext.join(" · ");
  const image=primaryTractorPhoto(tractor);
  if(image) subject.image = { "@id":pageUrl+"#photo" };
  if (sourceLinks.length) subject.subjectOf = sourceLinks.map((url) => ({
    "@type": "CreativeWork", url,
  }));

  const graph:Record<string,unknown>[] = [
      {
        "@type": "WebPage",
        "@id": pageUrl + "#webpage",
        url: pageUrl,
        name: meta.title,
        description: meta.description,
        inLanguage: lang === "zh" ? "zh-Hans" : lang === "pt-br" ? "pt-BR" : lang,
        mainEntity: { "@id": pageUrl + "#tractor" },
        about: { "@id": pageUrl + "#tractor" },
        ...(sourceLinks.length ? { citation: sourceLinks } : {}),
        ...(image ? { primaryImageOfPage: { "@id":pageUrl+"#photo" } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "TractorVS", item: homeUrl },
          { "@type": "ListItem", position: 2, name: t(lang, "allTractors"), item: listUrl },
          { "@type": "ListItem", position: 3, name, item: pageUrl },
        ],
      },
      subject,
  ];
  if(image)graph.push({
    "@type":"ImageObject",
    "@id":pageUrl+"#photo",
    contentUrl:new URL(image.fullUrl,siteUrl).toString(),
    thumbnailUrl:new URL(image.displayUrl,siteUrl).toString(),
    caption:tractorPhotoAlt(tractor,lang),
    creator:{"@type":"Person",name:image.photographer},
    // A photo author is NOT automatically the current copyright owner.
    // Include the owner only for a matched, source-specific Own-work + self-license
    // attestation verified by the copyright proof gate; never assert © TractorVS.
    // CC0 dedicators receive no fabricated copyright ownership claim.
    ...(image.copyrightEvidence==="commons-own-work-self-license"
      && image.copyrightOwner && image.copyrightOwner===image.photographer
      && image.copyrightClaimUrl===image.sourcePage
      && image.licenseName!=="CC0"
      ? {copyrightNotice:image.copyrightOwner}: {}),
    creditText:image.photographer+" · "+image.licenseName,
    license:image.licenseUrl,
    // Commons' specific File: page identifies this image and explains the
    // author's licensing/reuse conditions. A generic CC license deed is not
    // the image-specific acquisition/information page.
    acquireLicensePage:image.sourcePage,
  });
  return {"@context":"https://schema.org","@graph":graph};
}
