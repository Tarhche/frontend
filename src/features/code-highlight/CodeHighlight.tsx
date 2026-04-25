"use client";

import {useState, useCallback, useEffect, useRef} from "react";
import {EditorView, keymap, lineNumbers, drawSelection} from "@codemirror/view";
import {EditorState, Compartment} from "@codemirror/state";
import {LanguageDescription, indentOnInput} from "@codemirror/language";
import {defaultKeymap, history, historyKeymap, indentWithTab} from "@codemirror/commands";
import {languages} from "@codemirror/language-data";
import {monokai} from "@uiw/codemirror-theme-monokai";
import {eclipseInit} from "@uiw/codemirror-theme-eclipse";
import {IconPlayerPlay, IconLoader2, IconRotate, IconCopy} from "@tabler/icons-react";
import {ActionIcon, Box, Paper, ScrollArea, Text, Tooltip} from "@mantine/core";
import {
  CodeHighlight as MantineCodeHighlight,
  CodeHighlightControl,
} from "@mantine/code-highlight";
import {PUBLIC_BACKEND_URL} from "@/constants";
import {notifications} from "@mantine/notifications";
import {encode, decode} from "js-base64";
import "./code-highlight.css";

const b64 = {
  enc: (input: string) => {
    const cleaned = input.replace(/ /g, " ").replace(/\r\n/g, "\n");
    return encode(cleaned);
  },
  dec: (str: string) => decode(str),
};

const themeCompartment = new Compartment();

const eclipse = eclipseInit({settings: {caret: "#000000"}});

const editorSetup = [
  lineNumbers(),
  history(),
  drawSelection(),
  indentOnInput(),
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
];

function CodeHighlight({code, language, executable}) {
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [editableCode, setEditableCode] = useState(code);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const languageCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    setMounted(true);
    const getScheme = () =>
      (document.documentElement.getAttribute("data-mantine-color-scheme") ??
        "light") as "light" | "dark";
    setColorScheme(getScheme());
    const observer = new MutationObserver(() => setColorScheme(getScheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mantine-color-scheme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const updateHeight = (editor: EditorView) => {
      if (containerRef.current) {
        containerRef.current.style.height = editor.contentDOM.scrollHeight + 'px';
      }
    };

    const initialState = EditorState.create({
      doc: code,
      extensions: [
        ...editorSetup,
        languageCompartmentRef.current.of([]),
        themeCompartment.of(colorScheme === "dark" ? monokai : eclipse),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setEditableCode(update.state.doc.toString());
          }
          updateHeight(editor);
        }),
      ],
    });

    const editor = new EditorView({
      state: initialState,
      parent: containerRef.current,
    });

    updateHeight(editor);
    editorRef.current = editor;

    return () => {
      editor.destroy();
    };
  }, [code, colorScheme, mounted]);

  useEffect(() => {
    // try to find the language description based on the provided language name
    const description = LanguageDescription.matchLanguageName(
      languages,
      language ?? "",
      true,
    );
    if (!description) {
      if (editorRef.current) {
        editorRef.current.dispatch({
          effects: languageCompartmentRef.current.reconfigure([]), // fallback to plain text if language not found
        });
      }
      return;
    }

    let cancelled = false;
    description.load().then((support) => {
      if (cancelled || !editorRef.current) return;
      editorRef.current.dispatch({
        effects: languageCompartmentRef.current.reconfigure(support),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [language, code, colorScheme]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.dispatch({
      effects: themeCompartment.reconfigure(colorScheme === "dark" ? monokai : eclipse),
    });
  }, [colorScheme]);

  const hasChanged = editableCode !== code;

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
        code: editableCode,
      },
    };

    const socket = new WebSocket(
      `${PUBLIC_BACKEND_URL!.startsWith("https:") ? "wss" : "ws"}://${PUBLIC_BACKEND_URL!.replace("https://", "").replace("http://", "")}/api/ws`,
    );

    socket.addEventListener("open", () => {
      console.log("ws sending: ", payload);
      socket.send(
        JSON.stringify({
          ...payload,
          payload: b64.enc(JSON.stringify(payload.payload)),
        }),
      );
    });

    socket.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        msg.payload = JSON.parse(b64.dec(msg.payload));
        msg.payload.logs = b64.dec(msg.payload.logs);
        console.log("ws received", msg);
        if (msg.request_id === id) {
          setOutput(msg.payload?.logs ?? "<no output>");
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
  }, [editableCode, running, executable]);

  return (
    <Box mb="xl">
      {mounted ? (
        <Box mt="sm" mb="xs" style={{position: "relative", overflow: "hidden"}}>
          <div
            ref={containerRef}
            style={{height: "auto"}}
          />

          {/* Action buttons */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
              display: "flex",
              gap: 4,
            }}
          >
            <Tooltip label={editableCode ? (editableCode.length > 0 ? "کپی شد!" : "کپی کردن") : "کپی کردن"} position="left">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(editableCode);
                  notifications.show({
                    title: "موفق",
                    message: "کد کپی شد",
                    color: "green",
                    autoClose: 2000,
                  });
                }}
              >
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>

            {hasChanged && (
              <Tooltip label="بازنشانی کد" position="left">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.dispatch({
                        changes: {
                          from: 0,
                          to: editorRef.current.state.doc.length,
                          insert: code,
                        },
                      });
                    }
                    setEditableCode(code);
                  }}
                >
                  <IconRotate size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {executable && (
              <Tooltip label={running ? "در حال اجرا…" : "اجرا"} position="left">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  disabled={running}
                  onClick={runCode}
                >
                  {running ? (
                    <IconLoader2
                      size={16}
                      style={{animation: "code-highlight-spin 1s linear infinite"}}
                    />
                  ) : (
                    <IconPlayerPlay size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            )}
          </div>
        </Box>
      ) : (
        <MantineCodeHighlight
          mt="sm"
          mb="xs"
          code={code}
          language={language}
          copyLabel="کپی کردن"
          copiedLabel="کپی شد!"
          controls={
            !executable
              ? []
              : [
                  <CodeHighlightControl
                    component="button"
                    key="run"
                    tooltipLabel={running ? "در حال اجرا…" : "اجرا"}
                    disabled={running}
                    onClick={runCode}
                  >
                    {running ? (
                      <IconLoader2
                        style={{
                          animation: "code-highlight-spin 1s linear infinite",
                        }}
                      />
                    ) : (
                      <IconPlayerPlay />
                    )}
                  </CodeHighlightControl>,
                ]
          }
          styles={{code: {fontSize: 14}}}
        />
      )}

      {output && (
        <Paper radius="sm" p="md" withBorder>
          <Text fw={700} mb="xs">
            خروجی برنامه:
          </Text>
          <ScrollArea dir="ltr" type="always" mah={260}>
            <pre>{output}</pre>
          </ScrollArea>
        </Paper>
      )}
    </Box>
  );
}

export default CodeHighlight;
