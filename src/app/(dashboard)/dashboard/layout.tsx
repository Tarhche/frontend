import {redirect} from "next/navigation";
import {Metadata} from "next";
import {DashboardLayout} from "@/features/dashboard-layout";
import {buildTitle} from "@/lib/seo";
import {isUserLoggedIn} from "@/lib/auth";
import {APP_PATHS} from "@/lib/app-paths";

export const metadata: Metadata = {
  title: {
    template: `%s | ${buildTitle("داشبرد", {withBrand: true})}`,
    default: buildTitle("داشبرد"),
  },
};

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
