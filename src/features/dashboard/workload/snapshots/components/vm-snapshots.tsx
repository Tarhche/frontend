"use client";

import {
  Box,
  Group,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import {useI18n} from "@/i18n/provider";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {formatDateTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {formatBytes} from "@/features/dashboard/workload/vms/lib/units";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {useSnapshots} from "../hooks/queries";
import {snapshotScope} from "../permissions";
import {SnapshotActions} from "./snapshot-actions";
import {SnapshotStateBadge} from "./snapshot-state-badge";
import {TakeSnapshotButton} from "./take-snapshot-button";

type Props = {
  vm: Vm;

  /** How this VM's snapshots are listed. */
  scope: Scope;
  permissions: string[];
  me: string | null;

  /** Whether a snapshot may be taken of it, which only its owner can. */
  canTake: boolean;

  /** The routes a restore onto it is asked through, if it may be. */
  restore: Scope | null;
};

/**
 * The snapshots taken of one VM, a way to take another, and to put one back:
 * restoring onto this VM replaces its disk, which is asked about first.
 */
export function VmSnapshots({
  vm,
  scope,
  permissions,
  me,
  canTake,
  restore,
}: Props) {
  const {t, locale} = useI18n();
  const {data, isLoading, isError, error, refetch, isFetching} = useSnapshots({
    scope,
    params: {vm: vm.uuid},
  });
  const snapshots = data?.items ?? [];
  const retry = () => void refetch();

  return (
    <>
      <Group justify="space-between" mb="sm">
        <Text size="sm" c="dimmed">
          {t("snapshots.vm.help")}
        </Text>
        {canTake && <TakeSnapshotButton vm={vm} />}
      </Group>

      {isError && data !== undefined && (
        <Box mb="sm">
          <StaleAlert error={error} onRetry={retry} retrying={isFetching} />
        </Box>
      )}

      {isError && data === undefined ? (
        <ProblemAlert
          problem={problemOf(error)}
          title={t("snapshots.vm.failed")}
          onRetry={retry}
          retrying={isFetching}
        />
      ) : (
        <TableScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" striped withRowBorders>
            <TableThead>
              <TableTr>
                <TableTh>{t("snapshots.table.name")}</TableTh>
                <TableTh>{t("snapshots.table.state")}</TableTh>
                <TableTh>{t("snapshots.table.size")}</TableTh>
                <TableTh>{t("snapshots.table.createdAt")}</TableTh>
                <TableTh>{t("common.actions")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {snapshots.length === 0 && (
                <TableTr>
                  <TableTd colSpan={5} ta="center">
                    {isLoading ? t("common.loading") : t("snapshots.vm.empty")}
                  </TableTd>
                </TableTr>
              )}
              {snapshots.map((snapshot) => {
                const own = snapshot.owner_uuid === me;

                // a snapshot is restored only onto a VM of the same owner.
                const restorable =
                  restore !== null && snapshot.owner_uuid === vm.owner_uuid;

                return (
                  <TableTr key={snapshot.uuid}>
                    <TableTd>
                      <Text size="sm" fw={500}>
                        {snapshot.name}
                      </Text>
                    </TableTd>
                    <TableTd>
                      <SnapshotStateBadge snapshot={snapshot} />
                    </TableTd>
                    <TableTd>
                      <Text size="sm">
                        {snapshot.state === "ready"
                          ? formatBytes(snapshot.size, locale)
                          : "—"}
                      </Text>
                    </TableTd>
                    <TableTd>
                      <Text size="sm">
                        {formatDateTime(snapshot.created_at, locale)}
                      </Text>
                    </TableTd>
                    <TableTd>
                      <SnapshotActions
                        snapshot={snapshot}
                        rename={snapshotScope(permissions, "update", own)}
                        remove={snapshotScope(permissions, "delete", own)}
                        restore={
                          restorable && restore ? {scope: restore, vm} : null
                        }
                      />
                    </TableTd>
                  </TableTr>
                );
              })}
            </TableTbody>
          </Table>
        </TableScrollContainer>
      )}
    </>
  );
}
