"use client";

import {useEffect, useRef, useState} from "react";
import JsCookie from "js-cookie";
import {Alert, Box} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";
import {useTranslations} from "@/i18n/provider";
import {attachURL, BEARER_PROTOCOL} from "./attach";
import classes from "./task-terminal.module.css";
import "@xterm/xterm/css/xterm.css";

type Props = {
  taskUuid: string;
  running: boolean;

  /**
   * Whether this terminal carries who is asking. The dashboard's is opened on
   * somebody's own task and carries their token; the one a snippet offers is
   * opened on the task that snippet is running in and carries nothing --
   * knowing that task is what stands for permission there, and the node
   * holding it is what decides.
   */
  authenticated?: boolean;

  /**
   * How tall to draw it. A page that gives a snippet a corner of itself asks
   * for a few lines; the dashboard, which has a page to spare, takes what the
   * box gives it.
   */
  height?: string;
};

/**
 * A shell inside a running task.
 *
 * It is opened straight on the runner's ingress rather than over the websocket
 * the dashboard already holds: the ingress works out which node is holding the
 * task and carries the connection there, so a shell's bytes never pass through
 * what serves the blog. The connection is the session -- what the command
 * writes arrives as binary, what is typed goes back the same way, and a
 * terminal that has been resized says so as text.
 */
export function TaskTerminal({
  taskUuid,
  running,
  authenticated = true,
  height,
}: Props) {
  const t = useTranslations();

  const mount = useRef<HTMLDivElement>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!running || mount.current === null) return;

    const token = authenticated
      ? JsCookie.get(ACCESS_TOKEN_COOKIE_NAME)
      : undefined;

    if (authenticated && !token) return;

    const url = attachURL(taskUuid);
    if (!url) return;

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

        // a browser cannot put a header on a websocket, so the token is
        // offered as a subprotocol; a terminal that carries nobody offers
        // none, which is what an anonymous caller looks like.
        const socket = new WebSocket(
          url,
          token ? [BEARER_PROTOCOL, token] : undefined,
        );
        socket.binaryType = "arraybuffer";

        if (disposed) {
          socket.close();
          terminal.dispose();
          return;
        }

        socket.onmessage = (event) => {
          if (typeof event.data === "string") return;

          terminal.write(new Uint8Array(event.data as ArrayBuffer));
        };

        socket.onclose = () => {
          setEnded(true);
          terminal.write(
            `\r\n\x1b[90m${t("tasks.detail.terminalEnded")}\x1b[0m\r\n`,
          );
        };

        socket.onerror = () => {
          setEnded(true);
          terminal.write(
            `\r\n\x1b[90m${t("tasks.detail.terminalLost")}\x1b[0m\r\n`,
          );
        };

        const encoder = new TextEncoder();
        const typed = terminal.onData((data) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(encoder.encode(data));
          }
        });

        // the command draws to the size of the window it is shown in, so it is
        // told whenever that changes.
        let drawnTo = {rows: 0, cols: 0};

        const resize = () => {
          fit.fit();

          if (
            terminal.rows === drawnTo.rows &&
            terminal.cols === drawnTo.cols
          ) {
            return;
          }

          drawnTo = {rows: terminal.rows, cols: terminal.cols};

          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "resize",
                rows: terminal.rows,
                cols: terminal.cols,
              }),
            );
          }
        };

        socket.onopen = () => {
          setEnded(false);
          resize();
        };

        // the terminal is drawn in a tab, and a tab that is not showing has no
        // size to fit to. Watching the box is what catches it being shown, as
        // well as the window being resized.
        const box = new ResizeObserver(() => resize());
        box.observe(mount.current);

        cleanup = () => {
          box.disconnect();
          typed.dispose();
          socket.onclose = null;
          socket.close();
          terminal.dispose();
        };
      },
    );

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [taskUuid, running, authenticated, t]);

  if (!running) {
    return (
      <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
        {t("tasks.detail.notRunning")}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        ref={mount}
        aria-label={t("tasks.detail.terminal")}
        className={classes.shell}
        style={{opacity: ended ? 0.7 : 1, height}}
      />
    </Box>
  );
}
