import {redirect} from "next/navigation";
import {Metadata} from "next";
import {DashboardLayout} from "@/features/dashboard-layout";
import {buildTitle} from "@/lib/seo";
import {getServerDictionary} from "@/i18n/server";
import {isUserLoggedIn} from "@/lib/auth";
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
  const isLoggedIn = await isUserLoggedIn();

  if (isLoggedIn === false) {
    redirect(APP_PATHS.home);
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
