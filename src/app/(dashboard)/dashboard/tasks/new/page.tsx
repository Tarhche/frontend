import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {TaskForm} from "@/features/dashboard/runner/components/task-form";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("tasks.breadcrumb.create"),
  };
}

async function NewTaskPage() {
  const {t} = await getServerDictionary();

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
        <TaskForm />
      </Box>
    </Box>
  );
}

export default withPermissions(NewTaskPage, {
  requiredPermissions: ["runner.tasks.create"],
});
