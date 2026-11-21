import {hasInternationalSonalikaContext,SONALIKA_EXPORT_COPY} from "./sonalika-context-i18n.ts";
import type { TractorRecord } from "./catalog.ts";
import { officialManufacturerSourceUrl,reviewedIndependentSourceUrl } from "./catalog.ts";
import {INDEPENDENT_SOURCE_COPY} from "./independent-source-i18n.ts";
import { localizedPath, type Locale } from "./locales.ts";
import { t } from "./ui.ts";
import { marketDisplayName } from "./market-display.ts";
import {primaryTractorPhoto,tractorPhotoAlt} from "./tractor-photos.ts";
import {matchedHeadlinePowerSource} from "./model-evidence-answers.ts";

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
    withSources:"已提供经核实的制造商来源链接。",
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
  ru:"Характеристики",ja:"仕様",es:"Ficha técnica"
};

/** Keep original source/variant notes available without pretending to translate them. */
export function originalVariantNote(tractor:Pick<TractorRecord,"variant">):string|null {
  return tractor.variant?.split(";").slice(1).join(";").trim() || null;
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

  const variantLabel = isSwarajTarget ? null
    : isLamborghiniStageV ? "Stage V"
    : isHistoricalBelarus ? "Honda GX390"
    : rawVariant;
  const marketLabel = !rawMarket || rawMarket.toLowerCase() === "global" ? null
    : isSwarajTarget ? marketDisplayName("India",lang)
    : isLamborghiniStageV ? marketDisplayName("Europe",lang)
    : marketDisplayName(rawMarket, lang);
  const qualifiers = [
    variantLabel && variantLabel.length <= 48 ? variantLabel : null,
    marketLabel, tractor.model_year == null ? null : String(tractor.model_year)
  ].filter((part):part is string=>Boolean(part));
  const identityQualifiers=qualifiers.length ? " — " + qualifiers.join(" · ") : "";
  const fullTitle=model + " " + t(lang,"modelSpecsTitle") + identityQualifiers + " | TractorVS";
  // Google has no fixed title-character limit, but repeatedly verbose titles
  // add noise. Shorten only generic label text; keep the exact full variant,
  // year and market differentiators even if the result remains over 105 chars.
  const conciseTitle=model + " " + CONCISE_SPECS_TITLE[lang] + identityQualifiers + " | TractorVS";
  const identityOnlyTitle=model + identityQualifiers + " | TractorVS";
  const title=fullTitle.length<=105 ? fullTitle
    : conciseTitle.length<=105 ? conciseTitle
    : identityOnlyTitle;

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
  const segments = [
    identity + ".",
    tractor.specifications.length ? copy.specs(tractor.specifications.length) : copy.empty,
    tractor.horsepower == null ? null : (hasInternationalSonalikaContext(tractor)
      ? SONALIKA_EXPORT_COPY[lang].hpDescription(tractor.horsepower)
      : headlinePower ? copy.power(tractor.horsepower) : null),
    sourceCount ? copy.withSources : (independentCount ? null : copy.withoutSources),
    independentCount ? INDEPENDENT_SOURCE_COPY[lang].seoOnlyIndependent : null,
    variantContext && lang === "en" ? copy.note(variantContext.replace(/[.。।]+$/u, "")) : null,
  ].filter((part):part is string=>Boolean(part));
  return {title,description:segments.join(" ")};
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
    // The photographer is credited but has not been independently proven to be
    // the current copyright holder; never manufacture a copyright notice.
    // This matters especially for approved CC0 photographs.
    creditText:image.photographer+" · "+image.licenseName,
    license:image.licenseUrl,
    // Commons' specific File: page identifies this image and explains the
    // author's licensing/reuse conditions. A generic CC license deed is not
    // the image-specific acquisition/information page.
    acquireLicensePage:image.sourcePage,
  });
  return {"@context":"https://schema.org","@graph":graph};
}
