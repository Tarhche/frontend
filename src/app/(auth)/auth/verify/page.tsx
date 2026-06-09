import {type Metadata} from "next";
import {VerifyForm} from "@/features/auth/components/verify-form";
import {fetchLanguages, type Language} from "@/dal/public/languages";

export const metadata: Metadata = {
  title: "تکمیل حساب کاربری",
};

type Props = {
  searchParams: Promise<{
    token: string;
  }>;
};

async function AccountVerificationPage(props: Props) {
  const token = (await props.searchParams).token;

  let languages: Language[] = [];
  let defaultCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if languages are unavailable.
  }

  return (
    <VerifyForm token={token} languages={languages} defaultCode={defaultCode} />
  );
}

export default AccountVerificationPage;
