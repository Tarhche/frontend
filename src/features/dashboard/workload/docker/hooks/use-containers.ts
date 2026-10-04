"use client";

import {useQuery} from "@tanstack/react-query";
import {fetchContainer, fetchContainers} from "../api";
import {retryTransient} from "../errors";
import {type Container, type Scope} from "../types";
import {dockerKeys, pollUntilFailed} from "./queries";

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
    queryKey: dockerKeys.containers(scope, vm),
    queryFn: () => fetchContainers(scope, vm),
    enabled: options?.enabled ?? true,
    staleTime: 5_000,
    retry: retryTransient,
    refetchInterval: pollUntilFailed(10_000),
  });
}

/** One container, as its VM's dockerd inspects it now. */
export function useContainer(scope: Scope, vmUuid: string, id: string) {
  return useQuery<Container>({
    queryKey: dockerKeys.container(scope, vmUuid, id),
    queryFn: () => fetchContainer(scope, vmUuid, id),
    staleTime: 5_000,
    retry: retryTransient,
    refetchInterval: pollUntilFailed(10_000),
  });
}
