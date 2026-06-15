import {type Metadata} from "next";
import {LoginForm} from "@/features/auth/components/login-form";
import {getDictionary} from "@/i18n/dictionary";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: t("auth.login.metadataTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const callbackUrl = searchParams.callbackUrl;
  return <LoginForm callbackUrl={callbackUrl} />;
}

export default LoginPage;
