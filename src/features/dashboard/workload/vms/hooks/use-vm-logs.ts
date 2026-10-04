"use client";

import {useEffect, useRef, useState} from "react";
import {type Scope} from "../api";
import {getVmLogs} from "../client";
import {latestAt, mergeLogLines} from "../lib/logs";
import {type VmLogLine} from "../types";

/** How often a VM's logs are read for what it has written since. */
export const LOGS_POLL_MS = 3_000;

/** How much of what it wrote before the page was opened is shown. */
export const FIRST_TAIL = 500;

/**
 * A VM's logs, read again every few seconds for what was written since the
 * last line read. The lines are kept while the page is, so reading stops and
 * picks up where it was whenever the tab showing them does.
 */
export function useVmLogs({
  scope,
  uuid,
  enabled = true,
}: {
  scope: Scope;
  uuid: string;
  enabled?: boolean;
}): {lines: VmLogLine[]; failed: boolean; truncated: boolean} {
  const [lines, setLines] = useState<VmLogLine[]>([]);
  const [failed, setFailed] = useState(false);
  const [truncated, setTruncated] = useState(false);

  // where the next read picks up from, kept apart from the reads so that
  // starting them again does not read everything again.
  const since = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let stopped = false;
    let next: ReturnType<typeof setTimeout> | undefined;

    const read = async () => {
      try {
        const first = since.current === undefined;
        const answer = await getVmLogs(
          scope,
          uuid,
          first ? {tail: FIRST_TAIL} : {since: since.current},
        );
        if (stopped) {
          return;
        }

        const items = answer.items ?? [];
        since.current = latestAt(items, since.current);
        setLines((shown) => mergeLogLines(shown, items));
        setFailed(false);

        // only the first read can leave out what came before the page.
        if (first) {
          setTruncated(Boolean(answer.truncated));
        }
      } catch {
        if (stopped) {
          return;
        }

        setFailed(true);
      }

      next = setTimeout(read, LOGS_POLL_MS);
    };

    void read();

    return () => {
      stopped = true;
      clearTimeout(next);
    };
  }, [scope, uuid, enabled]);

  return {lines, failed, truncated};
}
