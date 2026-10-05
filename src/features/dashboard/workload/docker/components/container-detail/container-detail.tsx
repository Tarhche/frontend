"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {
  Alert,
  Button,
  EmptyState,
  Group,
  Skeleton,
  Stack,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBox,
  IconChartLine,
  IconFileText,
  IconInfoCircle,
  IconNetwork,
} from "@tabler/icons-react";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {
  stackLinkKey,
  useStackLinks,
} from "@/features/dashboard/workload/stacks/hooks/use-stacks";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {useVmChoices} from "@/features/dashboard/workload/vms/hooks/queries";
import {problemMessage, problemOf} from "../../errors";
import {shortId} from "../../format";
import {useContainer} from "../../hooks/use-containers";
import {type DockerMay} from "../../permissions";
import {
  ContainerStateBadge,
  type ContainerTransition,
} from "../container-state-badge";
import {ContainerActions, containerName} from "../containers-table";
import {ProblemAlert} from "../problem-alert";
import {TableSkeleton} from "../table-skeleton";
import {ContainerLogs} from "./container-logs";
import {ContainerNetworks} from "./container-networks";
import {ContainerOverview} from "./container-overview";
import {ContainerStatsPanel} from "./container-stats";

type Props = {
  scope: Scope;
  vmUuid: string;
  id: string;
  may: DockerMay;

  /** where the VM it is in is listed, for its name and its size. */
  vmSource: VmSource | null;

  /** whether the stacks in this scope may be listed, to link to its own. */
  stacksVisible?: boolean;
};

/**
 * One container, looked at through what it is, what it writes, what it uses
 * and what it is connected to. A tab that is not open is not running, so its
 * log is not followed and its usage is not sampled behind the reader's back.
 */
export function ContainerDetail({
  scope,
  vmUuid,
  id,
  may,
  vmSource,
  stacksVisible = false,
}: Props) {
  const {t} = useI18n();
  const router = useRouter();
  const query = useContainer(scope, vmUuid, id);
  const vms = useVmChoices(vmSource, {kind: "docker"});
  const [pending, setPending] = useState<ContainerTransition | undefined>();
  const links = useStackLinks(
    scope,
    stacksVisible && Boolean(query.data?.stack),
  );

  if (query.isPending) {
    return (
      <Stack>
        <Skeleton height={34} width={260} />
        <TableSkeleton rows={4} />
      </Stack>
    );
  }

  if (!query.data) {
    const problem = problemOf(query.error);

    if (problem.status === 404 || problem.code === "not_found") {
      return (
        <EmptyState
          icon={<IconBox />}
          withIndicatorBackground
          title={t("containers.detail.goneTitle")}
          description={t("containers.detail.gone")}
        >
          <Group justify="center" mt="md">
            <Button
              component={Link}
              href={APP_PATHS.dashboard.containers.index}
              variant="light"
            >
              {t("containers.detail.backToList")}
            </Button>
          </Group>
        </EmptyState>
      );
    }

    return (
      <ProblemAlert
        problem={problem}
        title={t("containers.detail.failed")}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const container = query.data;
  const vm = vms.data?.find((each) => each.uuid === vmUuid);
  const vmName = vm?.name ?? container.vm_name ?? shortId(vmUuid);
  const stackUuid = container.stack
    ? links.data?.[stackLinkKey(vmUuid, container.stack)]
    : undefined;

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group gap="sm">
            <Title order={2}>{containerName(container)}</Title>
            <ContainerStateBadge
              state={container.state}
              status={container.status}
              pending={pending}
            />
          </Group>
          <Text size="sm" c="dimmed">
            {container.status
              ? `${container.status} · ${t("containers.detail.inVm", {vm: vmName})}`
              : t("containers.detail.inVm", {vm: vmName})}
          </Text>
        </Stack>
        <ContainerActions
          scope={scope}
          vmUuid={vmUuid}
          container={container}
          may={may}
          onPending={setPending}
          onRemoved={() => router.push(APP_PATHS.dashboard.containers.index)}
        />
      </Group>

      {query.isError && (
        <Alert color="yellow" variant="light" role="status">
          {t("containers.detail.refreshFailed", {
            reason: problemMessage(problemOf(query.error), t),
          })}
        </Alert>
      )}

      <Tabs defaultValue="overview" keepMounted={false}>
        <TabsList>
          <TabsTab value="overview" leftSection={<IconInfoCircle size={16} />}>
            {t("containers.detail.overview")}
          </TabsTab>
          {may.logs && (
            <TabsTab value="logs" leftSection={<IconFileText size={16} />}>
              {t("containers.detail.logs")}
            </TabsTab>
          )}
          <TabsTab value="stats" leftSection={<IconChartLine size={16} />}>
            {t("containers.detail.stats")}
          </TabsTab>
          <TabsTab value="networks" leftSection={<IconNetwork size={16} />}>
            {t("containers.detail.networks")}
          </TabsTab>
        </TabsList>

        <TabsPanel value="overview" pt="md">
          <ContainerOverview
            container={container}
            vmName={vmName}
            stackHref={
              stackUuid
                ? APP_PATHS.dashboard.stacks.detail(stackUuid)
                : undefined
            }
          />
        </TabsPanel>

        {may.logs && (
          <TabsPanel value="logs" pt="md">
            <ContainerLogs scope={scope} vmUuid={vmUuid} id={container.id} />
          </TabsPanel>
        )}

        <TabsPanel value="stats" pt="md">
          <ContainerStatsPanel
            scope={scope}
            vmUuid={vmUuid}
            id={container.id}
            running={container.state === "running"}
            vmCpus={vm?.resources?.cpus}
          />
        </TabsPanel>

        <TabsPanel value="networks" pt="md">
          <ContainerNetworks
            scope={scope}
            vmUuid={vmUuid}
            container={container}
            may={may}
          />
        </TabsPanel>
      </Tabs>
    </Stack>
  );
}
