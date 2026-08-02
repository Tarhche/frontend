import {type Editor, type ModelElement} from "ckeditor5";

/** Model attribute holding the runtime a code block is executed with. */
export const RUNTIME_MODEL_ATTRIBUTE = "executable";
/** Model attribute marking a runnable code block as editable by the reader. */
export const EDITABLE_MODEL_ATTRIBUTE = "executableEditable";

/**
 * Data attributes both are downcasted to. They live on the `<code>` element, which
 * is what the model `codeBlock` element is mapped to, and what the article body
 * parser reads when rendering the published article.
 */
export const RUNTIME_DATA_ATTRIBUTE = "data-executable";
export const EDITABLE_DATA_ATTRIBUTE = "data-executable-editable";

/** Editing-only attribute used to render the runtime badge on the `<pre>` element. */
export const RUNTIME_BADGE_ATTRIBUTE = "data-runtime";

export const RUNTIME_COMMAND = "codeBlockRuntime";
export const EDITABLE_COMMAND = "codeBlockEditable";

/**
 * Reads the value carried by a dropdown list item. `addListToDropdown()` copies every
 * model property onto the button view, so `_value` is available on the event source.
 */
export function dropdownItemValue(source: unknown): string | null {
  return (source as {_value?: string | null})._value ?? null;
}

/** Returns the code block the selection is currently anchored in (if any). */
export function findCodeBlock(editor: Editor): ModelElement | undefined {
  const {selection} = editor.model.document;

  return Array.from(selection.getSelectedBlocks()).find((block) =>
    block.is("element", "codeBlock"),
  );
}

/**
 * Flattens a code block back to plain text. `softBreak` elements are the model
 * representation of the new lines inside a code block.
 */
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
