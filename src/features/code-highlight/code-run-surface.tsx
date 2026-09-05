"use client";

import {useEffect} from "react";
import {RunPanel, RunPreview, type OpenPanel} from "./run-workspace";
import {useCodeRun} from "./use-code-run";
import classes from "./run-workspace.module.css";

type Props = {
  runtime: string;
  code: string;
  ports: number[];
  terminal: boolean;
  logs: boolean;

  /** Bumped by whoever owns this surface to run the snippet again. */
  runToken: number;

  open: OpenPanel;
  onOpen: (panel: OpenPanel) => void;
  onRunningChange?: (running: boolean) => void;
};

/**
 * What a snippet has to show, wherever it is being shown.
 *
 * The page draws this under the code a reader is reading; the editor draws the
 * same thing in the panel an author is writing it in, so what an author sets up
 * is what a reader gets, seen the same way.
 */
export function CodeRunSurface({
  runtime,
  code,
  ports,
  terminal,
  logs: showLogs,
  runToken,
  open,
  onOpen,
  onRunningChange,
}: Props) {
  const {run, running, output, logs, start} = useCodeRun();

  useEffect(() => {
    if (runToken > 0) {
      void start({runtime, code, ports, terminal});
    }
    // the token is what says "run it": the snippet itself is read when it does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken]);

  useEffect(() => {
    onRunningChange?.(running);
  }, [running, onRunningChange]);

  const live = ports.length > 0 || terminal;
  const showPreview = live && (running || Boolean(run.state));
  const showOutput = !live && Boolean(output);

  // nothing has been run yet: the panel keeps its own size until there is.
  if (!showPreview && !showOutput) {
    return null;
  }

  return (
    <div className={classes.surface}>
      {showPreview && (
        <RunPreview
          run={run}
          running={running}
          open={open}
          onOpen={onOpen}
          showTerminal={terminal}
          showLogs={showLogs}
        />
      )}

      {showOutput && <pre className={classes.text}>{output}</pre>}

      {live && (
        <RunPanel
          run={run}
          open={open}
          logs={logs}
          output={output}
          running={running}
        />
      )}
    </div>
  );
}
