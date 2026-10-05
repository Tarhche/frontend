"use client";

import {useEffect, useRef, useState} from "react";
import {Box, Group, Switch, Text} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {type Scope} from "../../api";
import {useVmLogs} from "../../hooks/use-vm-logs";
import classes from "./vm-logs.module.css";

// a log line's time, to the second, the same way whatever the page's
// language: it is read beside what the VM wrote, which is in neither.
function clock(at: string): string {
  const date = new Date(at);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("en-GB", {hour12: false});
}

/**
 * What a VM has written -- its kernel, its runtime, and whatever runs in it --
 * read again every few seconds for what is new. Scrolling up to read something
 * stops following the end; scrolling back down picks it up again.
 */
export function VmLogs({scope, uuid}: {scope: Scope; uuid: string}) {
  const t = useTranslations();
  const {lines, failed, truncated} = useVmLogs({scope, uuid});
  const [following, setFollowing] = useState(true);
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
      element.scrollHeight - element.scrollTop - element.clientHeight < 24;
    if (atEnd !== following) {
      setFollowing(atEnd);
    }
  };

  let status = t("vms.logs.polling");
  if (failed) {
    status = t("vms.logs.failed");
  } else if (truncated) {
    status = t("vms.logs.truncated");
  }

  return (
    <Box>
      <Group justify="space-between" mb="xs">
        <Text size="xs" c={failed ? "red" : "dimmed"}>
          {status}
        </Text>
        <Switch
          label={t("vms.logs.follow")}
          checked={following}
          onChange={(event) => setFollowing(event.currentTarget.checked)}
        />
      </Group>
      <div
        ref={box}
        className={classes.logs}
        onScroll={scrolled}
        aria-label={t("vms.detail.logs")}
        role="log"
      >
        {lines.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t("vms.logs.empty")}
          </Text>
        ) : (
          lines.map((line, index) => (
            <div key={`${line.at}-${index}`} className={classes.line}>
              <time className={classes.at} dateTime={line.at}>
                {clock(line.at)}
              </time>
              <span className={classes.source}>{line.source}</span>
              <span>{line.line}</span>
            </div>
          ))
        )}
      </div>
    </Box>
  );
}
