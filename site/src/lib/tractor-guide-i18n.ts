import type {Locale} from "./locales.ts";

export interface LocalizedGuide {
  title:string;
  meta:string;
  category:string;
  h1:string;
  lead:string;
  updated:string;
  noTest:string;
  sections:{title:string;paragraphs:[string,string];question:string;refs:number[]}[];
  worksheetTitle:string;
  headers:[string,string,string];
  rows:[string,string,string][];
  sourceTitle:string;
  sourceIntro:string;
  sourcePrefix:string;
  ctaTitle:string;
  ctaDesc:string;
  catalog:string;
  compare:string;
  method:string;
  limits:string;
  breadcrumb:string;
  // Original institutional names remain searchable, though UI labels are localized.
}
export const GUIDE_TRANSLATIONS: Partial<Record<Locale,LocalizedGuide>> = {
};
export function guideTranslation(lang:Locale):LocalizedGuide|null {
  return GUIDE_TRANSLATIONS[lang]??null;
}
