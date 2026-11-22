/**
 * Consistent search folding for prerendered and newly published forum cards.
 * Latin diacritics are optional for search; non-Latin combining marks,
 * including Hindi vowels, must never be removed.
 * This is presentation-only: never modifies canonical URLs or stored text.
 */
const LATIN_LOCALES=new Set(["en","tr","de","fr","es","pt-br"]);
export function forumSearchText(value,locale="en"){
 const language=locale==="pt-br"?"pt-BR":locale;
 const lowered=String(value??"").normalize("NFKC").toLocaleLowerCase(language);
 if(!LATIN_LOCALES.has(locale))return lowered;
 return lowered.normalize("NFD").replace(/\p{M}/gu,"")
  .replaceAll("ı","i").replaceAll("ß","ss").replaceAll("æ","ae")
  .replaceAll("œ","oe").replaceAll("ø","o").replaceAll("ł","l")
  .normalize("NFC");
}
