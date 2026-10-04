"use client";

import {Badge} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {stateLabel} from "../state-label";

// what each state says about a VM, at a glance.
const colors: Record<string, string> = {
  created: "gray",
  scheduled: "blue",
  starting: "blue",
  running: "green",
  stopping: "yellow",
  stopped: "gray",
  restarting: "blue",
  restoring: "blue",
  failed: "red",
  deleting: "red",
};

/** Where a VM is, in the words of the VM pages. */
export function VmStateBadge({state}: {state: string}) {
  const t = useTranslations();

  return (
    <Badge color={colors[state] ?? "gray"} variant="light">
      {stateLabel(t, "docker.vmStates", state)}
    </Badge>
  );
}
