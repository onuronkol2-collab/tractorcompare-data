import {localizedPath, type Locale} from "./locales.ts";
import {editorialHubTranslation} from "./editorial-hub-i18n.ts";
import {brandDirectoryText} from "./brand-directory-i18n.ts";

// Link only to genuine published routes; the glossary body exists in EN/TR.
export function catalogEditorialLinks(lang: Locale) {
  const copy=editorialHubTranslation(lang);
  const tr=lang==="tr";
  const label=copy?.heading ?? (tr?"Traktör makaleleri ve teknik rehberler":"Tractor articles and technical guides");
  const links=[
    {href:localizedPath(lang,"/articles/"),label:copy?.heading ?? label},
    {href:localizedPath(lang,"/guides/choosing-a-tractor/"),label:copy?.cards[0][0] ?? (tr?"Traktör seçme rehberi":"Tractor selection guide")},
    {href:localizedPath(lang,"/brands/"),label:brandDirectoryText(lang)[12]}
  ];
  if(lang==="en"||tr) links.push({href:localizedPath(lang,"/guides/tractor-technical-terms/"),label:tr?"Traktör teknik terimleri":"Tractor technical terms"});
  return {label,links};
}
