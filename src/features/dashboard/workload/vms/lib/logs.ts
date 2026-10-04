import {type VmLogLine} from "../types";

/** How many lines a page keeps of a VM's logs. Older ones fall off the top. */
export const MAX_LOG_LINES = 5_000;

function keyOf(line: VmLogLine): string {
  return `${line.at}\u0000${line.source}\u0000${line.line}`;
}

function timeOf(line: VmLogLine): number {
  return Date.parse(line.at);
}

/**
 * The lines shown, with what a read since the last of them brought.
 *
 * A read since a moment takes that moment in, so the lines written at it come
 * again; those are kept once. Everything later is new.
 */
export function mergeLogLines(
  shown: readonly VmLogLine[],
  read: readonly VmLogLine[],
  max = MAX_LOG_LINES,
): VmLogLine[] {
  if (read.length === 0) {
    return shown as VmLogLine[];
  }

  const last = shown[shown.length - 1];
  const lastTime = last ? timeOf(last) : Number.NEGATIVE_INFINITY;
  const atLast = new Set(
    shown.filter((line) => timeOf(line) === lastTime).map(keyOf),
  );

  const fresh = read.filter((line) => {
    const time = timeOf(line);
    if (Number.isNaN(time) || time > lastTime) {
      return true;
    }

    return time === lastTime && !atLast.has(keyOf(line));
  });

  if (fresh.length === 0) {
    return shown as VmLogLine[];
  }

  return [...shown, ...fresh].slice(-max);
}

/** Where the next read picks up from: the latest moment read so far. */
export function latestAt(
  lines: readonly VmLogLine[],
  since?: string,
): string | undefined {
  let latest = since;
  let latestTime = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;

  for (const line of lines) {
    const time = Date.parse(line.at);
    if (!Number.isNaN(time) && time > latestTime) {
      latest = line.at;
      latestTime = time;
    }
  }

  return latest;
}
