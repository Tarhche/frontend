"use client";

import {useEffect, useState} from "react";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {
  problemOf,
  type Problem,
} from "@/features/dashboard/workload/lib/problem";
import {fetchContainerStats} from "../api";
import {type ContainerStats} from "../types";

/** How often a container's usage is sampled while it is being looked at. */
export const STATS_EVERY = 5_000;

/** How many samples are kept for the trend: five minutes of them. */
export const MAX_SAMPLES = 60;

/**
 * The samples so far, with one more. A node that had nothing newer to say
 * answers with the sample it gave last time, which is not a second sample.
 */
export function keepSample(
  samples: ContainerStats[],
  sample: ContainerStats,
  max = MAX_SAMPLES,
): ContainerStats[] {
  const last = samples[samples.length - 1];
  if (last && sample.sampled_at && last.sampled_at === sample.sampled_at) {
    return samples;
  }

  const next = [...samples, sample];

  return next.length > max ? next.slice(next.length - max) : next;
}

function secondsOf(sample: ContainerStats): number {
  return Date.parse(sample.sampled_at) / 1000;
}

/**
 * How fast a counter grew between consecutive samples, per second. A counter
 * that went backwards was reset — the container restarted — and is read as
 * having grown by nothing rather than by a negative amount.
 */
export function ratesOf(
  samples: ContainerStats[],
  counter: (sample: ContainerStats) => number,
): number[] {
  const rates: number[] = [];

  for (let index = 1; index < samples.length; index++) {
    const elapsed = secondsOf(samples[index]) - secondsOf(samples[index - 1]);
    const seconds =
      Number.isFinite(elapsed) && elapsed > 0 ? elapsed : STATS_EVERY / 1000;
    const grown = counter(samples[index]) - counter(samples[index - 1]);

    rates.push(Math.max(0, grown) / seconds);
  }

  return rates;
}

/**
 * A container's usage, sampled every few seconds for as long as `enabled`
 * says so. The samples are kept while the page is open, for the trend; they
 * are not kept anywhere else.
 */
export function useContainerStats(
  scope: Scope,
  vmUuid: string,
  id: string,
  enabled: boolean,
) {
  const [samples, setSamples] = useState<ContainerStats[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let waiting: ReturnType<typeof setTimeout> | undefined;

    const sample = async () => {
      try {
        const taken = await fetchContainerStats(scope, vmUuid, id);
        if (cancelled) {
          return;
        }

        setSamples((current) => keepSample(current, taken));
        setProblem(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setProblem(problemOf(error));
      }

      setLoading(false);
      waiting = setTimeout(sample, STATS_EVERY);
    };

    void sample();

    return () => {
      cancelled = true;
      clearTimeout(waiting);
    };
  }, [scope, vmUuid, id, enabled]);

  return {samples, problem, loading};
}
