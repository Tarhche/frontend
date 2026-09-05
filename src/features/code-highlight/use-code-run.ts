"use client";

import {useCallback, useState} from "react";
import {decode} from "js-base64";
import {useWsPublish} from "@/hooks/use-ws-publish";
import {useWsStream} from "@/hooks/use-ws-stream";
import {RUN_CODE_SUBJECT} from "./subjects";
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

  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState("");
  const [run, setRun] = useState<Run>({});

  const clear = useCallback(() => {
    setOutput("");
    setLogs("");
    setRun({});
  }, []);

  const start = useCallback(
    async ({runtime, code, ports, terminal}: Snippet) => {
      if (code.trim().length === 0) {
        setOutput("");

        return;
      }

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

        await openStream(
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
    [clear, openStream, publish],
  );

  return {run, running, output, logs, start, clear};
}
