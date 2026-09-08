import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {ScopeSwitch} from "@/components/scope-switch";
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

  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.runner.containers.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.runner.containers.INDEX,
  ]);

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
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("containers.tabs.allContainers"),
            mine: t("containers.tabs.myContainers"),
          }}
          all={
            <Suspense
              key={`all-${page}`}
              fallback={<ContainersTableSkeleton />}
            >
              <ContainersTable page={page ?? 1} />
            </Suspense>
          }
          mine={
            <Suspense
              key={`mine-${page}`}
              fallback={<ContainersTableSkeleton />}
            >
              <ContainersTable page={page ?? 1} scope="mine" />
            </Suspense>
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(ContainersPage, {
  requiredPermissions: [
    "runner.containers.index",
    "self.runner.containers.index",
  ],
});
