/**
 * A visible, model-specific evidence trail for people, search engines and
 * AI-powered retrieval. Uses only the public, published, evidence-gated
 * specification URLs — never draft research or arbitrary third-party links.
 *
 * Counts refer to displayed specification rows referencing each source; a link
 * alone does not prove a tractor configuration or an independent test.
 */
import type { Locale } from "./locales.ts";
import type { TractorRecord } from "./catalog.ts";
import {
  officialManufacturerSourceUrl,
  reviewedIndependentSourceUrl,
} from "./catalog.ts";

export type SourceKind = "manufacturer" | "independent";
export interface SourceDocument {
  url: string;
  kind: SourceKind;
  publisher: string;
  hostname: string;
  specificationCount: number;
}
export interface ModelSources {
  documents: SourceDocument[];
  totalDocuments: number;
  manufacturerDocuments: number;
  independentDocuments: number;
  linkedSpecifications: number;
  remainingDocuments: number;
}

export function modelSourceIndex(tractor: Pick<TractorRecord, "brand_name" | "specifications">, limit = 8): ModelSources {
  const byUrl = new Map<string, SourceDocument>();
  let linkedSpecifications = 0;
  for (const spec of tractor.specifications) {
    const official = officialManufacturerSourceUrl(spec, tractor.brand_name);
    const independent = official ? null : reviewedIndependentSourceUrl(spec);
    const url = official || independent;
    if (!url) continue;
    linkedSpecifications += 1;
    let item = byUrl.get(url);
    if (!item) {
      item = {
        url,
        kind: official ? "manufacturer" : "independent",
        publisher: spec.source_publisher?.trim() || new URL(url).hostname,
        hostname: new URL(url).hostname,
        specificationCount: 0,
      };
      byUrl.set(url, item);
    }
    item.specificationCount += 1;
  }
  const all = [...byUrl.values()].sort((a, b) =>
    Number(b.kind === "manufacturer") - Number(a.kind === "manufacturer")
    || b.specificationCount - a.specificationCount
    || a.url.localeCompare(b.url)
  );
  const shown = all.slice(0, Math.max(0, Math.floor(limit)));
  return {
    documents: shown,
    totalDocuments: all.length,
    manufacturerDocuments: all.filter((s) => s.kind === "manufacturer").length,
    independentDocuments: all.filter((s) => s.kind === "independent").length,
    linkedSpecifications,
    remainingDocuments: all.length - shown.length,
  };
}

export const MODEL_SOURCE_COPY: Record<Locale, {
  kicker: string;
  title: string;
  introduction: string;
  official: string;
  independent: string;
  linked: string;
  more: string;
  caution: string;
}> = {
  en: {
    kicker: "SOURCE TRANSPARENCY",
    title: "Documents behind this tractor's specifications",
    introduction: "These links appear in the published technical records for this exact tractor entry. Manufacturer documents and independently reviewed third-party sources are distinguished.",
    official: "Manufacturer document", independent: "Reviewed independent source",
    linked: "technical entries linked", more: "Additional source links are shown beside the corresponding specifications above.",
    caution: "A source link does not mean all years, markets, equipment variants or measurement standards are identical. Check the source and the notes next to each figure before comparing tractors.",
  },
  tr: {
    kicker: "KAYNAK ŞEFFAFLIĞI",
    title: "Bu traktörün teknik veri kaynakları",
    introduction: "Aşağıdaki belgeler, bu traktör kaydında yayımlanan teknik özelliklerle bağlantılıdır. Üretici belgeleri ve incelenmiş bağımsız kaynaklar birbirinden ayrı gösterilir.",
    official: "Üretici belgesi", independent: "İncelenmiş bağımsız kaynak",
    linked: "teknik kayıtla bağlantılı", more: "Diğer kaynak bağlantıları yukarıdaki ilgili teknik özelliklerin yanında bulunur.",
    caution: "Kaynak bağlantısı; bütün yılların, pazarların, donanım varyantlarının veya ölçüm standartlarının aynı olduğunu göstermez. Traktörleri karşılaştırmadan önce belgedeki koşulları ve her değerin yanındaki notları inceleyin.",
  },
  zh: {
    kicker: "来源透明度",
    title: "此拖拉机技术参数的资料来源",
    introduction: "以下链接对应此拖拉机条目已发布的技术参数。制造商文件与经过审核的独立第三方资料分开列出。",
    official: "制造商文件", independent: "已审核的独立资料",
    linked: "项技术记录引用", more: "其他资料链接列在上方相应技术参数旁。",
    caution: "有资料链接不代表所有年份、市场、配置版本或测量标准均相同。比较拖拉机前，请核对原始文件及各参数旁的说明。",
  },
  hi: {
    kicker: "स्रोत पारदर्शिता",
    title: "इस ट्रैक्टर के तकनीकी आँकड़ों के स्रोत",
    introduction: "ये लिंक इसी ट्रैक्टर प्रविष्टि में प्रकाशित तकनीकी विवरणों से जुड़े हैं। निर्माता के दस्तावेज़ और जाँचे गए स्वतंत्र स्रोत अलग-अलग दिखाए गए हैं।",
    official: "निर्माता का दस्तावेज़", independent: "समीक्षित स्वतंत्र स्रोत",
    linked: "तकनीकी विवरणों से संबद्ध", more: "अन्य स्रोत लिंक ऊपर संबंधित तकनीकी विवरणों के साथ दिए गए हैं।",
    caution: "स्रोत लिंक होने का अर्थ यह नहीं कि हर वर्ष, बाज़ार, संस्करण या माप मानक एक जैसा है। ट्रैक्टरों की तुलना से पहले मूल दस्तावेज़ और हर आँकड़े के पास की टिप्पणी पढ़ें।",
  },
  "pt-br": {
    kicker: "TRANSPARÊNCIA DAS FONTES",
    title: "Fontes das especificações deste trator",
    introduction: "Os documentos abaixo estão associados aos dados técnicos publicados para esta configuração. Documentos do fabricante e fontes independentes revisadas são apresentados separadamente.",
    official: "Documento do fabricante", independent: "Fonte independente revisada",
    linked: "registros técnicos vinculados", more: "Outras fontes aparecem junto às respectivas especificações acima.",
    caution: "Um link não significa que todos os anos, mercados, versões ou padrões de medição sejam iguais. Consulte os documentos e as observações de cada valor antes de comparar tratores.",
  },
  fr: {
    kicker: "TRANSPARENCE DES SOURCES",
    title: "Sources des caractéristiques de ce tracteur",
    introduction: "Ces documents sont associés aux données techniques publiées pour cette fiche. Les documents constructeur et les sources indépendantes examinées sont distingués.",
    official: "Document du constructeur", independent: "Source indépendante examinée",
    linked: "caractéristiques liées", more: "Les autres liens figurent à côté des caractéristiques correspondantes ci-dessus.",
    caution: "La présence d'une source ne signifie pas que les années, marchés, versions ou normes de mesure sont identiques. Vérifiez le document et les notes de chaque valeur avant toute comparaison.",
  },
  de: {
    kicker: "QUELLENTRANSPARENZ",
    title: "Quellen für die technischen Angaben dieses Traktors",
    introduction: "Diese Dokumente sind mit den veröffentlichten technischen Angaben zu genau diesem Datensatz verknüpft. Herstellerunterlagen und geprüfte unabhängige Quellen werden getrennt ausgewiesen.",
    official: "Herstellerdokument", independent: "Geprüfte unabhängige Quelle",
    linked: "verknüpfte technische Angaben", more: "Weitere Quellen stehen oben direkt neben den betreffenden technischen Angaben.",
    caution: "Ein Quellenlink bedeutet nicht, dass Baujahre, Märkte, Ausstattungen oder Messnormen übereinstimmen. Prüfen Sie vor Vergleichen das Originaldokument und die Hinweise zum jeweiligen Wert.",
  },
  ru: {
    kicker: "ПРОЗРАЧНОСТЬ ИСТОЧНИКОВ",
    title: "Источники технических данных этого трактора",
    introduction: "Эти документы связаны с опубликованными характеристиками именно этой записи. Материалы производителя и проверенные независимые источники показаны отдельно.",
    official: "Документ производителя", independent: "Проверенный независимый источник",
    linked: "связанных технических записей", more: "Остальные ссылки находятся рядом с соответствующими характеристиками выше.",
    caution: "Наличие ссылки не означает совпадения годов выпуска, рынков, комплектаций или стандартов измерения. Перед сравнением изучите оригинал и примечания к каждому значению.",
  },
  ja: {
    kicker: "資料の透明性",
    title: "このトラクターの仕様に関する資料",
    introduction: "以下は、この車両データに掲載された技術仕様に結び付く資料です。メーカー文書と確認済みの独立資料を区別して掲載しています。",
    official: "メーカー資料", independent: "確認済みの独立資料",
    linked: "件の技術項目に関連", more: "その他の資料は、上記の該当する仕様の横に掲載しています。",
    caution: "資料へのリンクだけで、年式・市場・装備仕様・測定基準が同一とは限りません。比較前に元資料と各数値の注記を確認してください。",
  },
  es: {
    kicker: "TRANSPARENCIA DE FUENTES",
    title: "Fuentes de las especificaciones de este tractor",
    introduction: "Estos documentos están vinculados a los datos técnicos publicados de esta ficha. Se distinguen los documentos del fabricante de las fuentes independientes revisadas.",
    official: "Documento del fabricante", independent: "Fuente independiente revisada",
    linked: "datos técnicos vinculados", more: "Las demás fuentes se encuentran junto a las especificaciones correspondientes, más arriba.",
    caution: "Tener una fuente no implica que coincidan todos los años, mercados, variantes o normas de medición. Comprueba el documento original y las notas de cada valor antes de comparar tractores.",
  },
};
