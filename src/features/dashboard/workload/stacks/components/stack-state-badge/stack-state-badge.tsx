"use client";

import {Badge} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {stateLabel} from "@/features/dashboard/workload/docker/components/state-label";

/** What has just been asked of a stack, which its VM has yet to start on. */
export type StackTransition =
  "starting" | "stopping" | "restarting" | "removing";

// what each state says about a stack, at a glance.
const colors: Record<string, string> = {
  deploying: "blue",
  running: "green",
  starting: "blue",
  stopping: "yellow",
  stopped: "gray",
  restarting: "blue",
  removing: "red",
  failed: "red",
};

type Props = {
  state: string;
  pending?: StackTransition;
};

/**
 * Where a stack is: what its last compose command left it as, or what that
 * command is in the middle of. Something just asked of it is shown until the
 * command reaches its VM.
 */
export function StackStateBadge({state, pending}: Props) {
  const t = useTranslations();

  if (pending) {
    return (
      <Badge color={pending === "removing" ? "red" : "blue"} variant="light">
        {t(`stacks.transitions.${pending}`)}
      </Badge>
    );
  }

  return (
    <Badge color={colors[state] ?? "gray"} variant="light">
      {stateLabel(t, "stacks.states", state)}
    </Badge>
  );
}
