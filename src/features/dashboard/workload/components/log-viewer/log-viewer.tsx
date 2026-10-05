"use client";

import {useEffect, useRef, useState} from "react";
import clsx from "clsx";
import {Group, Loader, Stack, Switch, Text} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {formatTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {
  LOG_TAIL,
  type LogsRead,
  useFollowedLogs,
} from "../../hooks/use-followed-logs";
import {type LogLine} from "../../lib/logs";
import {ProblemAlert} from "../problem-alert";
import classes from "./log-viewer.module.css";

type Props<L extends LogLine> = {
  /** names what is read; a viewer of another log is a new one. */
  source: string;
  read: LogsRead<L>;

  /** what the log is called, to whoever cannot see it. */
  label: string;

  /** where a line came from: a VM's part of itself, a container's stream. */
  tagOf?: (line: L) => string;

  /** whether a line was written as an error, which it is shown as. */
  isError?: (line: L) => boolean;
};

// how close to the end of the log counts as being at it.
const AT_END = 24;

/**
 * A log, from its last lines on, followed for as long as following is on.
 * Scrolling up to read something stops following it; scrolling back down to
 * the end, or turning following on again, picks it up where it was.
 *
 * A line's time is told the same way whatever the page's language: it is read
 * beside what was written, which is in neither.
 */
export function LogViewer<L extends LogLine>({
  source,
  read,
  label,
  tagOf,
  isError,
}: Props<L>) {
  const t = useTranslations();
  const [following, setFollowing] = useState(true);
  const [withTimes, setWithTimes] = useState(true);
  const {lines, problem, loading, skipped} = useFollowedLogs(
    source,
    read,
    following,
  );

  // the log scrolls within its own box, so following it does not drag the
  // page along with it.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = box.current;
    if (following && element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [lines, following]);

  const scrolled = () => {
    const element = box.current;
    if (!element) {
      return;
    }

    const atEnd =
      element.scrollHeight - element.scrollTop - element.clientHeight < AT_END;
    if (atEnd !== following) {
      setFollowing(atEnd);
    }
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {t("workload.logs.help", {tail: LOG_TAIL})}
        </Text>
        <Group gap="md">
          <Switch
            label={t("workload.logs.times")}
            checked={withTimes}
            onChange={(event) => setWithTimes(event.currentTarget.checked)}
          />
          <Switch
            label={t("workload.logs.follow")}
            checked={following}
            onChange={(event) => setFollowing(event.currentTarget.checked)}
          />
        </Group>
      </Group>

      {problem && (
        <ProblemAlert problem={problem} title={t("workload.logs.failed")} />
      )}

      {skipped && (
        <Text size="xs" c="dimmed">
          {t("workload.logs.skipped")}
        </Text>
      )}

      {/* a log is read, not announced: new lines arrive every few seconds. */}
      <div
        ref={box}
        className={classes.logs}
        onScroll={scrolled}
        role="log"
        aria-live="off"
        aria-label={label}
        tabIndex={0}
      >
        {loading && lines.length === 0 ? (
          <Loader size="sm" />
        ) : lines.length === 0 ? (
          !problem && (
            <Text size="sm" c="dimmed">
              {t("workload.logs.empty")}
            </Text>
          )
        ) : (
          lines.map((line, index) => {
            const tag = tagOf?.(line);

            return (
              <div
                key={`${line.at}-${index}`}
                className={clsx(classes.line, isError?.(line) && classes.error)}
              >
                {withTimes && (
                  <time className={classes.at} dateTime={line.at}>
                    {formatTime(line.at, "en")}
                  </time>
                )}
                {tag && <span className={classes.tag}>{tag}</span>}
                <span>{line.line}</span>
              </div>
            );
          })
        )}
      </div>
    </Stack>
  );
}
