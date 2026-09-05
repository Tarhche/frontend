"use client";

import {Badge} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";

type Props = {
  state: string;

  /**
   * What became of a container that failed. The runner asks a failed container
   * for again, up to as many times as it is worth, so one that is still wanted
   * running has not finished failing — it is between attempts.
   */
  expectedState?: string;
  retries?: number;
  maxRetries?: number;

  /**
   * What somebody has just asked of this container, which the runner has yet
   * to catch up with. It is what is happening to it, so it is what is shown.
   */
  pending?: Transition;
};

/** What a container is on its way to, in the words of the thing being done. */
export type Transition =
  "starting" | "stopping" | "killing" | "restarting" | "deleting";

// what each state says about a container, at a glance.
const colors: Record<string, string> = {
  created: "gray",
  scheduled: "blue",
  running: "green",
  restarting: "blue",
  stopping: "yellow",
  stopped: "gray",
  completed: "teal",
  failed: "red",
};

// what a container in one of these states is in the middle of doing, whatever
// it happens to be called inside the runner.
const underway: Record<string, Transition> = {
  stopping: "stopping",
  restarting: "restarting",
};

// and what one that is on its way somewhere is on its way to, which only the
// state it was asked for can say.
const towards: Record<string, Transition> = {
  running: "starting",
  stopped: "stopping",
};

function transitionOf(
  state: string,
  expectedState: string | undefined,
  pending: Transition | undefined,
): Transition | undefined {
  if (pending) {
    return pending;
  }

  if (underway[state]) {
    return underway[state];
  }

  // one that has been asked for but is not anywhere yet is on its way to
  // whatever was asked of it.
  if (state === "created" || state === "scheduled") {
    return towards[expectedState ?? "running"];
  }

  // and so is one that is somewhere else than it was asked to be, whether the
  // runner has got round to moving it yet or not.
  if (expectedState && expectedState !== state) {
    return towards[expectedState];
  }

  return undefined;
}

export function StateBadge({
  state,
  expectedState,
  retries = 0,
  maxRetries = 0,
  pending,
}: Props) {
  const t = useTranslations();

  // it failed, and the runner has not given up on it: what it shows then is
  // which attempt it is on, and red is kept for the ones nothing more is going
  // to happen to. That it is on its way back is the retrying, not a transition
  // of its own.
  const retrying = state === "failed" && expectedState === "running";

  const transition = retrying
    ? pending
    : transitionOf(state, expectedState, pending);

  const attempts =
    maxRetries < 0
      ? t("containers.table.retrying")
      : t("containers.table.retryingCount", {
          current: retries,
          total: maxRetries,
        });

  let label = state;
  if (transition) {
    label = t(`containers.transitions.${transition}`);
  } else if (retrying) {
    label = `${state} - ${attempts}`;
  }

  let color = colors[state] ?? "gray";
  if (pending === "deleting" || pending === "killing") {
    color = "red";
  } else if (pending) {
    color = "blue";
  } else if (retrying) {
    color = "orange";
  }

  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  );
}
