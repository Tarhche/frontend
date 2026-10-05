"use client";

import {useCallback, useState} from "react";
import {TableTbody, TableTd, TableTr, Text} from "@mantine/core";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {
  StateBadge,
  type Transition,
} from "@/features/dashboard/workload/components/state-badge";
import {type Scope} from "../../api";
import {useVms} from "../../hooks/queries";
import {formatBytes, formatNumber} from "../../lib/units";
import {vmAbilities} from "../../permissions";
import {type Page, type Vm} from "../../types";
import {VmActions} from "../vm-actions";
import {VmExpiry} from "../vm-expiry";
import {VmKindBadge} from "../vm-kind-badge";
import {VmOwner} from "../vm-owner";

type Props = {
  scope: Scope;
  page: number | string;

  /** The page as the server rendered it, read again from here on. */
  initial: Page<Vm>;

  /** What the person looking may do, and who they are, for each row's actions. */
  permissions: string[];
  me: string | null;

  /** Whether whose each VM is is worth a column: not in one's own listing. */
  showOwner: boolean;
};

/**
 * The rows of the VMs table, kept current. A VM starts, stops and is deleted
 * in the workload's own time, so the page reads them again while it is open:
 * often while any of them is on its way somewhere, now and then otherwise.
 */
export function VmRows({
  scope,
  page,
  initial,
  permissions,
  me,
  showOwner,
}: Props) {
  const {t, locale} = useI18n();
  const {data} = useVms({scope, params: {page}, initialData: initial});
  const vms = data?.items ?? [];

  // what somebody has just asked of a VM, until the workload says so itself.
  const [asked, setAsked] = useState<Record<string, Transition>>({});
  const markAsked = useCallback(
    (uuid: string, underway: Transition | undefined) => {
      setAsked((current) => {
        if (current[uuid] === underway) {
          return current;
        }

        const next = {...current};
        if (underway) {
          next[uuid] = underway;
        } else {
          delete next[uuid];
        }

        return next;
      });
    },
    [],
  );

  const columns = showOwner ? 9 : 8;

  return (
    <TableTbody>
      {vms.length === 0 && (
        <TableTr>
          <TableTd colSpan={columns} ta="center">
            {t("vms.table.empty")}
          </TableTd>
        </TableTr>
      )}
      {vms.map((vm) => {
        const may = vmAbilities(permissions, vm.owner_uuid === me);

        return (
          <TableTr key={vm.uuid}>
            <TableTd>
              <Link href={APP_PATHS.dashboard.vms.detail(vm.uuid)}>
                {vm.name}
              </Link>
            </TableTd>
            <TableTd>
              <VmKindBadge kind={vm.kind} />
            </TableTd>
            <TableTd>
              <StateBadge
                state={vm.state}
                expectedState={vm.expected_state}
                pending={asked[vm.uuid]}
              />
            </TableTd>
            <TableTd>
              <Text size="sm">
                {t("vms.units.cpus", {
                  count: formatNumber(vm.resources.cpus, locale),
                })}
              </Text>
            </TableTd>
            <TableTd>
              <Text size="sm">{formatBytes(vm.resources.memory, locale)}</Text>
            </TableTd>
            <TableTd>
              <Text size="sm">{formatBytes(vm.resources.disk, locale)}</Text>
            </TableTd>
            <TableTd>
              <VmExpiry vm={vm} />
            </TableTd>
            {showOwner && (
              <TableTd>
                <VmOwner vm={vm} me={me} />
              </TableTd>
            )}
            <TableTd>
              <VmActions
                vm={vm}
                manage={may.manage}
                remove={may.delete}
                onPending={(underway) => markAsked(vm.uuid, underway)}
              />
            </TableTd>
          </TableTr>
        );
      })}
    </TableTbody>
  );
}
