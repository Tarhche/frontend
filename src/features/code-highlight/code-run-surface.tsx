"use client";

import {useEffect, useRef} from "react";
import {createPortal} from "react-dom";
import {RunPanel, RunPreview, type OpenPanel} from "./run-workspace";
import {useCodeRun} from "./use-code-run";
import classes from "./run-workspace.module.css";

type Props = {
  /** The two boxes of the snippet's own card this is drawn into. */
  hosts: {preview: HTMLElement; panel: HTMLElement};

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
  onRunningChange?: (running: boolean) => void;
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
  onRunningChange,
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
  const showPreview = live && running;
  const showOutput = !live && Boolean(output);

  // nothing has been run yet: the panel keeps its own size until there is.
  if (!showPreview && !showOutput) {
    return null;
  }

  return (
    <>
      {showPreview &&
        createPortal(
          <RunPreview
            run={run}
            running={running}
            open={open}
            onOpen={onOpen}
            showTerminal={terminal}
            showLogs={showLogs}
          />,
          hosts.preview,
        )}

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

      {showOutput &&
        createPortal(<pre className={classes.text}>{output}</pre>, hosts.panel)}
    </>
  );
}
