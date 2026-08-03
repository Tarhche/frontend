import {Command} from "ckeditor5";
import {
  EDITABLE_MODEL_ATTRIBUTE,
  RUNTIME_MODEL_ATTRIBUTE,
  findCodeBlock,
} from "./utils";

/**
 * Sets (or clears) the runtime the current code block is executed with.
 *
 * The command value is the runtime identifier (e.g. `go-1.24`) or `null` when the
 * block is not executable.
 */
export class CodeBlockRuntimeCommand extends Command {
  declare public value: string | null;

  public override refresh(): void {
    const block = findCodeBlock(this.editor);

    this.isEnabled = !!block;
    this.value = block
      ? ((block.getAttribute(RUNTIME_MODEL_ATTRIBUTE) as string) ?? null)
      : null;
  }

  public override execute({value}: {value?: string | null} = {}): void {
    const block = findCodeBlock(this.editor);

    if (!block) {
      return;
    }

    this.editor.model.change((writer) => {
      if (value) {
        writer.setAttribute(RUNTIME_MODEL_ATTRIBUTE, value, block);
      } else {
        writer.removeAttribute(RUNTIME_MODEL_ATTRIBUTE, block);
        // An editable snippet only makes sense when there is a runtime to re-run it with.
        writer.removeAttribute(EDITABLE_MODEL_ATTRIBUTE, block);
      }
    });
  }
}

/**
 * Toggles whether readers may edit the code of a runnable block before running it.
 *
 * Disabled (and always `false`) for blocks without a runtime.
 */
export class CodeBlockEditableCommand extends Command {
  declare public value: boolean;

  public override refresh(): void {
    const block = findCodeBlock(this.editor);
    const hasRuntime = !!block?.getAttribute(RUNTIME_MODEL_ATTRIBUTE);

    this.isEnabled = hasRuntime;
    this.value =
      hasRuntime && block!.getAttribute(EDITABLE_MODEL_ATTRIBUTE) === true;
  }

  public override execute({value}: {value?: boolean} = {}): void {
    const block = findCodeBlock(this.editor);

    if (!block || !block.getAttribute(RUNTIME_MODEL_ATTRIBUTE)) {
      return;
    }

    const newValue = value === undefined ? !this.value : value;

    this.editor.model.change((writer) => {
      if (newValue) {
        writer.setAttribute(EDITABLE_MODEL_ATTRIBUTE, true, block);
      } else {
        writer.removeAttribute(EDITABLE_MODEL_ATTRIBUTE, block);
      }
    });
  }
}
