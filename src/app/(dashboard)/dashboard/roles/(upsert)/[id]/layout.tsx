import {Metadata} from "next";
import {Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

type Props = {
  children: React.ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {title: t("roles.page.editTitle")};
}

async function Layout({children}: Props) {
  const {t} = await getServerDictionary();
  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("roles.page.breadcrumbRoles"),
            href: APP_PATHS.dashboard.roles.index,
          },
          {
            label: t("roles.page.editTitle"),
          },
        ]}
      />
      {children}
    </Stack>
  );
}

export default Layout;
