"use client";

import {useState, useCallback, useEffect, useRef} from "react";
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
import {
  currentScheme,
  mountCodeMirror,
  watchScheme,
  type MountedCode,
  type Scheme,
} from "./codemirror";
import {SplitHandle} from "./split-handle";
import {useCodeRun} from "./use-code-run";
import classes from "./run-workspace.module.css";
import {useTranslations} from "@/i18n/provider";
import "./code-highlight.css";

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
  const editorRef = useRef<MountedCode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // which of the two boxes under the snippet the reader has open.
  const [open, setOpen] = useState<OpenPanel>(null);
  const [editableCode, setEditableCode] = useState(code);
  const [colorScheme, setColorScheme] = useState<Scheme>("light");
  const [mounted, setMounted] = useState(false);

  const isRunnable = Boolean(executable?.value);
  const ports = portsOf(executable?.ports);
  const hasTerminal = enabled(executable?.terminal);
  const hasLogs = enabled(executable?.logs);

  // a snippet that serves something, or that can be opened, is watched while it
  // runs rather than waited on for what it prints.
  const isLive = isRunnable && (ports.length > 0 || hasTerminal);
  // Editing the snippet only makes sense when there is a runtime to re-run it with,
  // and only when the author enabled it for this block.
  const isEditable = isRunnable && enabled(executable?.editable);

  useEffect(() => {
    setMounted(true);
    setColorScheme(currentScheme());

    return watchScheme(setColorScheme);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const editor = mountCodeMirror(containerRef.current, {
      code,
      language,
      editable: isEditable,
      scheme: colorScheme,
      onChange: setEditableCode,
    });

    editorRef.current = editor;
    setEditableCode(code);

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // the theme and the language are changed on the editor rather than by
    // building another one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isEditable, mounted]);

  useEffect(() => {
    editorRef.current?.setScheme(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    editorRef.current?.setLanguage(language);
  }, [language]);

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
              editorRef.current?.setCode(code);
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
            onOpen={setOpen}
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
