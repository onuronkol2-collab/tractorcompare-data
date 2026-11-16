/** Canonical, crawlable locale paths; English preserves the legacy root URLs. */
export const LOCALES = ["en", "tr", "zh", "hi", "pt-br", "fr", "de", "ru", "ja", "es"] as const;
export type Locale = typeof LOCALES[number];
export const NEW_LOCALES: Locale[] = ["zh", "hi", "pt-br", "fr", "de", "ru", "ja", "es"];

export const LOCALE_NAMES: Record<Locale,string> = {
  en: "English", tr: "Türkçe", zh: "简体中文", hi: "हिन्दी",
  "pt-br": "Português (Brasil)", fr: "Français", de: "Deutsch",
  ru: "Русский", ja: "日本語", es: "Español",
};

export const LOCALE_TAGS: Record<Locale,string> = {
  en: "en", tr: "tr", zh: "zh-Hans", hi: "hi", "pt-br": "pt-BR",
  fr: "fr", de: "de", ru: "ru", ja: "ja", es: "es",
};

export function isLocale(lang: string): lang is Locale {
  return (LOCALES as readonly string[]).includes(lang);
}

/** A language switch never changes a tractor's stable slug. */
export function localizedPath(lang: Locale, englishPath: string): string {
  const path = englishPath.startsWith("/") ? englishPath : "/" + englishPath;
  return lang === "en" ? path : "/" + lang + (path === "/" ? "/" : path);
}

/** Preserve the full page path (including tractor slug), without query strings. */
export function unlocalizedPath(pathname: string): string {
  const match = /^\/(tr|zh|hi|pt-br|fr|de|ru|ja|es)(?=\/|$)/i.exec(pathname);
  if (!match) return pathname || "/";
  return pathname.slice(match[0].length) || "/";
}

export const LANGUAGE_COUNTRIES: Partial<Record<string,Locale>> = {
  TR:"tr", IN:"hi", CN:"zh", BR:"pt-br", FR:"fr", DE:"de",
  RU:"ru", JP:"ja", ES:"es", MX:"es", AR:"es", CO:"es",
  CL:"es", PE:"es", PT:"pt-br", AO:"pt-br", MZ:"pt-br",
  US:"en", GB:"en", AU:"en", NZ:"en", ZA:"en",
};

/** Country is a first-visit hint, not a permanent restriction. */
export function preferredLocale(country: string | undefined | null, acceptLanguage = ""): Locale {
  const upper = country?.toUpperCase() || "";
  if (upper === "CA") return /(?:^|,)\s*fr(?:-CA)?\s*(?:;|,|$)/i.test(acceptLanguage) ? "fr" : "en";
  const byCountry = LANGUAGE_COUNTRIES[upper];
  if (byCountry) return byCountry;
  for (const item of acceptLanguage.split(",").map((value) => value.trim().split(";")[0].toLowerCase())) {
    const match = LOCALES.find((locale) =>
      item === locale || item.startsWith(locale + "-") ||
      (locale === "zh" && item.startsWith("zh-")) ||
      (locale === "pt-br" && item.startsWith("pt-"))
    );
    if (match) return match;
  }
  return "en";
}
