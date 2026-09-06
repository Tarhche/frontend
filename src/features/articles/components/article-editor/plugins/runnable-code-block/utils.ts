import {type Editor, type ModelElement} from "ckeditor5";

/** The model element a code block is, which the editor draws as an editor. */
export const SNIPPET = "codeSnippet";

/**
 * Model attribute holding what is written in a snippet. It is not called
 * "code": that is the name of the inline code style, whose converter would
 * wrap the whole snippet in a `<code>` of its own.
 */
export const CODE_ATTRIBUTE = "source";
/** Model attribute holding the language it is written in. */
export const LANGUAGE_ATTRIBUTE = "language";
/** Model attribute holding the runtime a snippet is executed with. */
export const RUNTIME_MODEL_ATTRIBUTE = "executable";
/** Model attribute marking a runnable snippet as editable by the reader. */
export const EDITABLE_MODEL_ATTRIBUTE = "executableEditable";
/** Model attribute holding the ports the snippet serves on, comma separated. */
export const PORTS_MODEL_ATTRIBUTE = "executablePorts";
/** Model attribute marking a runnable snippet as open to a terminal. */
export const TERMINAL_MODEL_ATTRIBUTE = "executableTerminal";
/** Model attribute marking a runnable snippet as showing its logs. */
export const LOGS_MODEL_ATTRIBUTE = "executableLogs";

/** Data attributes the runtime ones are written to, on the `<code>` element. */
export const RUNTIME_DATA_ATTRIBUTE = "data-executable";
export const EDITABLE_DATA_ATTRIBUTE = "data-executable-editable";
export const PORTS_DATA_ATTRIBUTE = "data-executable-ports";
export const TERMINAL_DATA_ATTRIBUTE = "data-executable-terminal";
export const LOGS_DATA_ATTRIBUTE = "data-executable-logs";

export const INSERT_COMMAND = "insertCodeSnippet";
export const LANGUAGE_COMMAND = "codeSnippetLanguage";
export const RUNTIME_COMMAND = "codeBlockRuntime";
export const EDITABLE_COMMAND = "codeBlockEditable";
export const PORTS_COMMAND = "codeBlockPorts";
export const TERMINAL_COMMAND = "codeBlockTerminal";
export const LOGS_COMMAND = "codeBlockLogs";

/** What a block with no language of its own is written in. */
export const PLAIN_LANGUAGE = "plaintext";

/**
 * The ports a snippet serves on, as they are written down: a list of numbers,
 * however the author separated them. What is not a port is left out rather
 * than argued about, and a port written twice is one port.
 */
export function parsePorts(value: string | null | undefined): number[] {
  if (!value) {
    return [];
  }

  const ports = value
    .split(/[\s,]+/)
    .map((piece) => Number.parseInt(piece, 10))
    .filter((port) => Number.isInteger(port) && port > 0 && port < 65536);

  return Array.from(new Set(ports));
}

/** Reads the value a dropdown item was defined with. */
export function dropdownItemValue(source: unknown): string | null {
  return (source as {_value?: string | null})?._value ?? null;
}

// Which snippet somebody is working on. A snippet holds an editor of its own,
// so while they are writing in one the caret is inside that rather than in the
// document's selection — which is why the selection alone cannot say.
const active = new WeakMap<Editor, ModelElement | null>();

export function setActiveSnippet(
  editor: Editor,
  snippet: ModelElement | null,
): void {
  active.set(editor, snippet);
}

/**
 * The snippet being worked on: the one selected, or the one whose own editor
 * somebody is writing in. One that has since been taken out of the document
 * counts for nothing.
 */
export function findSnippet(editor: Editor): ModelElement | undefined {
  const selected = editor.model.document.selection.getSelectedElement();

  if (selected?.is("element", SNIPPET)) {
    return selected;
  }

  const remembered = active.get(editor);

  if (remembered?.is("element", SNIPPET) && remembered.root.rootName) {
    return remembered;
  }

  return undefined;
}

/** What is written in a snippet. */
export function snippetCode(snippet: ModelElement): string {
  const code = snippet.getAttribute(CODE_ATTRIBUTE);

  return typeof code === "string" ? code : "";
}

/** The language a snippet is written in, if it says. */
export function snippetLanguage(snippet: ModelElement): string | undefined {
  const language = snippet.getAttribute(LANGUAGE_ATTRIBUTE);

  return typeof language === "string" && language ? language : undefined;
}

/** The runtime a snippet is run with, if it has one. */
export function snippetRuntime(snippet: ModelElement): string | undefined {
  const runtime = snippet.getAttribute(RUNTIME_MODEL_ATTRIBUTE);

  return typeof runtime === "string" && runtime ? runtime : undefined;
}
