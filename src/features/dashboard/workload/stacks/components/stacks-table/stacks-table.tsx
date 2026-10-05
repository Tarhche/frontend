"use client";

import {useState} from "react";
import {
  Button,
  Group,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Tooltip,
} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import {TableSkeleton} from "@/components/skeletons";
import Link from "@/components/link";
import {Pagination} from "@/components/pagination";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {VmStateBadge} from "@/features/dashboard/workload/vms/components/vm-state-badge";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {shortId} from "@/features/dashboard/workload/docker/format";
import {useContainers} from "@/features/dashboard/workload/docker/hooks/use-containers";
import {useVmChoices} from "@/features/dashboard/workload/vms/hooks/queries";
import {type Container} from "@/features/dashboard/workload/docker/types";
import {vmReadiness} from "@/features/dashboard/workload/vms/lib/state";
import {Owner} from "@/features/dashboard/workload/components/owner";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {formatDateTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {formatNumber} from "@/features/dashboard/workload/vms/lib/units";
import {useStacks} from "../../hooks/use-stacks";
import {stackAbilities, type StackAbilities} from "../../permissions";
import {type Stack as StackRecord} from "../../types";
import {StackActions} from "../stack-actions";
import {StackStateBadge, type StackTransition} from "../stack-state-badge";

/**
 * How many containers each stack has. A container says which stack deployed
 * it when the API could tell, and which compose project it came from in which
 * VM always, which is the stack's slug: it is counted under the first, or the
 * second when that is all there is.
 */
export function countContainers(containers: Container[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const container of containers) {
    const key =
      container.stack_uuid ??
      (container.stack && container.vm_uuid
        ? `${container.vm_uuid}/${container.stack}`
        : undefined);

    if (key) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}

/** The containers counted for a stack, by its uuid or by its VM and slug. */
export function containersOf(
  counts: Map<string, number>,
  stack: Pick<StackRecord, "uuid" | "vm_uuid" | "slug">,
): number {
  return (
    (counts.get(stack.uuid) ?? 0) +
    (counts.get(`${stack.vm_uuid}/${stack.slug}`) ?? 0)
  );
}

type RowProps = {
  stack: StackRecord;
  vm?: Vm;
  containers: string;

  /** what may be done to it, and through which routes. */
  may: StackAbilities;

  /** who is looking, when whose each stack is is worth a column. */
  owner?: {me: string | null};
};

function StackRow({stack, vm, containers, may, owner}: RowProps) {
  const {locale} = useI18n();

  // what somebody has just asked of it, shown until its VM starts on it.
  const [pending, setPending] = useState<StackTransition | undefined>();

  const vmName = vm?.name ?? stack.vm_name ?? shortId(stack.vm_uuid);

  return (
    <TableTr>
      <TableTd>
        <Link href={APP_PATHS.dashboard.stacks.detail(stack.uuid)}>
          {stack.name}
        </Link>
      </TableTd>
      <TableTd>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm">{vmName}</Text>
          {vm && vmReadiness(vm.state) !== "running" && (
            <VmStateBadge state={vm.state} expectedState={vm.expected_state} />
          )}
        </Group>
      </TableTd>
      <TableTd>
        <StackStateBadge state={stack.state} pending={pending} />
      </TableTd>
      <TableTd>
        <Text size="sm">{containers}</Text>
      </TableTd>
      <TableTd>
        <Text size="sm">{formatDateTime(stack.created_at, locale)}</Text>
      </TableTd>
      {owner && (
        <TableTd>
          <Owner of={stack} me={owner.me} />
        </TableTd>
      )}
      <TableTd>
        <StackActions
          stack={stack}
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
  page: number;

  /** what the person looking holds, and who they are, for each row. */
  permissions: string[];
  me: string | null;
  canCreate: boolean;

  /** where the Docker VMs the stacks are in are listed, if they may be. */
  vmSource: VmSource | null;

  /** whether the containers in this scope may be listed, to count them. */
  containersVisible: boolean;
};

/**
 * A scope's stacks, a page at a time. A stack whose compose command is still
 * running in its VM is looked at again every few seconds until it is done.
 */
export function StacksTable({
  scope,
  page,
  permissions,
  me,
  canCreate,
  vmSource,
  containersVisible,
}: Props) {
  const {t, locale} = useI18n();
  const stacks = useStacks(scope, page);
  const vms = useVmChoices(vmSource, {kind: "docker"});
  const containers = useContainers(scope, undefined, {
    enabled: containersVisible,
  });

  const vmByUuid = new Map((vms.data ?? []).map((vm) => [vm.uuid, vm]));
  const counts = countContainers(containers.data ?? []);

  // a VM that is not running has no containers to list, which is not the same
  // as a stack that has none.
  const containerCount = (stack: StackRecord): string => {
    const vm = vmByUuid.get(stack.vm_uuid);
    if (!containers.data || (vm && vmReadiness(vm.state) !== "running")) {
      return "—";
    }

    return formatNumber(containersOf(counts, stack), locale);
  };

  const items = stacks.data?.items ?? [];
  const pagination = stacks.data?.pagination;

  // in somebody's own listing every row is theirs, so saying so on each one
  // says nothing.
  const showOwner = scope === "all";
  const columns = showOwner ? 7 : 6;

  return (
    <Stack gap="md">
      {canCreate && (
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            href={APP_PATHS.dashboard.stacks.new}
            leftSection={<IconPlus />}
          >
            {t("stacks.table.newStack")}
          </Button>
        </Group>
      )}

      {stacks.isError && stacks.data && (
        <StaleAlert
          error={stacks.error}
          onRetry={() => void stacks.refetch()}
          retrying={stacks.isFetching}
        />
      )}

      {stacks.isPending ? (
        <TableSkeleton
          columnsCount={columns}
          tableProps={{verticalSpacing: "sm"}}
        />
      ) : stacks.isError && !stacks.data ? (
        <ProblemAlert
          problem={problemOf(stacks.error)}
          title={t("stacks.table.listFailed")}
          onRetry={() => void stacks.refetch()}
          retrying={stacks.isFetching}
        />
      ) : (
        <TableScrollContainer minWidth={760}>
          <Table verticalSpacing="sm" striped withRowBorders>
            <TableThead>
              <TableTr>
                <TableTh>{t("stacks.table.name")}</TableTh>
                <TableTh>{t("stacks.table.vm")}</TableTh>
                <TableTh>{t("stacks.table.state")}</TableTh>
                <TableTh>
                  <Tooltip
                    label={t("stacks.table.containersHelp")}
                    withArrow
                    multiline
                    w={260}
                  >
                    <span>{t("stacks.table.containers")}</span>
                  </Tooltip>
                </TableTh>
                <TableTh>{t("stacks.table.createdAt")}</TableTh>
                {showOwner && <TableTh>{t("stacks.table.owner")}</TableTh>}
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {items.length === 0 && (
                <TableTr>
                  <TableTd colSpan={columns} ta="center">
                    {t("stacks.table.empty")}
                  </TableTd>
                </TableTr>
              )}
              {items.map((stack) => (
                <StackRow
                  key={stack.uuid}
                  stack={stack}
                  vm={vmByUuid.get(stack.vm_uuid)}
                  containers={containerCount(stack)}
                  may={stackAbilities(
                    permissions,
                    scope === "mine" ||
                      (me !== null && stack.owner_uuid === me),
                  )}
                  owner={showOwner ? {me} : undefined}
                />
              ))}
            </TableTbody>
          </Table>
        </TableScrollContainer>
      )}

      {pagination && pagination.total_pages > 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <Pagination
            total={pagination.total_pages}
            current={pagination.current_page}
          />
        </Group>
      )}
    </Stack>
  );
}
