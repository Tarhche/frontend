"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {decode} from "js-base64";
import JsCookie from "js-cookie";
import {Box, Code, Group, Switch, Text} from "@mantine/core";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";
import {useTranslations} from "@/i18n/provider";
import {useWsStream} from "@/hooks/use-ws-stream";
import {FOLLOW_LOGS_SUBJECT} from "./subjects";

type Line = {
  stream: string;
  content: string;
  at: string;
};

type Props = {
  containerUuid: string;

  /**
   * What the container had already written when the page was rendered. The
   * stream picks up from the last of these, so nothing is shown twice and
   * nothing is missed in between.
   */
  history: Line[];
};

/**
 * A container's output, from its first line onward. The lines are kept against
 * the container until it is deleted, so a stopped container still has all of
 * its history here.
 */
export function ContainerLogs({containerUuid, history}: Props) {
  const t = useTranslations();
  const openStream = useWsStream();

  const [lines, setLines] = useState<Line[]>(history);

  // where the stream has to pick up from, kept outside the effect so that
  // opening it again does not replay what is already shown.
  const caughtUpTo = useRef<string | undefined>(
    history.length > 0 ? history[history.length - 1].at : undefined,
  );
  const [following, setFollowing] = useState(true);
  const bottom = useRef<HTMLDivElement>(null);

  const append = useCallback((payload: string | null) => {
    if (!payload) return;

    try {
      const line = JSON.parse(decode(payload)) as Line;
      caughtUpTo.current = line.at;

      setLines((current) => [...current, line]);
    } catch {
      // a line that will not parse is one line lost, not a reason to drop the
      // stream carrying the rest.
    }
  }, []);

  useEffect(() => {
    if (!following) return;

    const token = JsCookie.get(ACCESS_TOKEN_COOKIE_NAME);
    if (!token) return;

    let closed = false;
    let close: (() => void) | undefined;

    // read when the stream is opened, and again if it has to be opened on a
    // new connection: either way it picks up from the last line shown.
    const request = () => ({
      container_uuid: containerUuid,
      access_token: token,
      after: caughtUpTo.current,
    });

    openStream(FOLLOW_LOGS_SUBJECT, request, {onChunk: append}).then(
      (stream) => {
        // the switch may have been turned off while the socket was opening.
        if (closed) {
          stream.close();
          return;
        }

        close = () => stream.close();
      },
    );

    return () => {
      closed = true;
      close?.();
    };
  }, [containerUuid, following, openStream, append]);

  useEffect(() => {
    if (following) {
      bottom.current?.scrollIntoView({block: "end"});
    }
  }, [lines, following]);

  return (
    <Box>
      <Group justify="flex-end" mb="xs">
        <Switch
          label={t("containers.detail.follow")}
          checked={following}
          onChange={(event) => setFollowing(event.currentTarget.checked)}
        />
      </Group>
      <Code
        block
        style={{maxHeight: "60vh", overflowY: "auto", whiteSpace: "pre-wrap"}}
      >
        {lines.length === 0 ? (
          <Text c="dimmed">{t("containers.detail.noLogs")}</Text>
        ) : (
          lines.map((line, index) => (
            <div
              key={`${line.at}-${index}`}
              style={{color: line.stream === "stderr" ? "#e03131" : undefined}}
            >
              {line.content}
            </div>
          ))
        )}
        <div ref={bottom} />
      </Code>
    </Box>
  );
}
