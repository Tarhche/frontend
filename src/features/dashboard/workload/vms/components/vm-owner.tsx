"use client";

import {Text, Tooltip} from "@mantine/core";
import {OwnerInline} from "@/features/dashboard/workload/components/owner-inline";
import {type Vm} from "../types";

/**
 * Whose a VM is. The API promises the owner's uuid; when it says who that is
 * too, they are shown as anybody else is.
 */
export function VmOwner({vm}: {vm: Pick<Vm, "owner" | "owner_uuid">}) {
  if (vm.owner?.uuid) {
    return <OwnerInline owner={vm.owner} size={28} />;
  }

  return (
    <Tooltip label={vm.owner_uuid} withArrow>
      <Text size="xs" ff="monospace" c="dimmed">
        {vm.owner_uuid?.slice(0, 8)}
      </Text>
    </Tooltip>
  );
}
