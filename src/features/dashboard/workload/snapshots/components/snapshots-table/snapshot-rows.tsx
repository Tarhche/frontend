"use client";

import {TableTbody, TableTd, TableTr, Text, Tooltip} from "@mantine/core";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {VmKindBadge} from "@/features/dashboard/workload/vms/components/vm-kind-badge";
import {VmOwner} from "@/features/dashboard/workload/vms/components/vm-owner";
import {formatDateTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {formatBytes} from "@/features/dashboard/workload/vms/lib/units";
import {
  canCreateVms,
  vmScope,
  vmSource,
} from "@/features/dashboard/workload/vms/permissions";
import {type Page} from "@/features/dashboard/workload/vms/types";
import {useSnapshots} from "../../hooks/queries";
import {snapshotScope} from "../../permissions";
import {type Snapshot} from "../../types";
import {SnapshotActions} from "../snapshot-actions";
import {SnapshotStateBadge} from "../snapshot-state-badge";

type Props = {
  scope: Scope;
  page: number | string;
  initial: Page<Snapshot>;
  permissions: string[];
  me: string | null;
  showOwner: boolean;
};

/**
 * The rows of the snapshots table, kept current while any snapshot is being
 * taken or deleted.
 */
export function SnapshotRows({
  scope,
  page,
  initial,
  permissions,
  me,
  showOwner,
}: Props) {
  const {t, locale} = useI18n();
  const {data} = useSnapshots({scope, params: {page}, initialData: initial});
  const snapshots = data?.items ?? [];

  // restoring is onto one's own VMs alone, of the same kind: they are listed
  // through one's own routes when that is allowed, through the workload's
  // narrowed to one's own otherwise.
  const restoreScope = vmScope(permissions, "manage", true);
  const ownVms = vmSource(permissions, "mine", me);
  const mayCreate = canCreateVms(permissions);

  return (
    <TableTbody>
      {snapshots.length === 0 && (
        <TableTr>
          <TableTd colSpan={showOwner ? 8 : 7} ta="center">
            {t("snapshots.table.empty")}
          </TableTd>
        </TableTr>
      )}
      {snapshots.map((snapshot) => {
        const own = snapshot.owner_uuid === me;

        return (
          <TableTr key={snapshot.uuid}>
            <TableTd>
              <Text size="sm" fw={500}>
                {snapshot.name}
              </Text>
            </TableTd>
            <TableTd>
              <Link href={APP_PATHS.dashboard.vms.detail(snapshot.vm_uuid)}>
                {snapshot.vm_name || snapshot.vm_uuid.slice(0, 8)}
              </Link>
            </TableTd>
            <TableTd>
              <VmKindBadge kind={snapshot.kind} />
            </TableTd>
            <TableTd>
              <Tooltip
                label={t("snapshots.table.diskTooltip", {
                  size: formatBytes(snapshot.disk, locale),
                })}
                withArrow
              >
                <Text size="sm" component="span">
                  {snapshot.state === "ready"
                    ? formatBytes(snapshot.size, locale)
                    : "—"}
                </Text>
              </Tooltip>
            </TableTd>
            <TableTd>
              <SnapshotStateBadge snapshot={snapshot} />
            </TableTd>
            <TableTd>
              <Text size="sm">
                {formatDateTime(snapshot.created_at, locale)}
              </Text>
            </TableTd>
            {showOwner && (
              <TableTd>
                <VmOwner vm={snapshot} me={me} />
              </TableTd>
            )}
            <TableTd>
              <SnapshotActions
                snapshot={snapshot}
                rename={snapshotScope(permissions, "update", own)}
                remove={snapshotScope(permissions, "delete", own)}
                restoreAsNew={own && mayCreate}
                restore={
                  own && restoreScope && ownVms
                    ? {scope: restoreScope, choose: ownVms}
                    : null
                }
              />
            </TableTd>
          </TableTr>
        );
      })}
    </TableTbody>
  );
}
