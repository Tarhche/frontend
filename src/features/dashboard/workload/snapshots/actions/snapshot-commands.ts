"use server";

import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {APP_PATHS} from "@/lib/app-paths";
import {isScope, type Scope} from "@/features/dashboard/workload/vms/api";
import {
  attempt,
  NOT_ASKED,
} from "@/features/dashboard/workload/vms/actions/attempt";
import {type ActionResult} from "@/features/dashboard/workload/vms/types";
import {snapshotPath, takeSnapshotPath} from "../api";

/**
 * Takes a snapshot of one of one's own VMs, which must be running or
 * stopped. It is taken in the workload's own time: the snapshot is listed as
 * being taken until it is ready.
 */
export async function takeSnapshot(
  vmUuid: string,
  name: string,
): Promise<ActionResult> {
  return attempt(
    () => privateDalDriver.post(takeSnapshotPath(vmUuid), {name}),
    [
      APP_PATHS.dashboard.snapshots.index,
      APP_PATHS.dashboard.vms.detail(vmUuid),
    ],
  );
}

export async function renameSnapshot(
  uuid: string,
  name: string,
  scope: Scope,
): Promise<ActionResult> {
  if (!isScope(scope)) {
    return NOT_ASKED;
  }

  return attempt(
    () => privateDalDriver.patch(snapshotPath(scope, uuid), {name}),
    [APP_PATHS.dashboard.snapshots.index],
  );
}

/** Deletes a snapshot, and the copy of the disk it kept. */
export async function deleteSnapshot(
  uuid: string,
  scope: Scope,
): Promise<ActionResult> {
  if (!isScope(scope)) {
    return NOT_ASKED;
  }

  return attempt(
    () => privateDalDriver.delete(snapshotPath(scope, uuid)),
    [APP_PATHS.dashboard.snapshots.index],
  );
}
