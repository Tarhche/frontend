import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {
  ContainersTable,
  ContainersTableSkeleton,
} from "@/features/dashboard/runner/components/containers-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("containers.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function ContainersPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("containers.title"),
            href: APP_PATHS.dashboard.containers.index,
          },
        ]}
      />
      <Box py="md">
        <Suspense key={page} fallback={<ContainersTableSkeleton />}>
          <ContainersTable page={page ?? 1} />
        </Suspense>
      </Box>
    </Box>
  );
}

export default withPermissions(ContainersPage, {
  requiredPermissions: ["runner.containers.index"],
});
