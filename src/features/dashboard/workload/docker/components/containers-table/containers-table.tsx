"use client";

import {useState} from "react";
import {
  Button,
  Group,
  Select,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import {IconFilter, IconPlus} from "@tabler/icons-react";
import {TableSkeleton} from "@/components/skeletons";
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
import {vmReadiness} from "@/features/dashboard/workload/vms/lib/state";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {shortId} from "../../format";
import {useContainers} from "../../hooks/use-containers";
import {type DockerMay} from "../../permissions";
import {type Container} from "../../types";
import {
  ContainerStateBadge,
  type ContainerTransition,
} from "../container-state-badge";
import {ContainerActions, containerName} from "./container-actions";
import {ContainerPorts} from "./container-ports";

type RowProps = {
  scope: Scope;
  container: Container;
  vmUuid: string;
  vmName: string;
  may: DockerMay;

  /** where the stack it belongs to is shown, when it belongs to one. */
  stackHref?: string;
};

function ContainerRow({
  scope,
  container,
  vmUuid,
  vmName,
  may,
  stackHref,
}: RowProps) {
  const {t} = useI18n();

  // what somebody has just asked of it, shown until docker says otherwise.
  const [pending, setPending] = useState<ContainerTransition | undefined>();

  return (
    <TableTr>
      <TableTd>
        <Link
          href={APP_PATHS.dashboard.containers.detail(vmUuid, container.id)}
        >
          {containerName(container)}
        </Link>
        <Text size="xs" c="dimmed" ff="monospace">
          {shortId(container.id)}
        </Text>
      </TableTd>
      <TableTd>
        <Text size="sm" ff="monospace" dir="ltr">
          {container.image}
        </Text>
      </TableTd>
      <TableTd>
        <ContainerStateBadge
          state={container.state}
          status={container.status}
          pending={pending}
        />
      </TableTd>
      <TableTd>
        <Text size="sm">{container.status}</Text>
      </TableTd>
      <TableTd>
        <ContainerPorts ports={container.ports} />
      </TableTd>
      <TableTd>
        <Text size="sm">{vmName}</Text>
      </TableTd>
      <TableTd>
        {container.stack ? (
          <>
            {stackHref ? (
              <Link href={stackHref}>{container.stack}</Link>
            ) : (
              <Text size="sm">{container.stack}</Text>
            )}
            {container.service && (
              <Text size="xs" c="dimmed">
                {t("containers.table.service", {service: container.service})}
              </Text>
            )}
          </>
        ) : (
          <Text size="sm" c="dimmed">
            —
          </Text>
        )}
      </TableTd>
      <TableTd>
        <ContainerActions
          scope={scope}
          vmUuid={vmUuid}
          container={container}
          may={may}
          onPending={setPending}
        />
      </TableTd>
    </TableTr>
  );
}

type Props = {
  scope: Scope;
  may: DockerMay;
  canCreate: boolean;

  /** where the Docker VMs to filter by are listed, if they may be. */
  vmSource: VmSource | null;

  /** whether the stacks in this scope may be listed, to link to them. */
  stacksVisible?: boolean;
};

/**
 * The containers across every running Docker VM in a scope, wherever each one
 * is. Nothing says when one changes, so the listing is asked for again every
 * few seconds while it is on the screen.
 *
 * A VM that is not running has no dockerd to ask, so its containers are not in
 * the listing; which VMs those are is said above it, so that a container that
 * seems to be missing is not taken for gone.
 */
export function ContainersTable({
  scope,
  may,
  canCreate,
  vmSource,
  stacksVisible = false,
}: Props) {
  const {t} = useI18n();
  const [vm, setVm] = useState<string | null>(null);

  const containers = useContainers(scope, vm ?? undefined);
  const vms = useVmChoices(vmSource, {kind: "docker"});

  const vmNames = new Map(
    (vms.data ?? []).map((each) => [each.uuid, each.name]),
  );
  const notRunning = (vms.data ?? []).filter(
    (each) =>
      vmReadiness(each.state) !== "running" &&
      (vm === null || each.uuid === vm),
  );

  const items = containers.data ?? [];

  // a container says which compose project it came from; which stack that is
  // takes the stacks, read only when there is a container to link.
  const links = useStackLinks(
    scope,
    stacksVisible && items.some((container) => Boolean(container.stack)),
  );
  const stackHref = (vmUuid: string, container: Container) => {
    const uuid = container.stack
      ? links.data?.[stackLinkKey(vmUuid, container.stack)]
      : undefined;

    return uuid ? APP_PATHS.dashboard.stacks.detail(uuid) : undefined;
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        {vms.data && vms.data.length > 0 ? (
          <Select
            label={t("containers.table.vmFilter")}
            placeholder={t("containers.table.allVms")}
            data={vms.data.map((each) => ({
              value: each.uuid,
              label: each.name,
            }))}
            value={vm}
            onChange={setVm}
            clearable
            searchable={vms.data.length > 7}
            leftSection={<IconFilter size={16} />}
            w={280}
          />
        ) : (
          <span />
        )}
        {canCreate && (
          <Button
            variant="light"
            component={Link}
            href={APP_PATHS.dashboard.containers.new}
            leftSection={<IconPlus />}
          >
            {t("containers.table.newContainer")}
          </Button>
        )}
      </Group>

      {notRunning.length > 0 && (
        <Text size="sm" c="dimmed">
          {t("containers.table.vmsNotRunning", {
            names: notRunning.map((each) => each.name).join(", "),
          })}
        </Text>
      )}

      {containers.isError && containers.data && (
        <StaleAlert
          error={containers.error}
          onRetry={() => void containers.refetch()}
          retrying={containers.isFetching}
        />
      )}

      {containers.isPending ? (
        <TableSkeleton columnsCount={8} tableProps={{verticalSpacing: "sm"}} />
      ) : containers.isError && !containers.data ? (
        <ProblemAlert
          problem={problemOf(containers.error)}
          title={t("containers.table.listFailed")}
          onRetry={() => void containers.refetch()}
          retrying={containers.isFetching}
        />
      ) : (
        <TableScrollContainer minWidth={960}>
          <Table verticalSpacing="sm" striped withRowBorders>
            <TableThead>
              <TableTr>
                <TableTh>{t("containers.table.name")}</TableTh>
                <TableTh>{t("containers.table.image")}</TableTh>
                <TableTh>{t("containers.table.state")}</TableTh>
                <TableTh>{t("containers.table.status")}</TableTh>
                <TableTh>{t("containers.table.ports")}</TableTh>
                <TableTh>{t("containers.table.vm")}</TableTh>
                <TableTh>{t("containers.table.stack")}</TableTh>
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {items.length === 0 && (
                <TableTr>
                  <TableTd colSpan={8} ta="center">
                    {t("containers.table.empty")}
                  </TableTd>
                </TableTr>
              )}
              {items.map((container) => {
                const vmUuid = container.vm_uuid ?? vm ?? "";

                return (
                  <ContainerRow
                    key={`${vmUuid}/${container.id}`}
                    scope={scope}
                    container={container}
                    vmUuid={vmUuid}
                    vmName={
                      container.vm_name ??
                      vmNames.get(vmUuid) ??
                      shortId(vmUuid)
                    }
                    may={may}
                    stackHref={stackHref(vmUuid, container)}
                  />
                );
              })}
            </TableTbody>
          </Table>
        </TableScrollContainer>
      )}
    </Stack>
  );
}
