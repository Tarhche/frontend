import {Metadata} from "next";
import {Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";

type Props = {
  children: React.ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("languages.breadcrumb.edit"),
  };
}

async function Layout({children}: Props) {
  const {t} = await getServerDictionary();

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("languages.title"),
            href: APP_PATHS.dashboard.languages.index,
          },
          {
            label: t("languages.breadcrumb.edit"),
          },
        ]}
      />
      {children}
    </Stack>
  );
}

export default Layout;
