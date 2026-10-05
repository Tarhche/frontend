"use client";

import {useSamples} from "@/features/dashboard/workload/hooks/use-samples";
import {hasStats, sampleOf, type StatsSample} from "../lib/stats";
import {type VmStats} from "../types";

/**
 * The samples of a VM's use seen while the page has been open, oldest first:
 * each read of the VM carries the last sample its node took, and this is
 * those, one each.
 */
export function useStatsSamples(stats?: VmStats | null): StatsSample[] {
  return useSamples(hasStats(stats) ? sampleOf(stats) : null, atOf);
}

function atOf(sample: StatsSample): string {
  return sample.at;
}
