import {Metadata} from "next";
import {Suspense} from "react";
import {Alert, Box, Stack} from "@mantine/core";
import {IconAlertTriangle} from "@tabler/icons-react";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {UsersTable, UsersTableSkeleton} from "@/features/users/components";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("users.page.listTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
    // set by the route that opens the dashboard as another user, when the
    // backend would not open one
    impersonation?: string;
  }>;
};

async function MyBookmarksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const params = await searchParams;
  const page = Number(params.page) || 1;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("users.page.listTitle"),
          },
        ]}
      />
      {params.impersonation === "failed" ? (
        <Alert color="red" variant="light" icon={<IconAlertTriangle />}>
          {t("users.table.impersonationFailed")}
        </Alert>
      ) : null}
      <Box>
        <Suspense
          key={JSON.stringify(params)}
          fallback={<UsersTableSkeleton />}
        >
          <UsersTable page={page} />
        </Suspense>
      </Box>
    </Stack>
  );
}

export default withPermissions(MyBookmarksPage, {
  requiredPermissions: ["users.index"],
});
