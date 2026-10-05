"use client";

import {useEffect, useRef, useState} from "react";
import {Box, Code, Group, Loader, Stack, Switch, Text} from "@mantine/core";
import {useI18n} from "@/i18n/provider";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {formatTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {LOG_TAIL, useContainerLogs} from "../../hooks/use-container-logs";
import {ProblemAlert} from "../problem-alert";

type Props = {
  scope: Scope;
  vmUuid: string;
  id: string;
};

/**
 * What a container has written, from the last lines on, followed for as long
 * as following is on. A stopped container still has what it wrote, so this
 * works for one that is not running too.
 */
export function ContainerLogs({scope, vmUuid, id}: Props) {
  const {t, locale} = useI18n();
  const [following, setFollowing] = useState(true);
  const [withTimes, setWithTimes] = useState(false);
  const {lines, problem, loading, truncated} = useContainerLogs(
    scope,
    vmUuid,
    id,
    following,
  );

  // the log scrolls within its own box, so following it does not drag the
  // page along with it.
  const box = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (following && box.current) {
      box.current.scrollTop = box.current.scrollHeight;
    }
  }, [lines, following]);

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {t("containers.logs.help", {tail: LOG_TAIL})}
        </Text>
        <Group gap="md">
          <Switch
            label={t("containers.logs.times")}
            checked={withTimes}
            onChange={(event) => setWithTimes(event.currentTarget.checked)}
          />
          <Switch
            label={t("containers.logs.follow")}
            checked={following}
            onChange={(event) => setFollowing(event.currentTarget.checked)}
          />
        </Group>
      </Group>

      {problem && (
        <ProblemAlert problem={problem} title={t("containers.logs.failed")} />
      )}

      {truncated && (
        <Text size="xs" c="dimmed">
          {t("containers.logs.truncated")}
        </Text>
      )}

      {/* a log is read, not announced: new lines arrive every few seconds. */}
      <Code
        ref={box}
        block
        dir="ltr"
        role="log"
        aria-live="off"
        aria-label={t("containers.logs.label")}
        tabIndex={0}
        style={{maxHeight: "60vh", overflowY: "auto", whiteSpace: "pre-wrap"}}
      >
        {loading && lines.length === 0 ? (
          <Loader size="sm" />
        ) : lines.length === 0 ? (
          <Text c="dimmed" size="sm">
            {t("containers.logs.empty")}
          </Text>
        ) : (
          lines.map((line, index) => (
            <Box
              key={`${line.at}-${index}`}
              c={line.stream === "stderr" ? "red" : undefined}
            >
              {withTimes && (
                <Text span c="dimmed" size="xs" me="xs">
                  {formatTime(line.at, locale)}
                </Text>
              )}
              {line.line}
            </Box>
          ))
        )}
      </Code>
    </Stack>
  );
}
