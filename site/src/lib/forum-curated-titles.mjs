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
  }
});

export function sourceAwareForumSeoTitle(topicId, locale, publishedTitle) {
 const title = String(publishedTitle ?? "");
 const pair = VERIFIED_FORUM_TITLE_PAIRS[topicId]?.[locale];
 return pair && title === pair[0] ? pair[1] : title + " | TractorVS";
}
