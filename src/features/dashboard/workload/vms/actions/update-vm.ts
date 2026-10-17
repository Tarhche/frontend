"use server";

import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {APP_PATHS} from "@/lib/app-paths";
import {isScope, type Scope, vmPath} from "../api";
import {type ActionResult, type UpdateVmRequest} from "../types";
import {attempt, NOT_ASKED} from "./attempt";

/**
 * Changes a VM. Only what is in the request is changed; a VM that is running
 * is restarted when its ports, network or resources are.
 */
export async function updateVm(
  uuid: string,
  scope: Scope,
  request: UpdateVmRequest,
): Promise<ActionResult> {
  if (!isScope(scope)) {
    return NOT_ASKED;
  }

  return attempt(
    () => privateDalDriver.patch(vmPath(scope, uuid), request),
    [APP_PATHS.dashboard.vms.index, APP_PATHS.dashboard.vms.detail(uuid)],
  );
}
