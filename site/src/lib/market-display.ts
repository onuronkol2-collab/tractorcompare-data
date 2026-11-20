import type {Locale} from "./locales.ts";
const MARKET: Record<string,Record<Locale,string>> = {
  international: {
    en:"International catalogue",tr:"Uluslararası katalog",zh:"国际产品目录",hi:"अंतरराष्ट्रीय कैटलॉग","pt-br":"Catálogo internacional",
    fr:"Catalogue international",de:"Internationaler Katalog",ru:"Международный каталог",ja:"国際カタログ",es:"Catálogo internacional",
  },
  brazil: {
    en:"Brazil",tr:"Brezilya",zh:"巴西",hi:"ब्राज़ील","pt-br":"Brasil",
    fr:"Brésil",de:"Brasilien",ru:"Бразилия",ja:"ブラジル",es:"Brasil",
  },
  "united kingdom": {
    en:"United Kingdom",tr:"Birleşik Krallık",zh:"英国",hi:"यूनाइटेड किंगडम","pt-br":"Reino Unido",
    fr:"Royaume-Uni",de:"Vereinigtes Königreich",ru:"Великобритания",ja:"英国",es:"Reino Unido",
  },
  "south africa": {
    en:"South Africa",tr:"Güney Afrika",zh:"南非",hi:"दक्षिण अफ्रीका","pt-br":"África do Sul",
    fr:"Afrique du Sud",de:"Südafrika",ru:"ЮАР",ja:"南アフリカ",es:"Sudáfrica",
  },
  "unspecified (historical catalogue)": {
    en:"Market unknown (archive)",tr:"Pazar bilinmiyor (arşiv)",zh:"市场未注明（历史目录）",hi:"बाज़ार अज्ञात (अभिलेख)","pt-br":"Mercado não informado (arquivo)",
    fr:"Marché non précisé (archives)",de:"Markt unbekannt (Archiv)",ru:"Рынок не указан (архив)",ja:"市場不明（資料）",es:"Mercado sin especificar (archivo)",
  },
  global: {
    en:"Global",tr:"Dünya geneli",zh:"全球",hi:"वैश्विक","pt-br":"Global",
    fr:"Monde",de:"Weltweit",ru:"Мировой рынок",ja:"世界市場",es:"Global",
  },
  europe: {
    en:"Europe",tr:"Avrupa",zh:"欧洲",hi:"यूरोप","pt-br":"Europa",
    fr:"Europe",de:"Europa",ru:"Европа",ja:"欧州",es:"Europa",
  },
  turkey: {
    en:"Turkey",tr:"Türkiye",zh:"土耳其",hi:"तुर्किये","pt-br":"Turquia",
    fr:"Turquie",de:"Türkei",ru:"Турция",ja:"トルコ",es:"Turquía",
  },
  us: {
    en:"United States",tr:"ABD",zh:"美国",hi:"अमेरिका","pt-br":"Estados Unidos",
    fr:"États-Unis",de:"USA",ru:"США",ja:"米国",es:"Estados Unidos",
  },
  india: {
    en:"India",tr:"Hindistan",zh:"印度",hi:"भारत","pt-br":"Índia",
    fr:"Inde",de:"Indien",ru:"Индия",ja:"インド",es:"India",
  },
};
export function marketDisplayName(market:string|null,locale:Locale):string|null {
  if(!market)return null;
  const normalized = market.trim().toLocaleLowerCase("en-US");
  const marketKey = normalized === "türkiye" ? "turkey" : normalized === "uk" ? "united kingdom" : normalized;
  return MARKET[marketKey]?.[locale]||market;
}
