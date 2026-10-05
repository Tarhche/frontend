import {isGregorianStartDateTime} from "@/lib/date-and-time";
import {type VmStats} from "../types";

/**
 * Reading a VM's stats: what share of each thing it is using, how worried to
 * be about that, and the samples a page keeps while it is open.
 */

/** How much of something a share of it is, from 0 to 100. */
export function percentOf(used: number, total: number): number {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return clampPercent((used / total) * 100);
}

/**
 * A percentage that fits a bar. CPU is a share of the VM's own vCPUs, so it
 * should not pass 100; if a node ever says otherwise, the bar is full rather
 * than drawn off its end.
 */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.min(100, value);
}

/** "12.5%": one decimal under ten, where it still says something. */
export function formatPercent(value: number, locale = "en"): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;

  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: safe < 10 ? 1 : 0,
  }).format(safe / 100);
}

/** How worried a use of something is worth being. */
export type Severity = "normal" | "warning" | "critical";

export function severityOf(percent: number): Severity {
  if (percent >= 90) {
    return "critical";
  }

  if (percent >= 70) {
    return "warning";
  }

  return "normal";
}

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

/** How many samples a page keeps: five minutes of them, at one every 5 s. */
export const MAX_SAMPLES = 60;

/**
 * The samples with one more, when it is one more. A VM is read every few
 * seconds but sampled only as often as its node beats, so the same sample
 * arrives more than once and is kept once.
 */
export function appendSample(
  samples: readonly StatsSample[],
  sample: StatsSample,
  max = MAX_SAMPLES,
): StatsSample[] {
  const last = samples[samples.length - 1];
  if (last && last.at === sample.at) {
    return samples as StatsSample[];
  }

  return [...samples, sample].slice(-max);
}
