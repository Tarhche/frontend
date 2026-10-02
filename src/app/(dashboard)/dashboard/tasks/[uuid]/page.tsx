import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Box, Code, Group, Paper, Stack, Text, Title} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {PermissionGuard} from "@/components/permission-guard";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {
  fetchTask,
  fetchTaskLogs,
  fetchMyTask,
  fetchMyTaskLogs,
} from "@/dal/private/workload";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {taskReasonLabel} from "@/lib/task-state";
import {OwnerInline} from "@/features/dashboard/workload/components/owner-inline";
import {RuntimeBadge} from "@/features/dashboard/workload/components/runtime-badge";
import {StateBadge} from "@/features/dashboard/workload/components/state-badge";
import {TaskEndpoints} from "@/features/dashboard/workload/components/tasks-table/task-endpoints";
import {TaskLogs} from "@/features/dashboard/workload/components/task-logs";
import {TaskTerminal} from "@/features/dashboard/workload/components/task-terminal";
import {TaskTabs} from "@/features/dashboard/workload/components/task-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("tasks.breadcrumb.detail"),
  };
}

type Props = {
  params: Promise<{uuid: string}>;
};

async function TaskPage({params}: Props) {
  const {t} = await getServerDictionary();
  const {uuid} = await params;

  // Somebody trusted with everybody's tasks asks for this one as anybody's;
  // somebody trusted with only their own asks for it as theirs, and is told it
  // does not exist when it is not.
  const permissions = (await getUserPermissions()) ?? [];
  const own = !hasPermission(permissions, [PERMISSIONS.workload.tasks.SHOW]);

  const task = await (own ? fetchMyTask : fetchTask)(uuid);
  if (!task) {
    notFound();
  }

  // what the task has already written. The live stream picks up from the last
  // of these, so nothing is shown twice and nothing is missed between the page
  // rendering and the stream opening.
  const logs = await (own ? fetchMyTaskLogs : fetchTaskLogs)(uuid).catch(
    () => ({items: []}),
  );

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("tasks.title"),
            href: APP_PATHS.dashboard.tasks.index,
          },
          {
            label: task.name,
            href: APP_PATHS.dashboard.tasks.detail(uuid),
          },
        ]}
      />

      <Group justify="space-between" py="md">
        <Title order={2}>{task.name}</Title>
        <StateBadge
          state={task.state}
          expectedState={task.expected_state}
          retries={task.retries}
          maxRetries={task.max_retries}
          deadline={task.deadline}
        />
      </Group>

      <TaskTabs
        hasTerminal={task.state === "running"}
        overview={
          <Paper withBorder p="md">
            <Stack gap="sm">
              {task.reason && (
                <Field label={t("tasks.detail.lastFailure")}>
                  <Text size="sm">{taskReasonLabel(t, task.reason)}</Text>
                </Field>
              )}
              <Field label={t("tasks.table.image")}>
                <Code>{task.image}</Code>
              </Field>
              <Field label={t("tasks.table.owner")}>
                <OwnerInline owner={task.owner} size={28} />
              </Field>
              <Field label={t("tasks.runtime.label")}>
                <RuntimeBadge runtime={task.runtime} />
              </Field>
              <Field label={t("tasks.runtime.node")}>
                {task.node ? (
                  <Code>{task.node}</Code>
                ) : (
                  <Text size="sm" c="dimmed">
                    {t("tasks.runtime.notPlaced")}
                  </Text>
                )}
              </Field>
              <Field label={t("tasks.form.readOnly")}>
                <Code>
                  {task.read_only
                    ? t("tasks.table.readOnlyOn")
                    : t("tasks.table.readOnlyOff")}
                </Code>
              </Field>
              <Field label={t("tasks.table.endpoints")}>
                <TaskEndpoints
                  endpoints={task.endpoints ?? []}
                  empty={t("tasks.table.noEndpoints")}
                />
              </Field>
              {task.command?.length > 0 && (
                <Field label={t("tasks.form.command")}>
                  <Code>{task.command.join(" ")}</Code>
                </Field>
              )}
              {task.environment?.length > 0 && (
                <Field label={t("tasks.form.environment")}>
                  <Code block>{task.environment.join("\n")}</Code>
                </Field>
              )}
            </Stack>
          </Paper>
        }
        logs={
          <PermissionGuard allowedPermissions={["workload.tasks.logs"]}>
            <TaskLogs taskUuid={uuid} history={logs.items ?? []} own={own} />
          </PermissionGuard>
        }
        terminal={
          <PermissionGuard allowedPermissions={["workload.tasks.attach"]}>
            <TaskTerminal taskUuid={uuid} running={task.state === "running"} />
          </PermissionGuard>
        }
      />
    </Box>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Box>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      {children}
    </Box>
  );
}

export default withPermissions(TaskPage, {
  requiredPermissions: ["workload.tasks.show", "self.workload.tasks.show"],
});
