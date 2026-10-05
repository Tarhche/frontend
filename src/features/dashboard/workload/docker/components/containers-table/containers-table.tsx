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
import {Owner} from "@/features/dashboard/workload/components/owner";
import {scopeFor} from "@/features/dashboard/workload/permissions";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {useVmChoices} from "@/features/dashboard/workload/vms/hooks/queries";
import {vmReadiness} from "@/features/dashboard/workload/vms/lib/state";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {shortId} from "../../format";
import {useContainers} from "../../hooks/use-containers";
import {dockerAbilities, type DockerAbilities} from "../../permissions";
import {type Container} from "../../types";
import {
  ContainerStateBadge,
  type ContainerTransition,
} from "../container-state-badge";
import {ContainerActions, containerName} from "./container-actions";
import {ContainerPorts} from "./container-ports";

type RowProps = {
  container: Container;
  vmUuid: string;
  vmName: string;

  /** what may be done to it, and through which routes. */
  may: DockerAbilities;

  /** where the stack it belongs to is shown, when it belongs to one. */
  stackHref?: string;

  /** whose it is, in a listing of everybody's. */
  owner?: {vm?: Vm; me: string | null};
};

function ContainerRow({
  container,
  vmUuid,
  vmName,
  may,
  stackHref,
  owner,
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
      {owner && (
        <TableTd>
          <Owner of={owner.vm ?? {}} me={owner.me} />
        </TableTd>
      )}
      <TableTd>
        <ContainerActions
          vmUuid={vmUuid}
          container={container}
          manage={may.manage}
          remove={may.delete}
          onPending={setPending}
        />
      </TableTd>
    </TableTr>
  );
}

type Props = {
  scope: Scope;

  /** what the person looking holds, and who they are, for each row. */
  permissions: string[];
  me: string | null;
  canCreate: boolean;

  /** where the Docker VMs to filter by are listed, if they may be. */
  vmSource: VmSource | null;
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
  permissions,
  me,
  canCreate,
  vmSource,
}: Props) {
  const {t} = useI18n();
  const [vm, setVm] = useState<string | null>(null);

  const containers = useContainers(scope, vm ?? undefined);
  const vms = useVmChoices(vmSource, {kind: "docker"});

  const vmByUuid = new Map((vms.data ?? []).map((each) => [each.uuid, each]));

  // in somebody's own listing every row is theirs, so saying so on each one
  // says nothing.
  const showOwner = scope === "all";
  const columns = showOwner ? 9 : 8;
  const notRunning = (vms.data ?? []).filter(
    (each) =>
      vmReadiness(each.state) !== "running" &&
      (vm === null || each.uuid === vm),
  );

  const items = containers.data ?? [];

  // a container is its VM's owner's, and what may be done to it, and whether
  // the stack that deployed it may be looked at, follows from that.
  const isOwner = (container: Container) =>
    scope === "mine" ||
    (me !== null && vmByUuid.get(container.vm_uuid ?? "")?.owner_uuid === me);

  const stackHref = (container: Container) =>
    container.stack_uuid &&
    scopeFor(permissions, "stacks", "show", isOwner(container))
      ? APP_PATHS.dashboard.stacks.detail(container.stack_uuid)
      : undefined;

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
        <TableSkeleton
          columnsCount={columns}
          tableProps={{verticalSpacing: "sm"}}
        />
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
                {showOwner && <TableTh>{t("containers.table.owner")}</TableTh>}
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {items.length === 0 && (
                <TableTr>
                  <TableTd colSpan={columns} ta="center">
                    {t("containers.table.empty")}
                  </TableTd>
                </TableTr>
              )}
              {items.map((container) => {
                const vmUuid = container.vm_uuid ?? vm ?? "";
                const inVm = vmByUuid.get(vmUuid);

                return (
                  <ContainerRow
                    key={`${vmUuid}/${container.id}`}
                    container={container}
                    vmUuid={vmUuid}
                    vmName={container.vm_name ?? inVm?.name ?? shortId(vmUuid)}
                    may={dockerAbilities(permissions, isOwner(container))}
                    stackHref={stackHref(container)}
                    owner={showOwner ? {vm: inVm, me} : undefined}
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
