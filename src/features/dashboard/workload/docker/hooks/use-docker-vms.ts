"use client";

import {useQuery} from "@tanstack/react-query";
import {fetchDockerVms} from "../api";
import {retryTransient} from "../errors";
import {type Vm, type VmSource} from "../types";
import {isSettling} from "../vm-state";
import {dockerKeys} from "./queries";

/**
 * The Docker VMs a page offers, from where the page was told to list them.
 *
 * A VM that is on its way somewhere is looked at again every few seconds, so
 * whatever waits on it to be running finds out when it is; the rest are looked
 * at now and then, since they can be stopped from another page.
 */
export function useDockerVms(source: VmSource | null) {
  return useQuery<Vm[]>({
    queryKey: dockerKeys.vms(source?.scope ?? "mine", source?.owner),
    queryFn: async () => {
      const vms = await fetchDockerVms(source!.scope);

      return source?.owner
        ? vms.filter((vm) => vm.owner_uuid === source.owner)
        : vms;
    },
    enabled: source !== null,
    staleTime: 5_000,
    retry: retryTransient,
    refetchInterval: (query) => {
      if (query.state.status === "error") {
        return false;
      }

      return query.state.data?.some(isSettling) ? 5_000 : 30_000;
    },
  });
}
