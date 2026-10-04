"use client";

import {Alert} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {TaskTerminal} from "@/features/dashboard/workload/components/task-terminal";

/**
 * A shell inside a running VM, opened on the workload's ingress the same way
 * a task's is. Only its owner is let in, which is why only its owner is
 * offered one.
 */
export function VmTerminal({uuid, running}: {uuid: string; running: boolean}) {
  const t = useTranslations();

  if (!running) {
    return (
      <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
        {t("vms.detail.terminalNotRunning")}
      </Alert>
    );
  }

  return <TaskTerminal taskUuid={uuid} target="vms" running />;
}
