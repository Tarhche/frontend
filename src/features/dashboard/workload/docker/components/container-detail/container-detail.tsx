"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {
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
import {TableSkeleton} from "@/components/skeletons";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {scopeFor} from "@/features/dashboard/workload/permissions";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {useVmChoices} from "@/features/dashboard/workload/vms/hooks/queries";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {shortId} from "../../format";
import {useContainer} from "../../hooks/use-containers";
import {dockerAbilities} from "../../permissions";
import {
  ContainerStateBadge,
  type ContainerTransition,
} from "../container-state-badge";
import {ContainerActions, containerName} from "../containers-table";
import {ContainerLogs} from "./container-logs";
import {ContainerNetworks} from "./container-networks";
import {ContainerOverview} from "./container-overview";
import {ContainerStatsPanel} from "./container-stats";

type Props = {
  /** The routes it is read through. */
  scope: Scope;
  vmUuid: string;
  id: string;

  /** What the person looking holds, and who they are. */
  permissions: string[];
  me: string | null;

  /** where the VM it is in is listed, for its name, its size and its owner. */
  vmSource: VmSource | null;
};

/**
 * One container, looked at through what it is, what it writes, what it uses
 * and what it is connected to. A tab that is not open is kept but not running,
 * as a VM's tabs are: its log is not followed and its usage is not sampled
 * behind the reader's back, and both carry on where they were when it is
 * opened again.
 */
export function ContainerDetail({
  scope,
  vmUuid,
  id,
  permissions,
  me,
  vmSource,
}: Props) {
  const {t} = useI18n();
  const router = useRouter();
  const query = useContainer(scope, vmUuid, id);
  const vms = useVmChoices(vmSource, {kind: "docker"});
  const [pending, setPending] = useState<ContainerTransition | undefined>();

  if (query.isPending) {
    return (
      <Stack>
        <Skeleton height={34} width={260} />
        <TableSkeleton
          rowsCount={4}
          columnsCount={4}
          tableProps={{verticalSpacing: "sm"}}
        />
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

  // a container is its VM's owner's: what may be done to it follows from that.
  const isOwner = scope === "mine" || (me !== null && vm?.owner_uuid === me);
  const may = dockerAbilities(permissions, isOwner);
  const stackUuid =
    container.stack_uuid && scopeFor(permissions, "stacks", "show", isOwner)
      ? container.stack_uuid
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
          vmUuid={vmUuid}
          container={container}
          manage={may.manage}
          remove={may.delete}
          onPending={setPending}
          onRemoved={() => router.push(APP_PATHS.dashboard.containers.index)}
        />
      </Group>

      {query.isError && (
        <StaleAlert
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTab value="overview" leftSection={<IconInfoCircle size={16} />}>
            {t("containers.detail.overview")}
          </TabsTab>
          {may.logs && (
            <TabsTab value="logs" leftSection={<IconFileText size={16} />}>
              {t("containers.detail.logs")}
            </TabsTab>
          )}
          {may.show && (
            <TabsTab value="stats" leftSection={<IconChartLine size={16} />}>
              {t("containers.detail.stats")}
            </TabsTab>
          )}
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
            <ContainerLogs scope={may.logs} vmUuid={vmUuid} id={container.id} />
          </TabsPanel>
        )}

        {may.show && (
          <TabsPanel value="stats" pt="md">
            <ContainerStatsPanel
              scope={may.show}
              vmUuid={vmUuid}
              id={container.id}
              running={container.state === "running"}
              vmCpus={vm?.resources?.cpus}
            />
          </TabsPanel>
        )}

        <TabsPanel value="networks" pt="md">
          <ContainerNetworks
            vmUuid={vmUuid}
            container={container}
            list={may.index}
            manage={may.manage}
          />
        </TabsPanel>
      </Tabs>
    </Stack>
  );
}
