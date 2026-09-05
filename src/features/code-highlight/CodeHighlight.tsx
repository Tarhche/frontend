"use client";

import {useState, useCallback, useEffect, useRef} from "react";
import {EditorView, keymap, lineNumbers, drawSelection} from "@codemirror/view";
import {EditorState, Compartment} from "@codemirror/state";
import {LanguageDescription, indentOnInput} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {languages} from "@codemirror/language-data";
import {monokai} from "@uiw/codemirror-theme-monokai";
import {eclipseInit} from "@uiw/codemirror-theme-eclipse";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconLoader2,
  IconRotate,
  IconCopy,
} from "@tabler/icons-react";
import {ActionIcon, Box, Tooltip} from "@mantine/core";
import {CodeHighlight as MantineCodeHighlight} from "@mantine/code-highlight";
import {notifications} from "@mantine/notifications";
import {
  RunPanel,
  RunPreview,
  fileNameFor,
  type OpenPanel,
} from "./run-workspace";
import {SplitHandle} from "./split-handle";
import {useCodeRun} from "./use-code-run";
import classes from "./run-workspace.module.css";
import {useTranslations} from "@/i18n/provider";
import "./code-highlight.css";

const themeCompartment = new Compartment();

const eclipse = eclipseInit({settings: {caret: "#000000"}});

const editorSetup = [
  lineNumbers(),
  history(),
  drawSelection(),
  indentOnInput(),
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
];

type Executable = {
  /** The runtime the snippet is executed with, e.g. `go-1.24`. */
  value: string;
  /** Set by the editor when readers are allowed to change the code before running it. */
  editable?: string | boolean;

  /** The ports the snippet serves on, as the author wrote them: "8080,3000". */
  ports?: string;
  /** Set by the editor when readers may open a terminal in the running snippet. */
  terminal?: string | boolean;
  /** Set by the editor when readers see what the running snippet writes. */
  logs?: string | boolean;
} | null;

/** Whether an attribute the editor wrote down says yes. */
function enabled(value: string | boolean | undefined): boolean {
  return value === true || value === "true";
}

/** The ports the author wrote down, as ports. */
function portsOf(value: string | undefined): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\s,]+/)
    .map((piece) => Number.parseInt(piece, 10))
    .filter((port) => Number.isInteger(port) && port > 0 && port < 65536);
}

type Props = {
  code: string;
  language?: string;
  executable?: Executable;
};

function CodeHighlight({code, language, executable}: Props) {
  const t = useTranslations();
  const editorRef = useRef<EditorView | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // which of the two boxes under the snippet the reader has open.
  const [open, setOpen] = useState<OpenPanel>(null);
  const [editableCode, setEditableCode] = useState(code);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const languageCompartmentRef = useRef(new Compartment());

  const isRunnable = Boolean(executable?.value);
  const ports = portsOf(executable?.ports);
  const hasTerminal = enabled(executable?.terminal);
  const hasLogs = enabled(executable?.logs);

  // a snippet that serves something, or that can be opened, is watched while it
  // runs rather than waited on for what it prints.
  const isLive = isRunnable && (ports.length > 0 || hasTerminal);
  // Editing the snippet only makes sense when there is a runtime to re-run it with,
  // and only when the author enabled it for this block.
  const isEditable =
    isRunnable &&
    (executable?.editable === true || executable?.editable === "true");

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
        containerRef.current.style.height =
          editor.contentDOM.scrollHeight + "px";
      }
    };

    const initialState = EditorState.create({
      doc: code,
      extensions: [
        ...editorSetup,
        languageCompartmentRef.current.of([]),
        themeCompartment.of(colorScheme === "dark" ? monokai : eclipse),
        EditorState.readOnly.of(!isEditable),
        EditorView.editable.of(isEditable),
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
  }, [code, colorScheme, isEditable, mounted]);

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
      effects: themeCompartment.reconfigure(
        colorScheme === "dark" ? monokai : eclipse,
      ),
    });
  }, [colorScheme]);

  const hasChanged = editableCode !== code;

  const {run, running, output, logs, start, stop} = useCodeRun();

  const runCode = useCallback(() => {
    if (running || !executable?.value) return;

    void start({
      runtime: executable.value,
      code: editableCode,
      ports,
      terminal: hasTerminal,
    });
  }, [editableCode, executable, hasTerminal, ports, running, start]);

  // the browser is there for as long as there is a container behind it: one
  // that has stopped has nothing left to show.
  const showPreview = isLive && running;

  const actions = (
    <div className={classes.paneActions}>
      <Tooltip label={t("editor.copy")} position="left">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(editableCode);
            notifications.show({
              title: t("editor.success"),
              message: t("editor.codeCopied"),
              color: "green",
              autoClose: 2000,
            });
          }}
        >
          <IconCopy size={16} />
        </ActionIcon>
      </Tooltip>

      {isEditable && hasChanged && (
        <Tooltip label={t("editor.resetCode")} position="left">
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

      {isRunnable && (
        <Tooltip
          label={running ? t("editor.stop") : t("editor.run")}
          position="left"
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={running ? () => void stop() : runCode}
          >
            {running ? (
              isLive ? (
                <IconPlayerStop size={16} />
              ) : (
                <IconLoader2
                  size={16}
                  style={{animation: "code-highlight-spin 1s linear infinite"}}
                />
              )
            ) : (
              <IconPlayerPlay size={16} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </div>
  );

  return (
    <Box my="xl">
      <div className={classes.surface}>
        <div
          className={`${classes.workspace} ${showPreview ? classes.split : ""}`}
        >
          <div className={classes.pane}>
            <div className={classes.paneBar}>
              <span className={classes.fileName}>{fileNameFor(language)}</span>
              {actions}
            </div>

            <div className={classes.code}>
              {mounted ? (
                <div ref={containerRef} style={{height: "auto"}} />
              ) : (
                <MantineCodeHighlight
                  code={code}
                  language={language}
                  copyLabel={t("editor.copy")}
                  copiedLabel={t("editor.copied")}
                  withCopyButton={false}
                  styles={{code: {fontSize: 14}}}
                />
              )}
            </div>
          </div>

          {showPreview && <SplitHandle label={t("editor.resize")} />}

          {showPreview && (
            <div className={`${classes.pane} ${classes.previewPane}`}>
              <RunPreview
                run={run}
                running={running}
                open={open}
                onOpen={setOpen}
                showTerminal={hasTerminal}
                showLogs={hasLogs}
              />
            </div>
          )}
        </div>

        {isLive ? (
          <RunPanel
            run={run}
            open={open}
            logs={logs}
            output={output}
            running={running}
          />
        ) : (
          output && (
            <div className={classes.panel}>
              <div className={classes.panelBar}>
                <span>{t("editor.programOutput")}</span>
              </div>
              <pre className={classes.text}>{output}</pre>
            </div>
          )
        )}
      </div>
    </Box>
  );
}

export default CodeHighlight;
