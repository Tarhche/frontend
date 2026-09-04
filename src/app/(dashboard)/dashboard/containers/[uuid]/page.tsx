import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Box, Code, Group, Paper, Stack, Text, Title} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {PermissionGuard} from "@/components/permission-guard";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchContainer, fetchContainerLogs} from "@/dal/private/runner";
import {OwnerInline} from "@/features/dashboard/runner/components/owner-inline";
import {StateBadge} from "@/features/dashboard/runner/components/state-badge";
import {ContainerEndpoints} from "@/features/dashboard/runner/components/containers-table/container-endpoints";
import {ContainerLogs} from "@/features/dashboard/runner/components/container-logs";
import {ContainerTerminal} from "@/features/dashboard/runner/components/container-terminal";
import {ContainerTabs} from "@/features/dashboard/runner/components/container-tabs";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("containers.breadcrumb.detail"),
  };
}

type Props = {
  params: Promise<{uuid: string}>;
};

async function ContainerPage({params}: Props) {
  const {t} = await getServerDictionary();
  const {uuid} = await params;

  const container = await fetchContainer(uuid);
  if (!container) {
    notFound();
  }

  // what the container has already written. The live stream picks up from the
  // last of these, so nothing is shown twice and nothing is missed between the
  // page rendering and the stream opening.
  const logs = await fetchContainerLogs(uuid).catch(() => ({items: []}));

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("containers.title"),
            href: APP_PATHS.dashboard.containers.index,
          },
          {
            label: container.name,
            href: APP_PATHS.dashboard.containers.detail(uuid),
          },
        ]}
      />

      <Group justify="space-between" py="md">
        <Title order={2}>{container.name}</Title>
        <StateBadge
          state={container.state}
          expectedState={container.expected_state}
          retries={container.retries}
          maxRetries={container.max_retries}
        />
      </Group>

      <ContainerTabs
        hasTerminal={container.state === "running"}
        overview={
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Field label={t("containers.table.image")}>
                <Code>{container.image}</Code>
              </Field>
              <Field label={t("containers.table.owner")}>
                <OwnerInline owner={container.owner} size={28} />
              </Field>
              <Field label={t("containers.form.readOnly")}>
                <Code>
                  {container.read_only
                    ? t("containers.table.readOnlyOn")
                    : t("containers.table.readOnlyOff")}
                </Code>
              </Field>
              <Field label={t("containers.table.endpoints")}>
                <ContainerEndpoints
                  endpoints={container.endpoints ?? []}
                  empty={t("containers.table.noEndpoints")}
                />
              </Field>
              {container.command?.length > 0 && (
                <Field label={t("containers.form.command")}>
                  <Code>{container.command.join(" ")}</Code>
                </Field>
              )}
              {container.environment?.length > 0 && (
                <Field label={t("containers.form.environment")}>
                  <Code block>{container.environment.join("\n")}</Code>
                </Field>
              )}
            </Stack>
          </Paper>
        }
        logs={
          <PermissionGuard allowedPermissions={["runner.containers.logs"]}>
            <ContainerLogs containerUuid={uuid} history={logs.items ?? []} />
          </PermissionGuard>
        }
        terminal={
          <PermissionGuard allowedPermissions={["runner.containers.attach"]}>
            <ContainerTerminal
              containerUuid={uuid}
              running={container.state === "running"}
            />
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

export default withPermissions(ContainerPage, {
  requiredPermissions: ["runner.containers.show"],
});
