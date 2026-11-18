import {LOCALE_TAGS, type Locale} from "./locales.ts";
import {COUNTRY_NAMES} from "./farm-advisor.ts";
import type {MarketCountry} from "./market-prices.ts";

/** Render country controls in the visitor language without changing stored ISO codes. */
export function localizedCountryName(code:MarketCountry,locale:Locale):string {
  try{
    const value=new Intl.DisplayNames([LOCALE_TAGS[locale]],{type:"region"}).of(code);
    if(value && value!==code)return value;
  }catch{/* Older browser: retain the reviewed fallback country name. */}
  return COUNTRY_NAMES[code];
}
