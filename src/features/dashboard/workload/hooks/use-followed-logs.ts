"use client";

import {useEffect, useEffectEvent, useRef, useState} from "react";
import {latestAt, type LogLine, mergeLogLines} from "../lib/logs";
import {type Problem, problemOf} from "../lib/problem";

/** How much of what was written before the log was opened is shown. */
export const LOG_TAIL = 500;

/** How often what was written since is read, while the log is followed. */
export const LOGS_POLL_MS = 3_000;

/** What a read of a log is answered with. */
export type LogsAnswer<L extends LogLine> = {
  items: L[];

  /**
   * Set when more was written since the last read than one answer carries:
   * what came in between was left out. Only a read since a moment can be, as
   * the first one asks for the last lines and no more.
   */
  truncated?: boolean;
};

/** How a log is read: its last lines, or whatever was written since. */
export type LogsRead<L extends LogLine> = (
  params: {tail: number} | {since: string},
) => Promise<LogsAnswer<L>>;

/**
 * A log, followed for as long as `following` says so.
 *
 * It opens on the last lines written, then asks every few seconds for whatever
 * was written since the last line read. Stopping and starting the follow picks
 * up from there, so nothing written in between is missed -- unless more was
 * written than one answer carries, which `skipped` says. The lines are kept
 * while the page is, so a tab that is hidden and shown again carries on.
 *
 * `source` names what is read; a viewer of another log is a new one.
 */
export function useFollowedLogs<L extends LogLine>(
  source: string,
  read: LogsRead<L>,
  following: boolean,
) {
  const [lines, setLines] = useState<L[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState(false);

  // where the log has been read up to, kept apart from what is shown so that
  // asking again does not depend on the page having drawn it yet.
  const since = useRef<string | undefined>(undefined);
  const readLog = useEffectEvent(read);

  useEffect(() => {
    if (!following) {
      return;
    }

    let stopped = false;
    let next: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const from = since.current;

      try {
        const answer = await readLog(
          from === undefined ? {tail: LOG_TAIL} : {since: from},
        );
        if (stopped) {
          return;
        }

        const items = answer.items ?? [];
        since.current = latestAt(items, since.current);
        setLines((shown) => mergeLogLines(shown, items));
        if (from !== undefined && answer.truncated) {
          setSkipped(true);
        }
        setProblem(null);
      } catch (error) {
        if (stopped) {
          return;
        }

        setProblem(problemOf(error));
      }

      setLoading(false);
      next = setTimeout(poll, LOGS_POLL_MS);
    };

    void poll();

    return () => {
      stopped = true;
      clearTimeout(next);
    };
  }, [source, following]);

  return {lines, problem, loading, skipped};
}
