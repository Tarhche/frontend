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
  TasksTable,
  TasksTableSkeleton,
} from "@/features/dashboard/runner/components/tasks-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("tasks.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function TasksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.runner.tasks.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.runner.tasks.INDEX,
  ]);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("tasks.title"),
            href: APP_PATHS.dashboard.tasks.index,
          },
        ]}
      />
      <Box py="md">
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("tasks.tabs.allTasks"),
            mine: t("tasks.tabs.myTasks"),
          }}
          all={
            <Suspense key={`all-${page}`} fallback={<TasksTableSkeleton />}>
              <TasksTable page={page ?? 1} />
            </Suspense>
          }
          mine={
            <Suspense key={`mine-${page}`} fallback={<TasksTableSkeleton />}>
              <TasksTable page={page ?? 1} scope="mine" />
            </Suspense>
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(TasksPage, {
  requiredPermissions: ["runner.tasks.index", "self.runner.tasks.index"],
});
