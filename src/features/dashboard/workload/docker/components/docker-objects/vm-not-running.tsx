"use client";

import {EmptyState} from "@mantine/core";
import {
  IconAlertTriangle,
  IconHourglass,
  IconPlayerStop,
  IconTrash,
} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {type Vm} from "../../types";
import {vmReadiness} from "../../vm-state";

const ICONS = {
  booting: IconHourglass,
  stopped: IconPlayerStop,
  failed: IconAlertTriangle,
  gone: IconTrash,
};

/**
 * What stands in for what is in a VM that cannot be asked: it is on its way
 * up, it is stopped, it failed, or it is going away. One on its way up is
 * looked at again every few seconds, so this gives way once it is running.
 */
export function VmNotRunning({vm}: {vm: Vm}) {
  const {t} = useI18n();
  const readiness = vmReadiness(vm.state);

  if (readiness === "running") {
    return null;
  }

  const Icon = ICONS[readiness];

  return (
    <EmptyState
      icon={<Icon />}
      withIndicatorBackground
      title={t(`dockerVms.empty.${readiness}`, {vm: vm.name})}
      description={
        readiness === "failed" && vm.reason
          ? t("dockerVms.readiness.failedBecause", {reason: vm.reason})
          : t(`dockerVms.readiness.${readiness}`)
      }
    />
  );
}
