"use client";

import {useQuery} from "@tanstack/react-query";
import {type Scope} from "../api";
import {getVm, getVms} from "../client";
import {isInFlight} from "../lib/state";
import {type Page, type Vm, type VmListParams} from "../types";

/** Where the VMs read in the browser are kept, so a change can refresh them. */
export const vmKeys = {
  all: ["workload", "vms"] as const,
  list: (scope: Scope, params: VmListParams) =>
    ["workload", "vms", scope, "list", params] as const,
  detail: (scope: Scope, uuid: string) =>
    ["workload", "vms", scope, "detail", uuid] as const,
};

/** How often a VM is read while somebody is looking at it. */
export const POLL_MS = 5_000;

/** And a listing in which nothing is on its way anywhere. */
export const IDLE_POLL_MS = 30_000;

/**
 * One VM, read again every few seconds: its state, and the stats its node
 * last sampled. It is null once the VM is gone.
 *
 * A failure is shown where the VM is rather than raised as a notification,
 * since the next read is only seconds away.
 */
export function useVm({
  scope,
  uuid,
  initialData,
}: {
  scope: Scope;
  uuid: string;
  initialData?: Vm;
}) {
  return useQuery({
    queryKey: vmKeys.detail(scope, uuid),
    queryFn: () => getVm(scope, uuid),
    initialData,
    refetchInterval: POLL_MS,
    retry: false,
    meta: {silent: true},
  });
}

/**
 * A page of VMs, read again often while any of them is on its way somewhere
 * and now and then otherwise.
 */
export function useVms({
  scope,
  params = {},
  initialData,
  enabled = true,
}: {
  scope: Scope;
  params?: VmListParams;
  initialData?: Page<Vm>;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: vmKeys.list(scope, params),
    queryFn: () => getVms(scope, params),
    initialData,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.items?.some(isInFlight) ? POLL_MS : IDLE_POLL_MS,
    meta: {silent: true},
  });
}
