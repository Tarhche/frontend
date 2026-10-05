"use client";

import {Badge, Tooltip} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {stateLabel} from "@/lib/state-label";
import {type Snapshot} from "../types";

const COLORS: Record<string, string> = {
  creating: "blue",
  ready: "green",
  failed: "red",
  deleting: "red",
};

/** Where a snapshot is, and why it failed when it did. */
export function SnapshotStateBadge({
  snapshot,
}: {
  snapshot: Pick<Snapshot, "state" | "reason">;
}) {
  const t = useTranslations();

  const badge = (
    <Badge
      variant="light"
      color={COLORS[snapshot.state] ?? "gray"}
      miw="max-content"
    >
      {stateLabel(t, "snapshots.states", snapshot.state)}
    </Badge>
  );

  if (snapshot.state !== "failed" || !snapshot.reason) {
    return badge;
  }

  return (
    <Tooltip label={snapshot.reason} withArrow multiline maw={320}>
      {badge}
    </Tooltip>
  );
}
