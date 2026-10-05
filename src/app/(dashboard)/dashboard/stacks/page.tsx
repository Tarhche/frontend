import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, getUserUuid, hasPermission} from "@/lib/auth";
import {ScopeSwitch} from "@/components/scope-switch";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";
import {StacksTable} from "@/features/dashboard/workload/stacks/components/stacks-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("stacks.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function StacksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;
  const current = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  // the listing is the browser's, asked for again while a stack is on its way
  // somewhere: what the person holds, and who they are, is read here and
  // handed to it, which works out what may be done to each stack.
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.workload.stacks.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.workload.stacks.INDEX,
  ]);
  const canCreate = hasPermission(permissions, [
    PERMISSIONS.workload.stacks.CREATE,
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
            label: t("stacks.title"),
            href: APP_PATHS.dashboard.stacks.index,
          },
        ]}
      />
      <Box py="md">
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("stacks.tabs.allStacks"),
            mine: t("stacks.tabs.myStacks"),
          }}
          all={
            <StacksTable
              scope="all"
              page={current}
              permissions={permissions}
              me={me}
              canCreate={canCreate}
              vmSource={allVms}
              containersVisible={hasPermission(permissions, [
                PERMISSIONS.workload.containers.INDEX,
              ])}
            />
          }
          mine={
            <StacksTable
              scope="mine"
              page={current}
              permissions={permissions}
              me={me}
              canCreate={canCreate}
              vmSource={myVms}
              containersVisible={hasPermission(permissions, [
                PERMISSIONS.self.workload.containers.INDEX,
              ])}
            />
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(StacksPage, {
  requiredPermissions: ["workload.stacks.index", "self.workload.stacks.index"],
});
