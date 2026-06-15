import {type Metadata} from "next";
import {RegisterForm} from "@/features/auth/components/register-form";
import {getDictionary} from "@/i18n/dictionary";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: t("auth.register.metadataTitle"),
  };
}

function RegisterPage() {
  return <RegisterForm />;
}

export default RegisterPage;
