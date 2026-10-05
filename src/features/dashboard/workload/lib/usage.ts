/**
 * Reading what something is using, a VM or a container alike: what share of
 * something it is, how worried to be about that, how fast a counter is going,
 * and the samples a page keeps while it is open.
 */

/** How much of something a share of it is, from 0 to 100. */
export function percentOf(used: number, total: number): number {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return clampPercent((used / total) * 100);
}

/**
 * A percentage that fits a bar. CPU is a share of the CPUs there are, so it
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

/** How many samples a page keeps: five minutes of them, at one every 5 s. */
export const MAX_SAMPLES = 60;

/**
 * The samples with one more, when it is one more. What is sampled is read more
 * often than it is sampled -- a VM is read every few seconds, but sampled only
 * as often as its node beats -- so the same sample arrives more than once, and
 * is kept once.
 */
export function appendSample<T>(
  samples: readonly T[],
  sample: T,
  atOf: (sample: T) => string,
  max = MAX_SAMPLES,
): T[] {
  const last = samples[samples.length - 1];
  if (last !== undefined && atOf(last) === atOf(sample)) {
    return samples as T[];
  }

  return [...samples, sample].slice(-max);
}

/**
 * How fast a counter grew between consecutive samples, per second. A counter
 * that went backwards was reset -- what it counts restarted -- and is read as
 * having grown by nothing rather than by a negative amount. Samples whose
 * moments say nothing are taken to be `every` seconds apart.
 */
export function ratesOf<T>(
  samples: readonly T[],
  counter: (sample: T) => number,
  atOf: (sample: T) => string,
  every = 5,
): number[] {
  const rates: number[] = [];

  for (let index = 1; index < samples.length; index++) {
    const elapsed =
      (Date.parse(atOf(samples[index])) -
        Date.parse(atOf(samples[index - 1]))) /
      1000;
    const seconds = Number.isFinite(elapsed) && elapsed > 0 ? elapsed : every;
    const grown = counter(samples[index]) - counter(samples[index - 1]);

    rates.push(Math.max(0, grown) / seconds);
  }

  return rates;
}
