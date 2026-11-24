// Curated snippets for EXISTING, published research pages only.
// These do not create new translations, routes, claims, or change on-page H1s.
// Exact original title guard prevents stale SEO claims if an author edits a post.
// The 60-character range is a voluntary readability goal, not a Google requirement.
export const VERIFIED_FORUM_TITLE_PAIRS = Object.freeze({
  "9f82b9f3-7aab-41ee-8588-a0a383f80694": {
    "en": [
      "2020–2027 Tractor Reliability Problems and Models with Documented Faults",
      "2020–2027 Tractor Faults: Documented Cases | TractorVS"
    ],
    "tr": [
      "2020–2027 Traktör Kronik Arızaları ve Sorunlu Modeller",
      "2020–2027 Traktör Arızaları: Belgeli Vakalar | TractorVS"
    ],
    "zh": [
      "2020–2027年拖拉机故障调查：有记录的缺陷与涉及车型",
      "2020–2027年拖拉机故障：记录与来源 | TractorVS"
    ],
    "hi": [
      "2020–2027 में ट्रैक्टर की खराबियाँ: प्रमाणित दोष और प्रभावित मॉडल",
      "ट्रैक्टर की खराबियाँ 2020–2027 | TractorVS"
    ],
    "pt-br": [
      "Falhas de tratores em 2020–2027: defeitos documentados e modelos afetados",
      "Falhas de tratores 2020–2027: fontes | TractorVS"
    ],
    "fr": [
      "Pannes de tracteurs 2020–2027 : défauts documentés et modèles concernés",
      "Pannes de tracteurs 2020–2027 : faits sourcés | TractorVS"
    ],
    "de": [
      "Traktorprobleme 2020–2027: Dokumentierte Mängel und betroffene Modelle",
      "Traktormängel 2020–2027: Belegte Fälle | TractorVS"
    ],
    "ru": [
      "Проблемы тракторов в 2020–2027 годах: подтверждённые дефекты и модели",
      "Тракторы 2020–2027: подтверждённые случаи | TractorVS"
    ],
    "ja": [
      "2020–2027年のトラクター故障：記録された欠陥と対象機種",
      "トラクター故障 2020–2027：記録と出典 | TractorVS"
    ],
    "es": [
      "Problemas de tractores 2020–2027: fallas documentadas y modelos afectados",
      "Averías de tractores 2020–2027: casos | TractorVS"
    ]
  },
  "713ab252-a925-4ab7-b2c8-a30ce5b86706": {
    "en": [
      "2026 Tractor Dealer Satisfaction Rankings: Brands and Scores",
      "2026 Tractor Dealer Satisfaction Rankings | TractorVS"
    ],
    "tr": [
      "2026 Traktör Bayi Memnuniyeti Sıralaması: Markalar ve Puanlar",
      "2026 Traktör Bayi Memnuniyeti Sıralaması | TractorVS"
    ],
    "pt-br": [
      "Ranking de satisfação dos concessionários de tratores em 2026: marcas e pontuações",
      "Satisfação dos concessionários 2026 | TractorVS"
    ],
    "fr": [
      "Classement 2026 de la satisfaction des concessionnaires de tracteurs : marques et notes",
      "Satisfaction des concessionnaires 2026 | TractorVS"
    ],
    "de": [
      "Traktorhändler-Zufriedenheit 2026: Markenranking und Punktzahlen",
      "Traktorhändler 2026: Zufriedenheit | TractorVS"
    ],
    "ru": [
      "Рейтинг удовлетворённости дилеров тракторов за 2026 год: бренды и баллы",
      "Рейтинг дилеров тракторов 2026 | TractorVS"
    ]
  },
  "b11d1ad6-f0cc-4a18-ab83-9d18ccc2f7ea": {
    "de": [
      "Woher kommen Traktormarken? Herkunft, Eigentümer und Produktionsstandorte (2026)",
      "Traktormarken: Herkunft, Eigentümer, Werke (2026)"
    ],
    "en": [
      "Tractor brand origins: countries, owners and manufacturing locations (2026)",
      "Tractor brands: origins, owners and factories (2026)"
    ],
    "es": [
      "¿De qué país son las marcas de tractores? Origen, propietarios y fábricas (2026)",
      "Marcas de tractores: origen, dueños y fábricas (2026)"
    ],
    "fr": [
      "De quels pays viennent les marques de tracteurs ? Origines, propriétaires et usines (2026)",
      "Marques de tracteurs : origine, propriétaires, usines (2026)"
    ],
    "hi": [
      "ट्रैक्टर ब्रांड किस देश के हैं? दुनिया के ब्रांड, स्वामी और उत्पादन स्थल (2026)",
      "ट्रैक्टर ब्रांड: देश, स्वामी और उत्पादन स्थल (2026)"
    ],
    "ja": [
      "トラクターブランドの発祥国は？世界のメーカー、所有企業と生産地（2026年）",
      "トラクターブランドの発祥国・所有企業・生産地（2026年） | TractorVS"
    ],
    "pt-br": [
      "De que país são as marcas de tratores? Origens, proprietários e fábricas (2026)",
      "Marcas de tratores: origem, donos e fábricas (2026)"
    ],
    "ru": [
      "Из каких стран происходят марки тракторов? Владельцы и места производства (2026)",
      "Марки тракторов: страны, владельцы и производство (2026)"
    ],
    "tr": [
      "Traktör Markaları Hangi Ülkenin? Dünya Traktör Markaları ve Üretim Yerleri (2026)",
      "Traktör Markaları: Ülkeler, Sahipleri ve Üretim (2026)"
    ],
    "zh": [
      "拖拉机品牌来自哪个国家？全球品牌归属及生产地（2026年）",
      "拖拉机品牌：来源国、归属与生产地（2026年） | TractorVS"
    ]
  }
});

export function sourceAwareForumSeoTitle(topicId, locale, publishedTitle) {
 const title = String(publishedTitle ?? "");
 const pair = VERIFIED_FORUM_TITLE_PAIRS[topicId]?.[locale];
 return pair && title === pair[0] ? pair[1] : title + " | TractorVS";
}
