"use client";

import {createContext, useContext, useMemo, type ReactNode} from "react";
import {usePathname} from "next/navigation";
import type {Language} from "@/dal/public/languages";

type LanguageContextValue = {
  languages: Language[];
  languageCodes: string[];
  defaultLanguageCode: string;
  activeLanguageCode: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type Props = {
  languages: Language[];
  defaultLanguageCode: string;
  children: ReactNode;
};

// Wraps the public pages so the language-aware `Link` and the topbar
// `LanguageSwitcher` know the available languages and which one is active. The
// active language is derived from the first path segment, falling back to the
// site default.
export function LanguageProvider({
  languages,
  defaultLanguageCode,
  children,
}: Props) {
  const pathname = usePathname();

  const value = useMemo<LanguageContextValue>(() => {
    const languageCodes = languages.map((language) => language.code);
    const firstSegment = pathname.split("/").filter(Boolean)[0];
    const activeLanguageCode =
      firstSegment && languageCodes.includes(firstSegment)
        ? firstSegment
        : defaultLanguageCode;

    return {languages, languageCodes, defaultLanguageCode, activeLanguageCode};
  }, [languages, defaultLanguageCode, pathname]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Returns the active language context, or null outside the public pages (e.g.
// dashboard/auth), where links are not language-prefixed.
export function useLanguage(): LanguageContextValue | null {
  return useContext(LanguageContext);
}
