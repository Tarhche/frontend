"use client";

import {useState} from "react";
import {appendSample, hasStats, sampleOf, type StatsSample} from "../lib/stats";
import {type VmStats} from "../types";

/**
 * The samples of a VM's use seen while the page has been open, oldest first.
 *
 * Nothing keeps a history of them anywhere else: each read of the VM carries
 * the last sample its node took, and this is those, one each.
 */
export function useStatsSamples(stats?: VmStats | null): StatsSample[] {
  const [kept, setKept] = useState<{at?: string; samples: StatsSample[]}>(() =>
    hasStats(stats)
      ? {at: stats.sampled_at, samples: [sampleOf(stats)]}
      : {samples: []},
  );

  // a new sample is kept as it is rendered, rather than an effect later, so
  // nothing is ever drawn without it.
  if (hasStats(stats) && stats.sampled_at !== kept.at) {
    const next = {
      at: stats.sampled_at,
      samples: appendSample(kept.samples, sampleOf(stats)),
    };
    setKept(next);

    return next.samples;
  }

  return kept.samples;
}
