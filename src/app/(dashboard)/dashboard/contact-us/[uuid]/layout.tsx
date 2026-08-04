import {ReactNode} from "react";
import {Box} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

async function ContactMessageLayout({children}: {children: ReactNode}) {
  const {t} = await getServerDictionary();

  return (
    <>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("contactUs.dashboard.title"),
            href: APP_PATHS.dashboard.contactUs.index,
          },
          {
            label: t("contactUs.dashboard.detailTitle"),
          },
        ]}
      />
      <Box mt="md">{children}</Box>
    </>
  );
}

export default ContactMessageLayout;
