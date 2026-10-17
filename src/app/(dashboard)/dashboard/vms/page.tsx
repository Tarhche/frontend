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
  VmsTable,
  VmsTableSkeleton,
} from "@/features/dashboard/workload/vms/components/vms-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("vms.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function VmsPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.workload.vms.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.workload.vms.INDEX,
  ]);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[{label: t("vms.title"), href: APP_PATHS.dashboard.vms.index}]}
      />
      <Box py="md">
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("vms.tabs.allVms"),
            mine: t("vms.tabs.myVms"),
          }}
          all={
            <Suspense key={`all-${page}`} fallback={<VmsTableSkeleton />}>
              <VmsTable page={page ?? 1} />
            </Suspense>
          }
          mine={
            <Suspense key={`mine-${page}`} fallback={<VmsTableSkeleton />}>
              <VmsTable page={page ?? 1} scope="mine" />
            </Suspense>
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(VmsPage, {
  requiredPermissions: ["workload.vms.index", "self.workload.vms.index"],
});
