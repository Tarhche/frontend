"use client";

import {useEffect, useState} from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconFileText,
  IconRefresh,
  IconTerminal2,
} from "@tabler/icons-react";
import {ContainerTerminal} from "@/features/dashboard/runner/components/container-terminal";
import {useTranslations} from "@/i18n/provider";
import {CODE_TERMINAL_INPUT_SUBJECT, CODE_TERMINAL_SUBJECT} from "./subjects";
import classes from "./run-workspace.module.css";

/** What the runner has said about a snippet that is being watched. */
export type Run = {
  state?: string;
  endpoints?: Array<{container_port: number; url: string}>;
  container_uuid?: string;
  logs?: string;
};

/** Which of the two boxes under the snippet is open, if either. */
export type OpenPanel = "terminal" | "logs" | null;

/** A cube that turns while there is nothing to show yet. */
export function Waiting({label}: {label: string}) {
  return (
    <div className={classes.waiting}>
      <div className={classes.cube}>
        <span className={classes.face} />
        <span className={classes.face} />
        <span className={classes.face} />
      </div>
      <span>{label}</span>
    </div>
  );
}

type PreviewProps = {
  run: Run;
  running: boolean;
  open: OpenPanel;
  onOpen: (panel: OpenPanel) => void;
  showTerminal: boolean;
  showLogs: boolean;
};

/**
 * What a snippet serves, in a browser of its own.
 *
 * The bar says where it is and, when it serves more than one port, which of
 * them is being looked at. Until there is something to look at the frame holds
 * a cube and what the runner last said, so a reader watching a container start
 * is watching something.
 */
export function RunPreview({
  run,
  running,
  open,
  onOpen,
  showTerminal,
  showLogs,
}: PreviewProps) {
  const t = useTranslations();

  const alive = run.state === "running";
  const addresses = alive ? (run.endpoints ?? []) : [];
  const [port, setPort] = useState<number | null>(null);
  const [reloads, setReloads] = useState(0);

  const address =
    addresses.find((one) => one.container_port === port) ?? addresses[0];

  // a container that has gone takes its terminal with it: what was being looked
  // at goes back to nothing rather than to a shell on nothing.
  useEffect(() => {
    if (open === "terminal" && !alive) {
      onOpen(null);
    }
  }, [open, alive, onOpen]);

  return (
    <div className={classes.browser}>
      <div className={classes.chrome}>
        <button type="button" className={classes.icon} disabled aria-hidden>
          <IconArrowLeft size={14} />
        </button>
        <button type="button" className={classes.icon} disabled aria-hidden>
          <IconArrowRight size={14} />
        </button>
        <button
          type="button"
          className={classes.icon}
          disabled={!address}
          aria-label={t("editor.reload")}
          onClick={() => setReloads((count) => count + 1)}
        >
          <IconRefresh size={14} />
        </button>

        <span className={classes.address}>
          <span className={classes.addressText}>
            {address ? address.url.replace(/^https?:\/\//, "") : "/"}
          </span>
        </span>

        {addresses.length > 1 && (
          <span className={classes.ports}>
            {addresses.map((one) => (
              <button
                type="button"
                key={one.container_port}
                className={`${classes.port} ${
                  one === address ? classes.portActive : ""
                }`}
                onClick={() => setPort(one.container_port)}
              >
                {one.container_port}
              </button>
            ))}
          </span>
        )}
      </div>

      <div className={classes.viewport}>
        {address ? (
          <iframe
            key={`${address.url}:${reloads}`}
            className={classes.frame}
            src={address.url}
            title={address.url}
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
        ) : (
          <Waiting
            label={
              running || run.state
                ? (run.state ?? t("editor.running"))
                : t("editor.noOutput")
            }
          />
        )}

        <div className={classes.tools}>
          {showLogs && (
            <button
              type="button"
              className={`${classes.tool} ${
                open === "logs" ? classes.toolActive : ""
              }`}
              aria-label={t("editor.tabs.logs")}
              aria-pressed={open === "logs"}
              onClick={() => onOpen(open === "logs" ? null : "logs")}
            >
              <IconFileText size={16} />
            </button>
          )}

          {showTerminal && (
            <button
              type="button"
              className={`${classes.tool} ${
                open === "terminal" ? classes.toolActive : ""
              }`}
              disabled={!alive || !run.container_uuid}
              aria-label={t("editor.tabs.terminal")}
              aria-pressed={open === "terminal"}
              onClick={() => onOpen(open === "terminal" ? null : "terminal")}
            >
              <IconTerminal2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type PanelProps = {
  run: Run;
  open: OpenPanel;
  logs: string;
  output: string;
  running: boolean;
};

/**
 * The box the two buttons open: what the container is writing, or a shell
 * inside it. What the snippet printed is shown here as well, since that is
 * what a snippet without a port has to say.
 */
export function RunPanel({run, open, logs, output, running}: PanelProps) {
  const t = useTranslations();

  const alive = run.state === "running";
  const title =
    open === "terminal" ? t("editor.tabs.terminal") : t("editor.tabs.logs");
  const body = open === "logs" ? logs : output;

  if (!open) {
    return null;
  }

  return (
    <div className={classes.panel}>
      <div className={classes.panelBar}>
        <span>{title}</span>

        {(running || run.state) && (
          <span className={classes.status}>
            <span className={classes.cube} style={{width: 12, height: 12}}>
              <span className={classes.face} />
              <span className={classes.face} />
              <span className={classes.face} />
            </span>
            {run.state ?? t("editor.running")}
          </span>
        )}
      </div>

      {open === "terminal" && alive && run.container_uuid ? (
        <ContainerTerminal
          containerUuid={run.container_uuid}
          running
          authenticated={false}
          subjects={{
            attach: CODE_TERMINAL_SUBJECT,
            input: CODE_TERMINAL_INPUT_SUBJECT,
          }}
        />
      ) : (
        <pre className={`${classes.text} ${body ? "" : classes.empty}`}>
          {body || t("editor.noOutput")}
        </pre>
      )}
    </div>
  );
}
