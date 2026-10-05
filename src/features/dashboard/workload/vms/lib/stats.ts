import {isGregorianStartDateTime} from "@/lib/date-and-time";
import {clampPercent, percentOf} from "@/features/dashboard/workload/lib/usage";
import {type VmStats} from "../types";

/**
 * A VM's stats as the page keeps them: each part of a sample as a share of
 * what the VM has. How a share is read and how worried to be about it is the
 * workload's (lib/usage.ts), as it is for a container.
 */

/**
 * Whether there is a sample to show at all. A VM that has never been sampled
 * says so with the zero time, or with nothing.
 */
export function hasStats(stats?: VmStats | null): stats is VmStats {
  return (
    !!stats &&
    !!stats.sampled_at &&
    !isGregorianStartDateTime(stats.sampled_at) &&
    !Number.isNaN(new Date(stats.sampled_at).getTime())
  );
}

/** One moment of a VM's use, each part as a share of what it has. */
export type StatsSample = {
  at: string;
  cpu: number;
  memory: number;
  disk: number;
};

export function sampleOf(stats: VmStats): StatsSample {
  return {
    at: stats.sampled_at,
    cpu: clampPercent(stats.cpu_percent),
    memory: percentOf(stats.memory_used, stats.memory_limit),
    disk: percentOf(stats.disk_used, stats.disk_total),
  };
}
