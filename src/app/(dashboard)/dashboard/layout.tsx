import {redirect} from "next/navigation";
import {Metadata} from "next";
import {DashboardLayout} from "@/features/dashboard-layout";
import {buildTitle} from "@/lib/seo";
import {getServerDictionary} from "@/i18n/server";
import {isUserTokenValid} from "@/lib/auth";
import {APP_PATHS} from "@/lib/app-paths";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();

  return {
    title: {
      template: `%s | ${buildTitle(t("nav.dashboard"), {withBrand: true})}`,
      default: buildTitle(t("nav.dashboard")),
    },
  };
}

type Props = {
  children: React.ReactNode;
};

export default async function RootLayout({children}: Props) {
  // the middleware has already had its chance to refresh, so a token that is
  // still not valid stands for nobody
  if (!(await isUserTokenValid("access-token"))) {
    redirect(APP_PATHS.auth.login);
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
