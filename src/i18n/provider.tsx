"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {usePathname} from "next/navigation";
import {useDirection} from "@mantine/core";
import {getDictionary, type TFunction} from "./dictionary";
import {isLocale, type Direction, type Locale} from "./config";
import {LANGUAGE_COOKIE_NAME} from "@/constants";

type I18nContextValue = {
  t: TFunction;
  locale: Locale;
  direction: Direction;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

type Props = {
  // Server-resolved language code (cookie/token/default), used until the client
  // can read the URL/cookie — avoids a wrong-language flash on first paint.
  initialLanguageCode?: string;
  children: ReactNode;
};

// Resolves the active locale for client components and keeps the document
// direction in sync.
//
// Resolution by surface:
//   - Public `[lang]` pages → the URL's first segment (authoritative; the public
//     switcher changes it and the cookie).
//   - Dashboard / auth (unprefixed) → the in-use language: the `lang` cookie
//     (seeded from the profile at login, updated by the header switcher), falling
//     back to the server-resolved `initialLanguageCode` to avoid a first-paint
//     flash before the cookie is readable. Recomputes on navigation, so coming
//     back to the dashboard after a public switch picks up the new language.
export function I18nProvider({initialLanguageCode, children}: Props) {
  const pathname = usePathname();
  const {setDirection} = useDirection();

  const value = useMemo<I18nContextValue>(() => {
    const firstSegment = pathname.split("/").filter(Boolean)[0];
    if (isLocale((firstSegment ?? "").toLowerCase())) {
      return getDictionary(firstSegment);
    }
    const cookieLanguage = readCookie(LANGUAGE_COOKIE_NAME);
    return getDictionary(cookieLanguage ?? initialLanguageCode);
  }, [pathname, initialLanguageCode]);

  useEffect(() => {
    setDirection(value.direction);
    document.documentElement.setAttribute("dir", value.direction);
    document.documentElement.setAttribute("lang", value.locale);
  }, [value, setDirection]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Returns the active translation function. Falls back to the default locale when
// used outside the provider (e.g. in isolated tests) so it never crashes.
export function useTranslations(): TFunction {
  const ctx = useContext(I18nContext);
  return ctx?.t ?? getDictionary().t;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? getDictionary();
}

// Dictionary for client code that runs outside the React tree / above the
// provider (e.g. the react-query error handler). Reads the active language the
// same way the provider does: URL segment → cookie → default.
export function getClientDictionary() {
  if (typeof window === "undefined") {
    return getDictionary();
  }
  const firstSegment = window.location.pathname.split("/").filter(Boolean)[0];
  const languageCode = isLocale((firstSegment ?? "").toLowerCase())
    ? firstSegment
    : readCookie(LANGUAGE_COOKIE_NAME);
  return getDictionary(languageCode);
}
