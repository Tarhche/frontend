"use client";

import {useQuery} from "@tanstack/react-query";
import {fetchImages, fetchNetworks, fetchVolumes} from "../api";
import {retryTransient} from "../errors";
import {type Image, type Network, type Scope, type Volume} from "../types";
import {dockerKeys, pollUntilFailed} from "./queries";

// what is in a VM changes when somebody changes it, mostly from this very page,
// which asks again when it does; a stack deploying alongside is the rest.
const EVERY = 30_000;

type Options = {
  /** whether the VM can answer: one that is not running is not asked. */
  enabled?: boolean;
};

export function useImages(scope: Scope, vmUuid: string, options?: Options) {
  return useQuery<Image[]>({
    queryKey: dockerKeys.images(scope, vmUuid),
    queryFn: () => fetchImages(scope, vmUuid),
    enabled: (options?.enabled ?? true) && vmUuid.length > 0,
    staleTime: 5_000,
    retry: retryTransient,
    refetchInterval: pollUntilFailed(EVERY),
  });
}

export function useNetworks(scope: Scope, vmUuid: string, options?: Options) {
  return useQuery<Network[]>({
    queryKey: dockerKeys.networks(scope, vmUuid),
    queryFn: () => fetchNetworks(scope, vmUuid),
    enabled: (options?.enabled ?? true) && vmUuid.length > 0,
    staleTime: 5_000,
    retry: retryTransient,
    refetchInterval: pollUntilFailed(EVERY),
  });
}

export function useVolumes(scope: Scope, vmUuid: string, options?: Options) {
  return useQuery<Volume[]>({
    queryKey: dockerKeys.volumes(scope, vmUuid),
    queryFn: () => fetchVolumes(scope, vmUuid),
    enabled: (options?.enabled ?? true) && vmUuid.length > 0,
    staleTime: 5_000,
    retry: retryTransient,
    refetchInterval: pollUntilFailed(EVERY),
  });
}
