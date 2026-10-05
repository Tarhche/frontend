import {type Scope} from "@/features/dashboard/workload/vms/api";

/**
 * What somebody may do to a snapshot, and through which routes: one's own
 * through one's own when that permission is held, anybody's through the
 * workload's. Taking one is the workload's alone, and see ../vms/permissions.
 */
export type SnapshotAction = "index" | "show" | "update" | "delete";

export function snapshotScope(
  permissions: readonly string[],
  action: SnapshotAction,
  isOwner: boolean,
): Scope | null {
  if (isOwner && permissions.includes(`self.workload.snapshots.${action}`)) {
    return "mine";
  }

  if (permissions.includes(`workload.snapshots.${action}`)) {
    return "all";
  }

  return null;
}
