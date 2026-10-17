import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {ScopeSwitch} from "@/components/scope-switch";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {
  SnapshotsTable,
  SnapshotsTableSkeleton,
} from "@/features/dashboard/workload/snapshots/components/snapshots-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("snapshots.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function SnapshotsPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.workload.snapshots.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.workload.snapshots.INDEX,
  ]);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("snapshots.title"),
            href: APP_PATHS.dashboard.snapshots.index,
          },
        ]}
      />
      <Box py="md">
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("snapshots.tabs.allSnapshots"),
            mine: t("snapshots.tabs.mySnapshots"),
          }}
          all={
            <Suspense key={`all-${page}`} fallback={<SnapshotsTableSkeleton />}>
              <SnapshotsTable page={page ?? 1} />
            </Suspense>
          }
          mine={
            <Suspense
              key={`mine-${page}`}
              fallback={<SnapshotsTableSkeleton />}
            >
              <SnapshotsTable page={page ?? 1} scope="mine" />
            </Suspense>
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(SnapshotsPage, {
  requiredPermissions: [
    "workload.snapshots.index",
    "self.workload.snapshots.index",
  ],
});
