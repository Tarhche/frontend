import {Metadata} from "next";
import {type ReactNode} from "react";
import {Container} from "@mantine/core";
import {LanguageProvider} from "@/components/language/language-context";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  children: ReactNode;
  params: Promise<{lang: string}>;
};

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: {
      default: t("auth.layout.metadataTitleDefault"),
      template: t("auth.layout.metadataTitleTemplate"),
    },
  };
}

export default async function RootLayout({children}: Props) {
  // Auth pages are language-prefixed (`/{lang}/auth/...`). The LanguageProvider
  // lets the `Link` component prefix internal links with the active language,
  // just like the public pages.
  let languages: Language[] = [];
  let defaultLanguageCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultLanguageCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: render without language switching if languages are unavailable.
  }

  return (
    <LanguageProvider
      languages={languages}
      defaultLanguageCode={defaultLanguageCode}
    >
      <Container size={480} my={60}>
        {children}
      </Container>
    </LanguageProvider>
  );
}
