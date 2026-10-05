import {privateDalDriver} from "@/dal/private/private-dal-driver";
import {type Scope, vmPath, vmsPath} from "./api";
import {type Page, type Vm, type VmListParams} from "./types";

/**
 * What the server renders VMs from. These go through the server's driver, so
 * an answer of "not found" or "forbidden" becomes that page rather than an
 * error; a client component reads through ./client instead.
 */

export async function fetchVms(
  scope: Scope,
  params: VmListParams = {},
): Promise<Page<Vm>> {
  const response = await privateDalDriver.get(vmsPath(scope), {params});

  return response.data;
}

export async function fetchVm(scope: Scope, uuid: string): Promise<Vm> {
  const response = await privateDalDriver.get(vmPath(scope, uuid));

  return response.data;
}
