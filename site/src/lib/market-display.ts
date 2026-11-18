import type {Locale} from "./locales.ts";
const MARKET: Record<string,Record<Locale,string>> = {
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
  return MARKET[market.trim().toLowerCase()]?.[locale]||market;
}
