/** Source-published editorial library filters, not additional SEO landing pages. */
export const EDITORIAL_DISCOVERY = {
  en:{heading:"Find a technical article",placeholder:"Search guides, model analyses or technical terms",clear:"Clear search",results:"{visible} of {total} published articles shown",none:"No published articles match this search."},
  tr:{heading:"Teknik makale ara",placeholder:"Rehber, model incelemesi veya teknik terim ara",clear:"Aramayı temizle",results:"Yayımlanmış {total} makalenin {visible} tanesi gösteriliyor",none:"Aramanızla eşleşen yayımlanmış makale bulunamadı."},
  zh:{heading:"查找技术文章",placeholder:"搜索指南、型号分析或技术术语",clear:"清除搜索",results:"显示 {visible} / {total} 篇已发布文章",none:"没有符合搜索条件的已发布文章。"},
  hi:{heading:"तकनीकी लेख खोजें",placeholder:"गाइड, मॉडल विश्लेषण या तकनीकी शब्द खोजें",clear:"खोज साफ़ करें",results:"{total} प्रकाशित लेखों में से {visible} दिखाए गए",none:"इस खोज से कोई प्रकाशित लेख नहीं मिला।"},
  "pt-br":{heading:"Buscar artigo técnico",placeholder:"Pesquise guias, análises de modelos ou termos técnicos",clear:"Limpar busca",results:"Exibindo {visible} de {total} artigos publicados",none:"Nenhum artigo publicado corresponde à busca."},
  fr:{heading:"Rechercher un article technique",placeholder:"Rechercher un guide, une analyse ou un terme technique",clear:"Effacer la recherche",results:"{visible} articles affichés sur {total} articles publiés",none:"Aucun article publié ne correspond à cette recherche."},
  de:{heading:"Technischen Artikel suchen",placeholder:"Ratgeber, Modellanalysen oder Fachbegriffe suchen",clear:"Suche löschen",results:"{visible} von {total} veröffentlichten Artikeln angezeigt",none:"Keine veröffentlichten Artikel entsprechen dieser Suche."},
  ru:{heading:"Найти техническую статью",placeholder:"Поиск руководств, анализа моделей и технических терминов",clear:"Очистить поиск",results:"Показано {visible} из {total} опубликованных статей",none:"По запросу нет опубликованных статей."},
  ja:{heading:"技術記事を探す",placeholder:"ガイド、機種分析、技術用語を検索",clear:"検索を消去",results:"公開済み記事 {total} 件のうち {visible} 件を表示",none:"一致する公開済み記事がありません。"},
  es:{heading:"Buscar artículo técnico",placeholder:"Buscar guías, análisis de modelos o términos técnicos",clear:"Borrar búsqueda",results:"Se muestran {visible} de {total} artículos publicados",none:"No hay artículos publicados que coincidan con la búsqueda."}
};

/** Reading-language coverage describes actual linked full text, not translated summaries. */
export const EDITORIAL_READING_LANGUAGE = {
  "en": {
    "language": "Reading language",
    "all": "All available articles",
    "local": "Full text in English",
    "other": "English-language full text",
    "coverage": "{local} of {total} articles have full text in English.",
    "reset": "Show all articles",
    "sections": "Article categories"
  },
  "tr": {
    "language": "Okuma dili",
    "all": "Tüm yayımlanmış makaleler",
    "local": "Türkçe tam metin",
    "other": "İngilizce tam metin",
    "coverage": "{total} makalenin {local} tanesinin tam metni Türkçe.",
    "reset": "Tüm makaleleri göster",
    "sections": "Makale kategorileri"
  },
  "zh": {
    "language": "阅读语言",
    "all": "全部已发布文章",
    "local": "中文全文",
    "other": "英文全文",
    "coverage": "{total} 篇文章中有 {local} 篇提供中文全文。",
    "reset": "显示全部文章",
    "sections": "文章分类"
  },
  "hi": {
    "language": "पढ़ने की भाषा",
    "all": "सभी प्रकाशित लेख",
    "local": "हिंदी में पूरा लेख",
    "other": "अंग्रेज़ी में पूरा लेख",
    "coverage": "{total} लेखों में से {local} का पूरा पाठ हिंदी में उपलब्ध है।",
    "reset": "सभी लेख दिखाएँ",
    "sections": "लेखों की श्रेणियाँ"
  },
  "pt-br": {
    "language": "Idioma de leitura",
    "all": "Todos os artigos publicados",
    "local": "Texto completo em português",
    "other": "Texto completo em inglês",
    "coverage": "{local} de {total} artigos têm texto completo em português.",
    "reset": "Mostrar todos os artigos",
    "sections": "Categorias de artigos"
  },
  "fr": {
    "language": "Langue de lecture",
    "all": "Tous les articles publiés",
    "local": "Texte intégral en français",
    "other": "Texte intégral en anglais",
    "coverage": "{local} articles sur {total} sont disponibles en français intégral.",
    "reset": "Afficher tous les articles",
    "sections": "Catégories d’articles"
  },
  "de": {
    "language": "Lesesprache",
    "all": "Alle veröffentlichten Artikel",
    "local": "Volltext auf Deutsch",
    "other": "Volltext auf Englisch",
    "coverage": "{local} von {total} Artikeln sind vollständig auf Deutsch verfügbar.",
    "reset": "Alle Artikel anzeigen",
    "sections": "Artikelkategorien"
  },
  "ru": {
    "language": "Язык чтения",
    "all": "Все опубликованные статьи",
    "local": "Полный текст на русском",
    "other": "Полный текст на английском",
    "coverage": "Полный текст на русском доступен для {local} из {total} статей.",
    "reset": "Показать все статьи",
    "sections": "Категории статей"
  },
  "ja": {
    "language": "読む言語",
    "all": "公開済みの全記事",
    "local": "日本語の全文",
    "other": "英語の全文",
    "coverage": "全 {total} 件のうち {local} 件は日本語の全文を読めます。",
    "reset": "全記事を表示",
    "sections": "記事の分類"
  },
  "es": {
    "language": "Idioma de lectura",
    "all": "Todos los artículos publicados",
    "local": "Texto completo en español",
    "other": "Texto completo en inglés",
    "coverage": "{local} de {total} artículos tienen el texto completo en español.",
    "reset": "Mostrar todos los artículos",
    "sections": "Categorías de artículos"
  }
};
