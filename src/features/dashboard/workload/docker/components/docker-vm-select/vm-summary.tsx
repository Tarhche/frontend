"use client";

import {Alert, Group, Stack, Text} from "@mantine/core";
import {
  IconAlertTriangle,
  IconHourglass,
  IconPlayerStop,
  IconTrash,
} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {
  formatBytes,
  formatNumber,
} from "@/features/dashboard/workload/vms/lib/units";
import {vmReadiness} from "@/features/dashboard/workload/vms/lib/state";
import {StateBadge} from "@/features/dashboard/workload/components/state-badge";
import {ltr} from "../../format";

/**
 * What a VM that is not running means for whatever is to be done in it. One on
 * its way up is waited for; the rest have nothing in them to ask until
 * somebody does something about the VM itself.
 */
export function VmReadinessNote({vm}: {vm: Vm}) {
  const {t} = useI18n();

  switch (vmReadiness(vm.state)) {
    case "booting":
      return (
        <Alert
          color="blue"
          variant="light"
          role="status"
          icon={<IconHourglass />}
        >
          {t("dockerVms.readiness.booting")}
        </Alert>
      );
    case "stopped":
      return (
        <Alert
          color="yellow"
          variant="light"
          role="status"
          icon={<IconPlayerStop />}
        >
          {t("dockerVms.readiness.stopped")}
        </Alert>
      );
    case "failed":
      return (
        <Alert
          color="red"
          variant="light"
          role="status"
          icon={<IconAlertTriangle />}
        >
          {vm.reason
            ? t("dockerVms.readiness.failedBecause", {reason: vm.reason})
            : t("dockerVms.readiness.failed")}
        </Alert>
      );
    case "gone":
      return (
        <Alert color="red" variant="light" role="status" icon={<IconTrash />}>
          {t("dockerVms.readiness.gone")}
        </Alert>
      );
    default:
      return null;
  }
}

type SummaryProps = {
  vm: Vm;

  /** whether what its state means is said here, or by whoever shows it. */
  withReadiness?: boolean;
};

/** A Docker VM in a line or two: its state, its size, what it lets through. */
export function VmSummary({vm, withReadiness = true}: SummaryProps) {
  const {t, locale} = useI18n();
  const ports = vm.ports ?? [];

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="wrap">
        <StateBadge state={vm.state} expectedState={vm.expected_state} />
        {vm.resources && (
          <Text size="sm" c="dimmed">
            {t("dockerVms.summary.resources", {
              cpus: formatNumber(vm.resources.cpus, locale),
              memory: formatBytes(vm.resources.memory, locale),
              disk: formatBytes(vm.resources.disk, locale),
            })}
          </Text>
        )}
      </Group>
      <Text size="sm" c="dimmed">
        {ports.length > 0
          ? t("dockerVms.summary.ports", {ports: ltr(ports.join(", "))})
          : t("dockerVms.summary.noPorts")}
        {vm.network && (
          <>
            {" · "}
            {vm.network.ingress === "allow"
              ? t("dockerVms.summary.ingressAllowed")
              : t("dockerVms.summary.ingressDenied")}
            {" · "}
            {vm.network.egress === "allow"
              ? t("dockerVms.summary.egressAllowed")
              : t("dockerVms.summary.egressDenied")}
          </>
        )}
      </Text>
      {withReadiness && <VmReadinessNote vm={vm} />}
    </Stack>
  );
}
