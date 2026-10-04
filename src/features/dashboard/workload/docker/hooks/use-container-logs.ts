"use client";

import {useEffect, useRef, useState} from "react";
import {fetchContainerLogs} from "../api";
import {problemOf, type Problem} from "../errors";
import {type LogLine, type Scope} from "../types";

/** How much of a container's output is asked for when the log is opened. */
export const LOG_TAIL = 500;

/** How much of it is kept on the page: the oldest go first. */
export const MAX_LINES = 5_000;

const EVERY = 2_000;

type Instant = {seconds: number; nanos: number; raw: string};

/**
 * A moment as a log line carries it, to the nanosecond. The API writes them as
 * RFC 3339 with as many fraction digits as there are, so two of them cannot be
 * compared as text: "…:01Z" sorts after "…:01.5Z".
 */
function instantOf(at: string): Instant {
  const match = /^(.*?)(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})$/.exec(at);
  const seconds = Date.parse(match ? `${match[1]}${match[3]}` : at) / 1000;
  const nanos = Number((match?.[2] ?? "").padEnd(9, "0").slice(0, 9));

  return {seconds, nanos, raw: at};
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

function lineKey(line: LogLine): string {
  const {seconds, nanos} = instantOf(line.at);

  return `${seconds}.${nanos}\u0000${line.stream}\u0000${line.line}`;
}

/**
 * The lines shown so far, with what has just arrived after them.
 *
 * Asking for what was written since the last line shown hands that line back,
 * along with anything else written at the same moment: those are dropped, and
 * so is anything older, so that following a log never shows a line twice.
 */
export function mergeLogLines(
  current: LogLine[],
  incoming: LogLine[],
  max = MAX_LINES,
): LogLine[] {
  if (incoming.length === 0) {
    return current;
  }

  let fresh = incoming;
  const last = current[current.length - 1];

  if (last) {
    const boundary = new Set<string>();
    for (let index = current.length - 1; index >= 0; index--) {
      if (compareInstants(current[index].at, last.at) !== 0) {
        break;
      }

      boundary.add(lineKey(current[index]));
    }

    fresh = incoming.filter((line) => {
      const order = compareInstants(line.at, last.at);

      return order > 0 || (order === 0 && !boundary.has(lineKey(line)));
    });
  }

  if (fresh.length === 0) {
    return current;
  }

  const merged = current.concat(fresh);

  return merged.length > max ? merged.slice(merged.length - max) : merged;
}

/** The later of where a log was and the last of what just arrived. */
function caughtUp(since: string | undefined, incoming: LogLine[]) {
  const last = incoming[incoming.length - 1]?.at;

  if (!last) {
    return since;
  }

  return since === undefined || compareInstants(last, since) > 0 ? last : since;
}

/**
 * A container's output, followed for as long as `following` says so.
 *
 * It opens on the last lines written and then asks, every couple of seconds,
 * for whatever was written since the last one shown. Stopping and starting the
 * follow picks up from there, so nothing written in between is missed.
 */
export function useContainerLogs(
  scope: Scope,
  vmUuid: string,
  id: string,
  following: boolean,
) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);

  // where the log has been read up to, kept apart from what is shown so that
  // asking again does not depend on the page having drawn it yet.
  const since = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!following) {
      return;
    }

    let cancelled = false;
    let waiting: ReturnType<typeof setTimeout> | undefined;

    const read = async () => {
      try {
        const batch = await fetchContainerLogs(scope, vmUuid, id, {
          since: since.current,
          tail: LOG_TAIL,
        });
        if (cancelled) {
          return;
        }

        since.current = caughtUp(since.current, batch.items);
        setLines((current) => mergeLogLines(current, batch.items));
        setTruncated((was) => was || Boolean(batch.truncated));
        setProblem(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setProblem(problemOf(error));
      }

      setLoading(false);
      waiting = setTimeout(read, EVERY);
    };

    void read();

    return () => {
      cancelled = true;
      clearTimeout(waiting);
    };
  }, [scope, vmUuid, id, following]);

  return {lines, problem, loading, truncated};
}
