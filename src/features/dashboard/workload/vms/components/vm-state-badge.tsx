"use client";

import {Badge} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {stateLabel} from "@/lib/state-label";

/** What a VM is on its way to, in the words of the thing being done. */
export type VmTransition =
  "starting" | "stopping" | "restarting" | "restoring" | "deleting";

// what each state says about a VM, at a glance.
const colors: Record<string, string> = {
  created: "gray",
  scheduled: "blue",
  starting: "blue",
  running: "green",
  restarting: "blue",
  restoring: "violet",
  stopping: "yellow",
  stopped: "gray",
  failed: "red",
  deleting: "red",
};

// what a VM in one of these states is in the middle of doing, whatever it
// happens to be called inside the workload.
const underway: Record<string, VmTransition> = {
  starting: "starting",
  stopping: "stopping",
  restarting: "restarting",
  restoring: "restoring",
  deleting: "deleting",
};

// and what one that is on its way somewhere is on its way to, which only the
// state it was asked for can say.
const towards: Record<string, VmTransition> = {
  running: "starting",
  stopped: "stopping",
};

function transitionOf(
  state: string,
  expectedState: string | undefined,
  pending: VmTransition | undefined,
): VmTransition | undefined {
  if (pending) {
    return pending;
  }

  if (underway[state]) {
    return underway[state];
  }

  // one that failed stays failed until it is asked for again: nothing tries a
  // VM again by itself, so nothing is on its way to it.
  if (state === "failed") {
    return undefined;
  }

  // one that has been asked for but is not anywhere yet is on its way to
  // whatever was asked of it.
  if (state === "created" || state === "scheduled") {
    return towards[expectedState ?? "running"];
  }

  // and so is one that is somewhere else than it was asked to be, whether the
  // workload has got round to moving it yet or not.
  if (expectedState && expectedState !== state) {
    return towards[expectedState];
  }

  return undefined;
}

type Props = {
  state: string;
  expectedState?: string;

  /**
   * What somebody has just asked of this VM, which the workload has yet to
   * catch up with. It is what is happening to it, so it is what is shown.
   */
  pending?: VmTransition;
};

/**
 * Where a VM is, or what it is on its way to: the transition is what is
 * happening to it, so it is what is shown while there is one.
 */
export function VmStateBadge({state, expectedState, pending}: Props) {
  const t = useTranslations();
  const transition = transitionOf(state, expectedState, pending);

  let color = colors[state] ?? "gray";
  if (pending === "deleting") {
    color = "red";
  } else if (pending) {
    color = "blue";
  }

  return (
    <Badge color={color} variant="light" miw="max-content">
      {transition
        ? t(`vms.transitions.${transition}`)
        : stateLabel(t, "vms.states", state)}
    </Badge>
  );
}
