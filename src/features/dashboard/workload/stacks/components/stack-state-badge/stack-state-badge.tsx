"use client";

import {Badge} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {stateLabel} from "@/lib/state-label";
import {type StackState} from "../../types";

/** What has just been asked of a stack, which the platform has yet to show. */
export type StackTransition =
  "starting" | "stopping" | "restarting" | "removing";

// what each state says about a stack, at a glance: one that waits on its VM,
// or some of whose services do not run, is not where it was asked to be.
const colors: Record<StackState, string> = {
  deploying: "blue",
  running: "green",
  degraded: "orange",
  starting: "blue",
  stopping: "yellow",
  stopped: "gray",
  restarting: "blue",
  removing: "red",
  waiting: "yellow",
  failed: "red",
};

/** The colour a stack's state is shown in; one nobody has named, grey. */
export function stackStateColor(state: string): string {
  return colors[state as StackState] ?? "gray";
}

type Props = {
  state: string;
  pending?: StackTransition;
};

/**
 * Where a stack is, or what the platform is in the middle of doing to it.
 * Something just asked of it is shown until the platform starts on it.
 */
export function StackStateBadge({state, pending}: Props) {
  const t = useTranslations();

  if (pending) {
    return (
      <Badge
        color={pending === "removing" ? "red" : "blue"}
        variant="light"
        miw="max-content"
      >
        {t(`stacks.transitions.${pending}`)}
      </Badge>
    );
  }

  return (
    <Badge color={stackStateColor(state)} variant="light" miw="max-content">
      {stateLabel(t, "stacks.states", state)}
    </Badge>
  );
}
