import type {Locale} from "./locales.ts";

/** A link to an independent reference is an attribution, not a manufacturer approval.
 * These are translations of conservative source labels, never invented evidence.
 */
export const INDEPENDENT_SOURCE_COPY: Record<Locale,{
  label:string;
  seoOnlyIndependent:string;
}> = {
  en:{label:"Independent reference (not manufacturer-verified)",seoOnlyIndependent:"Selected cited specifications are independently reported; manufacturer verification is not established."},
  tr:{label:"Bağımsız kaynak (üretici teyidi yok)",seoOnlyIndependent:"Kaynak gösterilen bazı teknik bilgiler bağımsız yayınlardan alınmıştır; üretici teyidi bulunmamaktadır."},
  zh:{label:"独立资料（未经制造商确认）",seoOnlyIndependent:"部分有来源的技术参数来自独立资料，尚无制造商确认。"},
  hi:{label:"स्वतंत्र स्रोत (निर्माता द्वारा पुष्टि नहीं)",seoOnlyIndependent:"कुछ संदर्भित तकनीकी विवरण स्वतंत्र प्रकाशनों से हैं; निर्माता द्वारा पुष्टि उपलब्ध नहीं है।"},
  "pt-br":{label:"Fonte independente (sem confirmação do fabricante)",seoOnlyIndependent:"Algumas especificações citadas provêm de fontes independentes; não há confirmação do fabricante."},
  fr:{label:"Source indépendante (sans confirmation du constructeur)",seoOnlyIndependent:"Certaines caractéristiques citées proviennent de sources indépendantes, sans confirmation du constructeur."},
  de:{label:"Unabhängige Quelle (nicht vom Hersteller bestätigt)",seoOnlyIndependent:"Einige belegte technische Daten stammen aus unabhängigen Quellen; eine Herstellerbestätigung liegt nicht vor."},
  ru:{label:"Независимый источник (без подтверждения производителя)",seoOnlyIndependent:"Часть технических данных подтверждена ссылками на независимые публикации, но не производителем."},
  ja:{label:"独立資料（メーカー未確認）",seoOnlyIndependent:"出典付きの一部の仕様は独立した資料に基づき、メーカーによる確認はありません。"},
  es:{label:"Fuente independiente (sin confirmación del fabricante)",seoOnlyIndependent:"Algunas especificaciones citadas proceden de fuentes independientes y no están confirmadas por el fabricante."}
};
