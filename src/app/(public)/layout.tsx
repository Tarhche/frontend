import {AppMainShell} from "@/components/app-main-shell";
import {LanguageProvider} from "@/components/language/language-context";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import Footer from "./footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let languages: Language[] = [];
  let defaultCode = "";

  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: render the shell without language switching when the
    // languages endpoint is unavailable.
  }

  return (
    <LanguageProvider languages={languages} defaultCode={defaultCode}>
      <AppMainShell>
        {children} <Footer />
      </AppMainShell>
    </LanguageProvider>
  );
}
