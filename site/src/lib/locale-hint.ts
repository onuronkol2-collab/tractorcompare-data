import {LOCALES, type Locale} from "./locales.ts";

/** Suggest a locale only from an actual browser language choice, never IP or UA. */
export function suggestedLocale(browserLanguage: string | null | undefined): Locale | null {
  const raw = browserLanguage?.trim().toLowerCase();
  if (!raw) return null;
  const base = raw.split("-")[0];
  if (base === "en") return null;
  const locale = base === "pt" ? "pt-br" : base === "zh" ? "zh"
    : (LOCALES as readonly string[]).includes(base) ? base : null;
  return locale && locale !== "en" ? locale as Locale : null;
}
