import {ReactNode} from "react";
import {Box} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

async function EditCommentLayout({children}: {children: ReactNode}) {
  const {t} = await getServerDictionary();

  return (
    <>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("comments.dashboard.allTitle"),
            href: APP_PATHS.dashboard.comments.index,
          },
          {
            label: t("comments.dashboard.editTitle"),
          },
        ]}
      />
      <Box mt="md">{children}</Box>
    </>
  );
}

export default EditCommentLayout;
