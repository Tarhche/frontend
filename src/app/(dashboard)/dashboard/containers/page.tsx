import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {ScopeSwitch} from "@/components/scope-switch";
import {ContainersTable} from "@/features/dashboard/workload/docker/components/containers-table";
import {dockerMay} from "@/features/dashboard/workload/docker/permissions";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("containers.title"),
  };
}

async function ContainersPage() {
  const {t} = await getServerDictionary();

  // the listing is the browser's, asked for again every few seconds: what the
  // person may do is worked out here and handed to it, once per listing.
  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.workload.containers.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.workload.containers.INDEX,
  ]);
  const canCreate = hasPermission(permissions, [
    PERMISSIONS.workload.containers.CREATE,
  ]);

  const [allVms, myVms] = await Promise.all([
    dockerVmSource("all", permissions),
    dockerVmSource("mine", permissions),
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
            all: t("containers.tabs.all"),
            mine: t("containers.tabs.mine"),
          }}
          all={
            <ContainersTable
              scope="all"
              may={dockerMay(permissions, "all")}
              canCreate={canCreate}
              vmSource={allVms}
            />
          }
          mine={
            <ContainersTable
              scope="mine"
              may={dockerMay(permissions, "mine")}
              canCreate={canCreate}
              vmSource={myVms}
            />
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(ContainersPage, {
  requiredPermissions: [
    "workload.containers.index",
    "self.workload.containers.index",
  ],
});
