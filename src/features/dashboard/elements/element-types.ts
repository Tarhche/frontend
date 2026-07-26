import {type TFunction} from "@/i18n/dictionary";

// The element body types the API supports, mapped to their translations.
const ELEMENT_TYPE_LABEL_KEYS: Record<string, string> = {
  jumbotron: "elements.types.jumbotron",
  featured: "elements.types.featured",
  cards: "elements.types.cards",
  stack: "elements.types.stack",
};

// The element type as the reader's language calls it. Works with either `t` —
// `getServerDictionary()` on the server or `useTranslations()` on the client —
// both of which resolve the same active language. An unknown type falls back to
// its raw name rather than a missing-key string.
export function elementTypeLabel(t: TFunction, type: string): string {
  const labelKey = ELEMENT_TYPE_LABEL_KEYS[type];

  return labelKey ? t(labelKey) : type;
}
