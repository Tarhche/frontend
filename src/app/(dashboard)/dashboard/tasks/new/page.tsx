import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {loadRuntimes} from "@/features/dashboard/workload/load-runtimes";
import {TaskForm} from "@/features/dashboard/workload/components/task-form";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("tasks.breadcrumb.create"),
  };
}

async function NewTaskPage() {
  const {t} = await getServerDictionary();

  // Somebody trusted with everybody's tasks asks what a task can be run as on
  // anybody's behalf; somebody trusted with only their own asks as themselves.
  const permissions = (await getUserPermissions()) ?? [];
  const own = !hasPermission(permissions, [PERMISSIONS.workload.tasks.INDEX]);
  const runtimes = await loadRuntimes(own);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("tasks.title"),
            href: APP_PATHS.dashboard.tasks.index,
          },
          {
            label: t("tasks.breadcrumb.create"),
            href: APP_PATHS.dashboard.tasks.new,
          },
        ]}
      />
      <Box py="md">
        <TaskForm runtimes={runtimes} />
      </Box>
    </Box>
  );
}

export default withPermissions(NewTaskPage, {
  requiredPermissions: ["workload.tasks.create"],
});
