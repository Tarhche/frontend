"use client";

import {useQuery} from "@tanstack/react-query";
import {type Scope} from "../api";
import {getAllVms, getVm, getVms} from "../client";
import {isCodeRunnerRun} from "../lib/code-runner";
import {isInFlight} from "../lib/state";
import {type VmSource} from "../permissions";
import {type Page, type Vm, type VmKind, type VmListParams} from "../types";

/** Where the VMs read in the browser are kept, so a change can refresh them. */
export const vmKeys = {
  all: ["workload", "vms"] as const,
  list: (scope: Scope, params: VmListParams) =>
    ["workload", "vms", scope, "list", params] as const,
  detail: (scope: Scope, uuid: string) =>
    ["workload", "vms", scope, "detail", uuid] as const,
  choices: (source: VmSource | null, kind?: VmKind) =>
    [
      "workload",
      "vms",
      source?.scope ?? null,
      "choices",
      source?.owner ?? null,
      kind ?? null,
    ] as const,
};

/** How often what is on the screen is read again, while it is. */
export const POLL_MS = 5_000;

/** And a listing in which nothing is on its way anywhere. */
export const IDLE_POLL_MS = 30_000;

/**
 * What every read that is asked for again and again shares, in the workload's
 * pages. A failure is shown where what was read is shown, rather than raised
 * as a notification: the next read is only seconds away, and is the retry.
 */
export const LIVE = {
  retry: false,
  staleTime: 2_000,
  meta: {silent: true},
} as const;

/**
 * One VM, read again every few seconds: its state, and the stats its node
 * last sampled. It is null once the VM is gone.
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
    ...LIVE,
    queryKey: vmKeys.detail(scope, uuid),
    queryFn: () => getVm(scope, uuid),
    initialData,
    refetchInterval: POLL_MS,
  });
}

/**
 * A page of VMs, read again often while any of them is on its way somewhere
 * and now and then otherwise. A run of the code runner's lasts as long as its
 * snippet, seconds rather than days, so a page with one is read often too, and
 * the run is gone from it soon after it ends.
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
    ...LIVE,
    queryKey: vmKeys.list(scope, params),
    queryFn: () => getVms(scope, params),
    initialData,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.items?.some(
        (vm) => isInFlight(vm) || isCodeRunnerRun(vm),
      )
        ? POLL_MS
        : IDLE_POLL_MS,
  });
}

/**
 * The VMs somebody may pick one of: every page of a source's, of one kind when
 * a kind is asked for, narrowed to an owner's when the source says so. Nothing
 * is read without a source, since there is nowhere it may be read from. A run
 * of the code runner's is never one: nothing goes into it, and it is gone in
 * moments.
 *
 * A VM on its way somewhere is looked at again every few seconds, so whatever
 * waits on it to be running finds out when it is; the rest now and then, since
 * they can be changed from another page.
 */
export function useVmChoices(
  source: VmSource | null,
  {kind, enabled = true}: {kind?: VmKind; enabled?: boolean} = {},
) {
  return useQuery<Vm[]>({
    ...LIVE,
    queryKey: vmKeys.choices(source, kind),
    queryFn: async () => {
      const vms = (await getAllVms(source!.scope, kind ? {kind} : {})).filter(
        (vm) => !isCodeRunnerRun(vm),
      );

      return source?.owner
        ? vms.filter((vm) => vm.owner_uuid === source.owner)
        : vms;
    },
    enabled: enabled && source !== null,
    refetchInterval: (query) =>
      query.state.data?.some(isInFlight) ? POLL_MS : IDLE_POLL_MS,
  });
}
