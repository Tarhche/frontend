import {type Metadata} from "next";
import {ResetPasswordForm} from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "بازیابی کلمه عبور",
};

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
