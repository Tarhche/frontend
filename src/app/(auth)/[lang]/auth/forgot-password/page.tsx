import {type Metadata} from "next";
import {ForgotPasswordForm} from "@/features/auth/components/forgot-password-form";
import {getDictionary} from "@/i18n/dictionary";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: t("auth.forgotPassword.metadataTitle"),
  };
}

function RegisterPage() {
  return <ForgotPasswordForm />;
}

export default RegisterPage;
