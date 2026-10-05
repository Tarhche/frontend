"use server";

import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {APP_PATHS} from "@/lib/app-paths";
import {
  isScope,
  type Scope,
  vmCommandPath,
  vmPath,
  vmRestorePath,
} from "../api";
import {type ActionResult, type VmCommand} from "../types";
import {attempt, NOT_ASKED} from "./attempt";

const COMMANDS: readonly VmCommand[] = ["start", "stop", "restart"];

function pagesOf(uuid: string): string[] {
  return [APP_PATHS.dashboard.vms.index, APP_PATHS.dashboard.vms.detail(uuid)];
}

/**
 * Starts, stops or restarts a VM. The workload does it in its own time: what
 * is answered is that it was asked, and the VM's state says the rest.
 */
export async function commandVm(
  command: VmCommand,
  uuid: string,
  scope: Scope,
): Promise<ActionResult> {
  if (!COMMANDS.includes(command) || !isScope(scope)) {
    return NOT_ASKED;
  }

  return attempt(
    () => privateDalDriver.post(vmCommandPath(scope, uuid, command)),
    pagesOf(uuid),
  );
}

/** Deletes a VM and its disk. Its snapshots outlive it. */
export async function deleteVm(
  uuid: string,
  scope: Scope,
): Promise<ActionResult> {
  if (!isScope(scope)) {
    return NOT_ASKED;
  }

  return attempt(
    () => privateDalDriver.delete(vmPath(scope, uuid)),
    pagesOf(uuid),
  );
}

/**
 * Restores a VM from one of its owner's snapshots: it is stopped, its disk is
 * replaced with the snapshot's, and it is started again. It keeps its name,
 * its address and its ports.
 */
export async function restoreVm(
  uuid: string,
  snapshotUuid: string,
  scope: Scope,
): Promise<ActionResult> {
  if (!isScope(scope)) {
    return NOT_ASKED;
  }

  return attempt(
    () =>
      privateDalDriver.post(vmRestorePath(scope, uuid), {
        snapshot_uuid: snapshotUuid,
      }),
    [...pagesOf(uuid), APP_PATHS.dashboard.snapshots.index],
  );
}
