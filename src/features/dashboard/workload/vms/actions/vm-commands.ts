"use server";

import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {APP_PATHS} from "@/lib/app-paths";
import {
  NOTHING_NEEDS_IT,
  removalOf,
  removeParams,
  type Removal,
} from "@/features/dashboard/workload/lib/dependents";
import {
  isScope,
  type Scope,
  vmCommandPath,
  vmPath,
  vmRestorePath,
} from "../api";
import {type ActionResult, type RemovalResult, type VmCommand} from "../types";
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

/**
 * Deletes a VM and its disk. Its snapshots outlive it. The stacks and
 * containers in it make it again, under the same uuid and slug, unless they
 * are deleted along with it (cascade): what needs it is answered either way.
 */
export async function deleteVm(
  uuid: string,
  scope: Scope,
  {cascade = false}: {cascade?: boolean} = {},
): Promise<RemovalResult> {
  if (!isScope(scope)) {
    return NOT_ASKED;
  }

  let removal: Removal = NOTHING_NEEDS_IT;
  const result = await attempt(async () => {
    const response = await privateDalDriver.delete(vmPath(scope, uuid), {
      params: removeParams({cascade: cascade === true}),
    });
    removal = removalOf(response.data);
  }, pagesOf(uuid));

  return result.ok ? {ok: true, removal} : result;
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
