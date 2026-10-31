/**
 * One line of what something wrote: when, and the line. Whatever else a line
 * carries -- where in a VM it came from, which of a container's streams --
 * tells two lines written at the same moment apart.
 */
export type LogLine = {
  at: string;
  line: string;
};

/** How many lines a page keeps of a log. Older ones fall off the top. */
export const MAX_LOG_LINES = 5_000;

type Instant = {seconds: number; nanos: number};

/**
 * A moment as a log line carries it, to the nanosecond. The API writes them as
 * RFC 3339 with as many fraction digits as there are, so two of them cannot be
 * compared as text: "…:01Z" sorts after "…:01.5Z".
 */
function instantOf(at: string): Instant {
  const match = /^(.*?)(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})$/.exec(at);
  const seconds = Date.parse(match ? `${match[1]}${match[3]}` : at) / 1000;
  const nanos = Number((match?.[2] ?? "").padEnd(9, "0").slice(0, 9));

  return {seconds, nanos};
}

/** Orders two moments; ones that will not parse are ordered as they read. */
export function compareInstants(a: string, b: string): number {
  const left = instantOf(a);
  const right = instantOf(b);

  if (Number.isNaN(left.seconds) || Number.isNaN(right.seconds)) {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  return left.seconds - right.seconds || left.nanos - right.nanos;
}

// a line as itself: when it was written, and everything it says.
function keyOf(line: LogLine): string {
  const {seconds, nanos} = instantOf(line.at);
  const rest = Object.entries(line)
    .filter(([field]) => field !== "at")
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([, value]) => String(value));

  return [`${seconds}.${nanos}`, ...rest].join("\u0000");
}

/**
 * The lines shown so far, with what has just arrived after them.
 *
 * Asking for what was written since the last line shown hands that line back,
 * along with anything else written at the same moment: those are dropped, and
 * so is anything older, so that following a log never shows a line twice.
 */
export function mergeLogLines<L extends LogLine>(
  shown: L[],
  read: L[],
  max = MAX_LOG_LINES,
): L[] {
  if (read.length === 0) {
    return shown;
  }

  let fresh = read;
  const last = shown[shown.length - 1];

  if (last) {
    const boundary = new Set<string>();
    for (let index = shown.length - 1; index >= 0; index--) {
      if (compareInstants(shown[index].at, last.at) !== 0) {
        break;
      }

      boundary.add(keyOf(shown[index]));
    }

    fresh = read.filter((line) => {
      const order = compareInstants(line.at, last.at);

      return order > 0 || (order === 0 && !boundary.has(keyOf(line)));
    });
  }

  if (fresh.length === 0) {
    return shown;
  }

  const merged = shown.concat(fresh);

  return merged.length > max ? merged.slice(merged.length - max) : merged;
}

/** Where the next read picks up from: the latest moment read so far. */
export function latestAt(
  lines: readonly LogLine[],
  since?: string,
): string | undefined {
  let latest = since;

  for (const line of lines) {
    if (latest === undefined || compareInstants(line.at, latest) > 0) {
      latest = line.at;
    }
  }

  return latest;
}
