import {
  type Scope,
  vmPath,
  workloadPath,
} from "@/features/dashboard/workload/vms/api";

export function snapshotsPath(scope: Scope): string {
  return workloadPath(scope, "snapshots");
}

export function snapshotPath(scope: Scope, uuid: string): string {
  return `${snapshotsPath(scope)}/${encodeURIComponent(uuid)}`;
}

/**
 * Where a snapshot of a VM is taken. It is the workload's own route whoever
 * asks, and the snapshot is always the caller's.
 */
export function takeSnapshotPath(vmUuid: string): string {
  return `${vmPath("all", vmUuid)}/snapshots`;
}
