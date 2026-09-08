"use client";

import {useEffect, useRef} from "react";
import {createPortal} from "react-dom";
import {
  RunOutput,
  RunPanel,
  RunPreview,
  RunTools,
  showsBrowser,
  type OpenPanel,
} from "./run-workspace";
import {useCodeRun} from "./use-code-run";
import classes from "./run-workspace.module.css";

type Props = {
  /** The boxes of the snippet's own card this is drawn into. */
  hosts: {preview: HTMLElement; panel: HTMLElement; tools: HTMLElement};

  runtime: string;
  code: string;
  ports: number[];
  terminal: boolean;
  logs: boolean;

  /** Bumped by whoever owns this surface to run the snippet again. */
  runToken: number;

  /** Bumped to take away the container it is running in. */
  stopToken?: number;

  open: OpenPanel;
  onOpen: (panel: OpenPanel) => void;

  /** Whether what the snippet serves is being looked at. */
  browser: boolean;
  onBrowser: (shown: boolean) => void;

  onRunningChange?: (running: boolean) => void;

  /** Says whether the card has a browser beside the code to make room for. */
  onPreviewChange?: (shown: boolean) => void;
};

/**
 * What a snippet an author is writing has to show.
 *
 * It is drawn into the snippet's own card — the browser beside the code, and a
 * log or a shell along its floor — which is where a reader is shown the same
 * thing, so what an author sets up is what a reader gets.
 */
export function CodeRunSurface({
  hosts,
  runtime,
  code,
  ports,
  terminal,
  logs: showLogs,
  runToken,
  stopToken = 0,
  open,
  onOpen,
  browser,
  onBrowser,
  onRunningChange,
  onPreviewChange,
}: Props) {
  const {run, running, output, logs, start, stop} = useCodeRun();

  // A token is asked for once, however many times react runs the effect that
  // watches it — in development it runs every one of them twice, and a snippet
  // run twice is two containers, both reporting into the one surface.
  const asked = useRef({run: 0, stop: 0});

  useEffect(() => {
    if (runToken > 0 && asked.current.run !== runToken) {
      asked.current.run = runToken;
      void start({runtime, code, ports, terminal});
    }
    // the token is what says "run it": the snippet itself is read when it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken]);

  useEffect(() => {
    if (stopToken > 0 && asked.current.stop !== stopToken) {
      asked.current.stop = stopToken;
      void stop();
    }
    // the token is what says "stop it": which container that is, is read when
    // it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopToken]);

  useEffect(() => {
    onRunningChange?.(running);
  }, [running, onRunningChange]);

  const live = ports.length > 0 || terminal;

  const showPreview = showsBrowser({running, ports, browser});
  const showOutput = !live && Boolean(output);

  useEffect(() => {
    onPreviewChange?.(showPreview);
  }, [showPreview, onPreviewChange]);

  return (
    <>
      {live &&
        running &&
        createPortal(
          <RunTools
            run={run}
            hasBrowser={ports.length > 0}
            showTerminal={terminal}
            showLogs={showLogs}
            browser={browser}
            onBrowser={onBrowser}
            open={open}
            onOpen={onOpen}
          />,
          hosts.tools,
        )}

      {showPreview && createPortal(<RunPreview run={run} />, hosts.preview)}

      {live &&
        createPortal(
          <RunPanel
            run={run}
            open={open}
            onOpen={onOpen}
            logs={logs}
            output={output}
            running={running}
          />,
          hosts.panel,
        )}

      {showOutput && createPortal(<RunOutput output={output} />, hosts.panel)}
    </>
  );
}
