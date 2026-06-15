import {translations} from "./translations";
import {localeFromLanguageCode, type Direction, type Locale} from "./config";

export type TFunction = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

function resolvePath(obj: unknown, path: string): string | undefined {
  const value = path
    .split(".")
    .reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj);
  return typeof value === "string" ? value : undefined;
}

// Builds a translation function bound to the locale resolved from a site
// language code. Unknown keys fall back to the key itself, so a missing
// translation is visible but never crashes. Supports `{name}` placeholders.
export function getDictionary(languageCode?: string | null): {
  t: TFunction;
  locale: Locale;
  direction: Direction;
} {
  const locale = localeFromLanguageCode(languageCode);
  const {messages, direction} = translations[locale];

  const t: TFunction = (key, vars) => {
    let str = resolvePath(messages, key) ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.split(`{${name}}`).join(String(value));
      }
    }
    return str;
  };

  return {t, locale, direction};
}
