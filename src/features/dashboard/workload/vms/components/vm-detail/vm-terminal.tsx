"use client";

import {Alert} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {
  type AttachTarget,
  TaskTerminal,
} from "@/features/dashboard/workload/components/task-terminal";

type Props = {
  uuid: string;
  running: boolean;

  /**
   * What the uuid is opened on: a VM, whose owner alone is let in, unless it
   * is a run of the code runner's, whose terminal is its task's, which the
   * node opens for anybody. A run's uuid is its task's.
   */
  target?: AttachTarget;
};

/**
 * A shell inside a running VM, opened on the workload's ingress the same way
 * a task's is. Only its owner is let into a VM, which is why only its owner is
 * offered one; a run's is opened on its task, as the page its snippet runs on
 * opens one.
 */
export function VmTerminal({uuid, running, target = "vms"}: Props) {
  const t = useTranslations();

  if (!running) {
    return (
      <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
        {t("vms.detail.terminalNotRunning")}
      </Alert>
    );
  }

  return <TaskTerminal taskUuid={uuid} target={target} running />;
}
