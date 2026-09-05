import {type Editor, type ModelElement} from "ckeditor5";

/** Model attribute holding the runtime a code block is executed with. */
export const RUNTIME_MODEL_ATTRIBUTE = "executable";
/** Model attribute marking a runnable code block as editable by the reader. */
export const EDITABLE_MODEL_ATTRIBUTE = "executableEditable";
/** Model attribute holding the ports the snippet serves on, comma separated. */
export const PORTS_MODEL_ATTRIBUTE = "executablePorts";
/** Model attribute marking a runnable code block as open to a terminal. */
export const TERMINAL_MODEL_ATTRIBUTE = "executableTerminal";
/** Model attribute marking a runnable code block as showing its logs. */
export const LOGS_MODEL_ATTRIBUTE = "executableLogs";

/** Data attributes both are downcasted to, on the `<code>` element. */
export const RUNTIME_DATA_ATTRIBUTE = "data-executable";
export const EDITABLE_DATA_ATTRIBUTE = "data-executable-editable";
export const PORTS_DATA_ATTRIBUTE = "data-executable-ports";
export const TERMINAL_DATA_ATTRIBUTE = "data-executable-terminal";
export const LOGS_DATA_ATTRIBUTE = "data-executable-logs";

/** Editing-only attribute rendering the runtime badge on `<pre>`. */
export const RUNTIME_BADGE_ATTRIBUTE = "data-runtime";

export const RUNTIME_COMMAND = "codeBlockRuntime";
export const EDITABLE_COMMAND = "codeBlockEditable";
export const PORTS_COMMAND = "codeBlockPorts";
export const TERMINAL_COMMAND = "codeBlockTerminal";
export const LOGS_COMMAND = "codeBlockLogs";

/**
 * The ports a snippet serves on, as they are written down: a list of numbers,
 * however the author separated them. What is not a port is left out rather
 * than argued about.
 */
export function parsePorts(value: string | null | undefined): number[] {
  if (!value) {
    return [];
  }

  const ports: number[] = [];
  for (const piece of value.split(/[\s,]+/)) {
    const port = Number.parseInt(piece, 10);

    if (
      Number.isInteger(port) &&
      port > 0 &&
      port < 65536 &&
      !ports.includes(port)
    ) {
      ports.push(port);
    }
  }

  return ports;
}

/** Reads the value carried by a dropdown list item. */
export function dropdownItemValue(source: unknown): string | null {
  return (source as {_value?: string | null})._value ?? null;
}

/** Returns the code block the selection is anchored in, if any. */
export function findCodeBlock(editor: Editor): ModelElement | undefined {
  const {selection} = editor.model.document;

  return Array.from(selection.getSelectedBlocks()).find((block) =>
    block.is("element", "codeBlock"),
  );
}

/** Flattens a code block back to plain text. */
export function getCodeBlockText(block: ModelElement): string {
  let text = "";

  for (const child of block.getChildren()) {
    if (child.is("$text") || child.is("$textProxy")) {
      text += child.data;
    } else if (child.is("element", "softBreak")) {
      text += "\n";
    }
  }

  return text;
}
