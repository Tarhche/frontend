import {type Metadata} from "next";
import {VerifyForm} from "@/features/auth/components/verify-form";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {getDictionary} from "@/i18n/dictionary";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: t("auth.verify.metadataTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    token: string;
  }>;
};

async function AccountVerificationPage(props: Props) {
  const token = (await props.searchParams).token;

  let languages: Language[] = [];
  let defaultLanguageCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultLanguageCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if languages are unavailable.
  }

  return (
    <VerifyForm
      token={token}
      languages={languages}
      defaultLanguageCode={defaultLanguageCode}
    />
  );
}

export default AccountVerificationPage;
