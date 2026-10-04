"use client";

import {Text, Tooltip} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {OwnerInline} from "@/features/dashboard/workload/components/owner-inline";
import {type Vm} from "../types";

/**
 * Whose a VM is. The API promises the owner's uuid; when it says who that is
 * too, they are shown as anybody else is, and one's own is said to be.
 */
export function VmOwner({
  vm,
  me,
}: {
  vm: Pick<Vm, "owner" | "owner_uuid">;
  me?: string | null;
}) {
  const t = useTranslations();

  if (me && vm.owner_uuid === me) {
    return <Text size="sm">{t("vms.table.you")}</Text>;
  }

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
