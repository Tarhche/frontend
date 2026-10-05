"use client";

import {useQuery} from "@tanstack/react-query";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {LIVE} from "@/features/dashboard/workload/vms/hooks/queries";
import {fetchContainer, fetchContainers} from "../api";
import {type Container} from "../types";
import {dockerKeys} from "./queries";

/**
 * The containers across a scope's running Docker VMs, or one VM's. Nothing
 * says when a container changes, so the listing is asked for again every few
 * seconds while it is on the screen.
 */
export function useContainers(
  scope: Scope,
  vm?: string,
  options?: {enabled?: boolean},
) {
  return useQuery<Container[]>({
    ...LIVE,
    queryKey: dockerKeys.containers(scope, vm),
    queryFn: () => fetchContainers(scope, vm),
    enabled: options?.enabled ?? true,
    refetchInterval: 10_000,
  });
}

/** One container, as its VM's dockerd inspects it now. */
export function useContainer(scope: Scope, vmUuid: string, id: string) {
  return useQuery<Container>({
    ...LIVE,
    queryKey: dockerKeys.container(scope, vmUuid, id),
    queryFn: () => fetchContainer(scope, vmUuid, id),
    refetchInterval: 10_000,
  });
}
