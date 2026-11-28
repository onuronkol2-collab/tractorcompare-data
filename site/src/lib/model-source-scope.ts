import type {Locale} from "./locales.ts";
import type {ModelSources} from "./model-source-index.ts";
/** Counts are distinct URLs, not unique publications, tests or reliability scores. */
export const SOURCE_SCOPE_COPY:Record<Locale,readonly [string,string]> = {
  "en": [
    "{model}: {total} distinct source links — manufacturer: {official}; reviewed independent: {independent}.",
    "The list below contains {shown} of those links; the remaining links appear with the corresponding specifications. Filters apply only to the listed links."
  ],
  "tr": [
    "{model}: {total} farklı kaynak bağlantısı — üretici: {official}; incelenmiş bağımsız kaynak: {independent}.",
    "Aşağıdaki liste bu bağlantıların {shown} tanesini içerir. Diğer bağlantılar ilgili teknik özelliklerin yanında yer alır. Filtreler yalnızca bu listedeki bağlantıları kapsar."
  ],
  "zh": [
    "{model}：共 {total} 个不同的来源链接，其中制造商来源 {official} 个、已审核独立来源 {independent} 个。",
    "下方列出其中 {shown} 个链接，其余链接见对应技术参数。筛选仅适用于下方列表。"
  ],
  "hi": [
    "{model}: कुल {total} अलग स्रोत लिंक — निर्माता के {official}; समीक्षित स्वतंत्र स्रोतों के {independent}।",
    "नीचे इनमें से {shown} लिंक हैं। अन्य लिंक संबंधित तकनीकी विवरणों के साथ हैं। फ़िल्टर केवल नीचे दिए गए लिंक पर लागू होते हैं।"
  ],
  "pt-br": [
    "{model}: {total} links de fontes distintos — fabricante: {official}; independentes revisados: {independent}.",
    "A lista abaixo reúne {shown} desses links; os demais estão junto às especificações correspondentes. Os filtros se aplicam apenas à lista."
  ],
  "fr": [
    "{model} : {total} liens de sources distincts — constructeur : {official} ; sources indépendantes examinées : {independent}.",
    "La liste ci-dessous contient {shown} de ces liens ; les autres figurent auprès des caractéristiques correspondantes. Les filtres ne concernent que cette liste."
  ],
  "de": [
    "{model}: {total} unterschiedliche Quellenlinks – Hersteller: {official}; geprüfte unabhängige Quellen: {independent}.",
    "Die folgende Liste enthält {shown} dieser Links. Weitere Links stehen bei den jeweiligen technischen Angaben. Die Filter gelten nur für diese Liste."
  ],
  "ru": [
    "{model}: {total} различных ссылок на источники — производитель: {official}; проверенные независимые источники: {independent}.",
    "В списке ниже представлены {shown} ссылок. Остальные находятся рядом с соответствующими характеристиками. Фильтры применяются только к этому списку."
  ],
  "ja": [
    "{model}：異なる出典リンクは計 {total} 件（メーカー資料 {official} 件、確認済み独立資料 {independent} 件）。",
    "下の一覧にはそのうち {shown} 件のリンクを掲載しています。残りは対応する技術仕様にあります。絞り込みはこの一覧のみが対象です。"
  ],
  "es": [
    "{model}: {total} enlaces distintos a fuentes — fabricante: {official}; fuentes independientes revisadas: {independent}.",
    "La lista siguiente contiene {shown} de esos enlaces; los demás figuran junto a las especificaciones correspondientes. Los filtros solo se aplican a esta lista."
  ]
};
export function sourceScopeText(model:string,sources:Pick<ModelSources,"totalDocuments"|"manufacturerDocuments"|"independentDocuments"|"remainingDocuments"|"documents">,lang:Locale){
 const n=new Intl.NumberFormat(lang);
 const values:Record<string,string>={model,total:n.format(sources.totalDocuments),official:n.format(sources.manufacturerDocuments),independent:n.format(sources.independentDocuments),shown:n.format(sources.documents.length)};
 const fill=(s:string)=>s.replace(/\{(model|total|official|independent|shown)\}/g,(_,key)=>values[key]);
 const [summary,scope]=SOURCE_SCOPE_COPY[lang];
 return {summary:fill(summary),scope:sources.remainingDocuments>0?fill(scope):null};
}
