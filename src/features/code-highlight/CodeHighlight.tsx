'use client'
import React, { useState, useCallback } from "react";
import {
  CodeHighlight as MantineCodeHighlight,
  CodeHighlightControl,
} from "@mantine/code-highlight";
import { IconPlayerPlay, IconLoader2 } from "@tabler/icons-react";
import {Box, Paper, ScrollArea, Text} from "@mantine/core";
import {PUBLIC_BACKEND_URL} from "@/constants";
import {notifications} from "@mantine/notifications";
import { encode, decode } from 'js-base64';
import './code-highlight.css';

const b64 = {
  enc: (input: string) => {
    const cleaned = input
      .replace(/\u00A0/g, ' ')
      .replace(/\r\n/g, '\n');

    return encode(cleaned);
  },
  dec: (str: string) => {
    return decode(str);
  },
};

function CodeHighlight({ code, language, executable }) {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const runCode = useCallback(() => {
    if (running) return;

    setRunning(true);
    setOutput("");

    const id = crypto.randomUUID();
    const payload = {
      id,
      subject: "runCode",
      payload: {
        runner: executable.value,
        code,
      },
    };

    const socket = new WebSocket(
      `${PUBLIC_BACKEND_URL!.startsWith("https:") ? "wss" : "ws"}://${PUBLIC_BACKEND_URL!.replace('https://', '').replace('http://', '')}/api/ws`
    );

    socket.addEventListener("open", () => {
      console.log('ws sending: ', payload);
      socket.send(JSON.stringify({
        ...payload,
        payload: b64.enc(JSON.stringify(payload.payload)),
      }));
    });

    socket.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        msg.Payload = JSON.parse(b64.dec(msg.Payload));
        msg.Payload.logs = b64.dec(msg.Payload.logs);
        console.log('ws received', msg);
        if (msg.RequestID === id) {
          setOutput(msg.Payload?.logs ?? "<no output>");
          socket.close(1000, "done");
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
        socket.close();
        notifications.show({
          title: "خطای غیرمنتظره",
          message: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
          color: "red",
        });
      } finally {
        setRunning(false);
      }
    });

    socket.addEventListener("error", (err) => {
      console.error("WebSocket error", err);
      setOutput(`WebSocket error: ${err}`);
      setRunning(false);
    });
  }, [code, running, executable]);

  return (
    <Box
      mb="xl"
    >
      <MantineCodeHighlight
        mt="sm"
        mb="xs"
        code={code}
        language={language}
        copyLabel="کپی کردن"
        copiedLabel="کپی شد!"
        controls={!executable ? [] : [
          <CodeHighlightControl
            component="button"
            key="run"
            tooltipLabel={running ? "در حال اجرا…" : "اجرا"}
            disabled={running}
            onClick={runCode}
          >
            {running ? (
              <IconLoader2 style={{ animation: "code-highlight-spin 1s linear infinite" }} />
            ) : (
              <IconPlayerPlay />
            )}
          </CodeHighlightControl>,
        ]}
        styles={{
          code: {
            fontSize: 14,
          },
        }}
      />

      {output && (
        <Paper radius="sm" p="md" withBorder>
          <Text fw={700} mb="xs">
            خروجی برنامه:
          </Text>
          <ScrollArea type="always" mah={260}>
            <MantineCodeHighlight code={output} language="" withCopyButton={false} />
          </ScrollArea>
        </Paper>
      )}
    </Box>
  );
}

export default CodeHighlight;
