"use client";

import {useEffect, useRef, useState} from "react";
import {toUint8Array, fromUint8Array} from "js-base64";
import JsCookie from "js-cookie";
import {Alert, Box, Text} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";
import {useTranslations} from "@/i18n/provider";
import {useWsStream} from "@/hooks/use-ws-stream";
import {ATTACH_SUBJECT, ATTACH_INPUT_SUBJECT} from "./subjects";
import "@xterm/xterm/css/xterm.css";

type Props = {
  containerUuid: string;
  running: boolean;
};

/**
 * A shell inside a running container.
 *
 * One request opens it and its reply is the command's output, chunk by chunk;
 * what is typed goes back on a second subject naming that same stream, so the
 * whole session travels over the one websocket the page already has.
 */
export function ContainerTerminal({containerUuid, running}: Props) {
  const t = useTranslations();
  const openStream = useWsStream();

  const mount = useRef<HTMLDivElement>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!running || mount.current === null) return;

    const token = JsCookie.get(ACCESS_TOKEN_COOKIE_NAME);
    if (!token) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    // xterm touches the DOM on import, so it is loaded only once there is a
    // terminal to draw into.
    Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(
      async ([{Terminal}, {FitAddon}]) => {
        if (disposed || mount.current === null) return;

        const terminal = new Terminal({
          convertEol: true,
          cursorBlink: true,
          fontFamily: "var(--mantine-font-family-monospace), monospace",
          fontSize: 13,
        });

        const fit = new FitAddon();
        terminal.loadAddon(fit);
        terminal.open(mount.current);
        fit.fit();

        const stream = await openStream(
          ATTACH_SUBJECT,
          {container_uuid: containerUuid, access_token: token},
          {
            onChunk: (payload) => {
              if (payload) terminal.write(toUint8Array(payload));
            },
            onEnd: () => {
              setEnded(true);
              terminal.write(
                `\r\n\x1b[90m${t("containers.detail.terminalEnded")}\x1b[0m\r\n`,
              );
            },
          },
        );

        if (disposed) {
          stream.close();
          terminal.dispose();
          return;
        }

        const encoder = new TextEncoder();
        const typed = terminal.onData((data) => {
          stream.send(ATTACH_INPUT_SUBJECT, {
            data: fromUint8Array(encoder.encode(data)),
          });
        });

        // the command draws to the size of the window it is shown in, so it is
        // told whenever that changes.
        const resize = () => {
          fit.fit();
          stream.send(ATTACH_INPUT_SUBJECT, {
            type: "resize",
            rows: terminal.rows,
            cols: terminal.cols,
          });
        };

        resize();
        window.addEventListener("resize", resize);

        cleanup = () => {
          window.removeEventListener("resize", resize);
          typed.dispose();
          stream.close();
          terminal.dispose();
        };
      },
    );

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [containerUuid, running, openStream, t]);

  if (!running) {
    return (
      <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
        {t("containers.detail.notRunning")}
      </Alert>
    );
  }

  return (
    <Box>
      <Text size="sm" c="dimmed" mb="xs">
        {t("containers.detail.terminalHint")}
      </Text>
      <Box
        ref={mount}
        aria-label={t("containers.detail.terminal")}
        style={{
          height: "60vh",
          backgroundColor: "#000",
          padding: "var(--mantine-spacing-xs)",
          borderRadius: "var(--mantine-radius-sm)",
          opacity: ended ? 0.7 : 1,
        }}
      />
    </Box>
  );
}
