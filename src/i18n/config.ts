// Translation locales the app ships messages for. Site language codes come from
// the backend (e.g. "EN"/"FA", often uppercase); they map to a locale here by
// lowercasing, and anything we don't have messages for falls back to the default.
export const LOCALES = ["fa", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fa";

export type Direction = "ltr" | "rtl";

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

export function localeFromLanguageCode(languageCode?: string | null): Locale {
  const lower = (languageCode ?? "").toLowerCase();
  return isLocale(lower) ? lower : DEFAULT_LOCALE;
}
