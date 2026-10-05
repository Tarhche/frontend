"use client";

import {useQuery} from "@tanstack/react-query";
import {fetchDockerVms} from "../api";
import {type Vm, type VmSource} from "../types";
import {isInFlight} from "../vm-state";
import {IDLE_POLL_MS, LIVE, POLL_MS, vmKeys} from "./queries";

/**
 * The Docker VMs a page offers, from where the page was told to list them:
 * every page of them, since one is picked out of all of them.
 *
 * A VM that is on its way somewhere is looked at again every few seconds, so
 * whatever waits on it to be running finds out when it is; the rest are looked
 * at now and then, since they can be stopped from another page.
 */
export function useDockerVms(source: VmSource | null) {
  return useQuery<Vm[]>({
    ...LIVE,
    queryKey: vmKeys.list(source?.scope ?? "mine", {
      kind: "docker",
      pages: "all",
      owner: source?.owner ?? null,
    }),
    queryFn: async () => {
      const vms = await fetchDockerVms(source!.scope);

      return source?.owner
        ? vms.filter((vm) => vm.owner_uuid === source.owner)
        : vms;
    },
    enabled: source !== null,
    refetchInterval: (query) =>
      query.state.data?.some(isInFlight) ? POLL_MS : IDLE_POLL_MS,
  });
}
