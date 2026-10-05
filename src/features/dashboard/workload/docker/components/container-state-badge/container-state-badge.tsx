"use client";

import {Badge} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {stateLabel} from "@/lib/state-label";

/** What has just been asked of a container, which docker has yet to show. */
export type ContainerTransition =
  "starting" | "stopping" | "restarting" | "removing";

// what each state says about a container, at a glance.
const colors: Record<string, string> = {
  created: "gray",
  running: "green",
  paused: "yellow",
  restarting: "blue",
  removing: "orange",
  exited: "gray",
  dead: "red",
};

/**
 * The code a container exited with, as docker's status puts it: "Exited (137)
 * 2 minutes ago". One that stopped on its own terms exits with 0.
 */
export function exitCodeOf(status: string | undefined): number | null {
  const match = /^Exited \((-?\d+)\)/.exec(status ?? "");

  return match ? Number(match[1]) : null;
}

type Props = {
  state: string;
  status?: string;
  pending?: ContainerTransition;
};

/**
 * Where a container is. Something just asked of it is what is happening to it,
 * so that is what is shown until docker says otherwise; one that exited with a
 * failure is told apart from one that was stopped.
 */
export function ContainerStateBadge({state, status, pending}: Props) {
  const t = useTranslations();

  if (pending) {
    return (
      <Badge
        color={pending === "removing" ? "red" : "blue"}
        variant="light"
        miw="max-content"
      >
        {t(`containers.transitions.${pending}`)}
      </Badge>
    );
  }

  const exitCode = state === "exited" ? exitCodeOf(status) : null;
  const failed = exitCode !== null && exitCode !== 0;

  return (
    <Badge
      color={failed ? "red" : (colors[state] ?? "gray")}
      variant="light"
      miw="max-content"
    >
      {failed
        ? t("containers.states.exitedWith", {code: exitCode})
        : stateLabel(t, "containers.states", state)}
    </Badge>
  );
}
