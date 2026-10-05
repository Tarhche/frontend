import {isAxiosError} from "axios";
import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {type Scope, vmLogsPath, vmPath, vmsPath} from "./api";
import {type Page, type Vm, type VmListParams, type VmLogs} from "./types";

/**
 * What the browser reads VMs through, for whatever has to be read again while
 * the page is open: a VM's state and stats, its logs. Changes go through the
 * server actions instead, which is where the API's validation is read.
 */

export async function getVms(
  scope: Scope,
  params: VmListParams = {},
): Promise<Page<Vm>> {
  const response = await clientDalDriver.get(vmsPath(scope), {params});

  return response.data;
}

// a person holds a handful of VMs, and somebody looking at everybody's is
// looking for one to pick: past this many pages, a select is no help anyway.
const MAX_PAGES = 10;

/**
 * Every page of a listing, for picking one VM out of all of them. Only VMs of
 * the kind asked for are kept, whatever the server made of the filter.
 */
export async function getAllVms(
  scope: Scope,
  params: Omit<VmListParams, "page"> = {},
): Promise<Vm[]> {
  const vms: Vm[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const listed = await getVms(scope, {...params, page});
    vms.push(...(listed?.items ?? []));

    if (page >= (listed?.pagination?.total_pages ?? 1)) {
      break;
    }
  }

  return params.kind ? vms.filter((vm) => vm.kind === params.kind) : vms;
}

/** The VM, or null once it is gone. */
export async function getVm(scope: Scope, uuid: string): Promise<Vm | null> {
  try {
    const response = await clientDalDriver.get(vmPath(scope, uuid));

    return response.data;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }

    throw error;
  }
}

export type VmLogsParams = {
  /** Only what was written from this moment on (RFC 3339). */
  since?: string;

  /** At most this many of the latest lines. */
  tail?: number;
};

export async function getVmLogs(
  scope: Scope,
  uuid: string,
  params: VmLogsParams = {},
): Promise<VmLogs> {
  const response = await clientDalDriver.get(vmLogsPath(scope, uuid), {
    params,
  });

  return {items: response.data?.items ?? [], ...response.data};
}

export function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}
