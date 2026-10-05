"use client";

import {useQuery} from "@tanstack/react-query";
import {useSamples} from "@/features/dashboard/workload/hooks/use-samples";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {LIVE, POLL_MS} from "@/features/dashboard/workload/vms/hooks/queries";
import {fetchContainerStats} from "../api";
import {type ContainerStats} from "../types";
import {dockerKeys} from "./queries";

function sampledAt(sample: ContainerStats): string {
  return sample.sampled_at;
}

/**
 * A container's usage, sampled every few seconds for as long as `enabled`
 * says so, the way everything on the screen is read again; the samples are
 * kept while the page is open, for the trend, and nowhere else.
 */
export function useContainerStats(
  scope: Scope,
  vmUuid: string,
  id: string,
  enabled: boolean,
) {
  const query = useQuery({
    ...LIVE,
    queryKey: dockerKeys.stats(scope, vmUuid, id),
    queryFn: () => fetchContainerStats(scope, vmUuid, id),
    enabled,
    refetchInterval: POLL_MS,
  });

  return {samples: useSamples(query.data, sampledAt), query};
}
