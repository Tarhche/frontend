import {Metadata} from "next";
import {Suspense} from "react";
import {Box, Stack} from "@mantine/core";
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
  }>;
};

async function MyBookmarksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const page = Number((await searchParams).page) || 1;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("users.page.listTitle"),
          },
        ]}
      />
      <Box>
        <Suspense
          key={JSON.stringify(await searchParams)}
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
