"use client";

import {useQuery} from "@tanstack/react-query";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {
  IDLE_POLL_MS,
  POLL_MS,
} from "@/features/dashboard/workload/vms/hooks/queries";
import {type Page} from "@/features/dashboard/workload/vms/types";
import {getSnapshots} from "../client";
import {type Snapshot, type SnapshotListParams} from "../types";

export const snapshotKeys = {
  all: ["workload", "snapshots"] as const,
  list: (scope: Scope, params: SnapshotListParams) =>
    ["workload", "snapshots", scope, params] as const,
};

/** Whether a snapshot is on its way to being ready, or to being gone. */
export function isSnapshotInFlight(snapshot: Pick<Snapshot, "state">): boolean {
  return snapshot.state === "creating" || snapshot.state === "deleting";
}

/**
 * A page of snapshots, read again often while any of them is being taken or
 * deleted, and now and then otherwise.
 */
export function useSnapshots({
  scope,
  params = {},
  initialData,
  enabled = true,
}: {
  scope: Scope;
  params?: SnapshotListParams;
  initialData?: Page<Snapshot>;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: snapshotKeys.list(scope, params),
    queryFn: () => getSnapshots(scope, params),
    initialData,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.items?.some(isSnapshotInFlight)
        ? POLL_MS
        : IDLE_POLL_MS,
    meta: {silent: true},
  });
}
