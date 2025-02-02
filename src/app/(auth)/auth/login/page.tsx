import {type Metadata} from "next";
import {LoginForm} from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "ورود",
};

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
