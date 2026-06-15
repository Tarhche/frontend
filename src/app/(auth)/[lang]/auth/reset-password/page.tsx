import {type Metadata} from "next";
import {ResetPasswordForm} from "@/features/auth/components/reset-password-form";
import {getDictionary} from "@/i18n/dictionary";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: t("auth.resetPassword.metadataTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    token: string;
  }>;
};

async function ResetPasswordPage(props: Props) {
  const token = (await props.searchParams).token;
  return <ResetPasswordForm token={token} />;
}

export default ResetPasswordPage;
