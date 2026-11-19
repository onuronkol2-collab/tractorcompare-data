import type {Locale} from "./locales.ts";
/**
 * Verified technical measurements are shared and NEVER translated, guessed
 * or converted. Only prose and human-readable labels are localized.
 */
export interface LocalizedReview {
  title:string;meta:string;kicker:string;h1:string;lead:string;
  lastChecked:string;disclaimer:string;figures:string;label:string;value:string;
  rowLabels:[string,string,string,string,string,string,string,string];
  localizedValues:[string,string,string];
  sectionTitles:[string,string,string,string];
  sectionParagraphs:[[string,string],[string,string],[string,string],[string,string]];
  sourceTitle:string;sourceIntro:string;
  manufacturerSource:string;pdfSource:string;cabinSource:string;twoWheelSource:string;
  tableSource:string;variantNote:string;
  modelPage:string;selectionGuide:string;catalog:string;methodNote:string;
}
export const REVIEW_TRANSLATIONS:Partial<Record<Locale,LocalizedReview>>={
};
export const reviewedLanguage=(lang:Locale):LocalizedReview|null=>REVIEW_TRANSLATIONS[lang]??null;
