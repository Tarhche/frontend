"use client";

import {useCallback, useRef, useState} from "react";
import {decode} from "js-base64";
import {useWsPublish} from "@/hooks/use-ws-publish";
import {useWsStream} from "@/hooks/use-ws-stream";
import {CODE_STOP_SUBJECT, RUN_CODE_SUBJECT} from "./subjects";
import {type Run} from "./run-workspace";

type Snippet = {
  runtime: string;
  code: string;
  ports: number[];
  terminal: boolean;
};

/**
 * Running a snippet, however it is being shown.
 *
 * One that only prints something is asked once and answered once. One that
 * serves a port, or that offers a way in, is followed instead: what it is
 * doing and where it can be reached arrive over and over until the container
 * ends, and the last of them carries what it printed.
 */
export function useCodeRun() {
  const publish = useWsPublish();
  const openStream = useWsStream();

  // the stream this run is being watched over, so that stopping a snippet
  // stops listening to it: what a container that is gone has left to say is
  // not what the page should be showing.
  const watching = useRef<{close: () => void} | null>(null);

  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState("");
  const [run, setRun] = useState<Run>({});

  const forget = useCallback(() => {
    watching.current?.close();
    watching.current = null;
  }, []);

  const clear = useCallback(() => {
    setOutput("");
    setLogs("");
    setRun({});
  }, []);

  // stopping a snippet is taking its container away: what is running now goes,
  // and running it again is a new container running the code as it is then.
  const stop = useCallback(async () => {
    const container = run.container_uuid;

    forget();
    setRunning(false);

    if (!container) {
      return;
    }

    await publish(CODE_STOP_SUBJECT, {container_uuid: container});
  }, [forget, publish, run.container_uuid]);

  const start = useCallback(
    async ({runtime, code, ports, terminal}: Snippet) => {
      if (code.trim().length === 0) {
        setOutput("");

        return;
      }

      forget();
      setRunning(true);
      clear();

      const live = ports.length > 0 || terminal;

      try {
        if (!live) {
          const answer = await publish<
            {runner: string; code: string},
            {logs?: string; error?: string} | undefined
          >(RUN_CODE_SUBJECT, {runner: runtime, code});

          setOutput(answer?.error ?? (answer?.logs ? decode(answer.logs) : ""));
          setRun({state: "completed"});

          return;
        }

        watching.current = await openStream(
          RUN_CODE_SUBJECT,
          {runner: runtime, code, ports, terminal},
          {
            onChunk: (payload) => {
              if (!payload) return;

              const answer = JSON.parse(decode(payload)) as Run;
              setRun(answer);
              setLogs(answer.logs ? decode(answer.logs) : "");
            },
            onEnd: (payload) => {
              setRunning(false);

              if (!payload) {
                setRun((current) => ({...current, endpoints: []}));

                return;
              }

              const answer = JSON.parse(decode(payload)) as Run & {
                error?: string;
              };

              setRun({...answer, endpoints: []});
              setLogs(answer.logs ? decode(answer.logs) : "");
              setOutput(
                answer.error ?? (answer.logs ? decode(answer.logs) : ""),
              );
            },
            onError: () => setRunning(false),
          },
        );
      } finally {
        if (!live) {
          setRunning(false);
        }
      }
    },
    [clear, forget, openStream, publish],
  );

  return {run, running, output, logs, start, stop, clear};
}
