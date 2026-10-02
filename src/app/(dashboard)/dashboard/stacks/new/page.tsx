import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {loadRuntimes} from "@/features/dashboard/workload/load-runtimes";
import {StackForm} from "@/features/dashboard/workload/components/stack-form";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("stacks.breadcrumb.create"),
  };
}

async function NewStackPage() {
  const {t} = await getServerDictionary();

  // Somebody trusted with everybody's stacks asks what a stack can be run as
  // on anybody's behalf; somebody trusted with only their own asks as
  // themselves.
  const permissions = (await getUserPermissions()) ?? [];
  const own = !hasPermission(permissions, [PERMISSIONS.workload.stacks.INDEX]);
  const runtimes = await loadRuntimes(own);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("stacks.title"),
            href: APP_PATHS.dashboard.stacks.index,
          },
          {
            label: t("stacks.breadcrumb.create"),
            href: APP_PATHS.dashboard.stacks.new,
          },
        ]}
      />
      <Box py="md">
        <StackForm runtimes={runtimes} />
      </Box>
    </Box>
  );
}

export default withPermissions(NewStackPage, {
  requiredPermissions: ["workload.stacks.create"],
});
