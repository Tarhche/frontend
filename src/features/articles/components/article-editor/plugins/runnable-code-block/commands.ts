import {Command} from "ckeditor5";
import {
  EDITABLE_MODEL_ATTRIBUTE,
  LOGS_MODEL_ATTRIBUTE,
  PORTS_MODEL_ATTRIBUTE,
  RUNTIME_MODEL_ATTRIBUTE,
  TERMINAL_MODEL_ATTRIBUTE,
  findCodeBlock,
  parsePorts,
} from "./utils";

/** Sets or clears the runtime the current code block is executed with. */
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
        writer.removeAttribute(EDITABLE_MODEL_ATTRIBUTE, block);
        writer.removeAttribute(PORTS_MODEL_ATTRIBUTE, block);
        writer.removeAttribute(TERMINAL_MODEL_ATTRIBUTE, block);
        writer.removeAttribute(LOGS_MODEL_ATTRIBUTE, block);
      }
    });
  }
}

/** Toggles whether readers may edit a runnable block before running it. */
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

/** Sets or clears the ports a runnable block serves on. */
export class CodeBlockPortsCommand extends Command {
  declare public value: string | null;

  public override refresh(): void {
    const block = findCodeBlock(this.editor);
    const hasRuntime = !!block?.getAttribute(RUNTIME_MODEL_ATTRIBUTE);

    this.isEnabled = hasRuntime;
    this.value = hasRuntime
      ? ((block!.getAttribute(PORTS_MODEL_ATTRIBUTE) as string) ?? null)
      : null;
  }

  public override execute({value}: {value?: string | null} = {}): void {
    const block = findCodeBlock(this.editor);

    if (!block || !block.getAttribute(RUNTIME_MODEL_ATTRIBUTE)) {
      return;
    }

    // what is written down is the ports themselves, in one shape, so that a
    // reader's page and the runner are told the same thing.
    const ports = parsePorts(value).join(",");

    this.editor.model.change((writer) => {
      if (ports.length > 0) {
        writer.setAttribute(PORTS_MODEL_ATTRIBUTE, ports, block);
      } else {
        writer.removeAttribute(PORTS_MODEL_ATTRIBUTE, block);
      }
    });
  }
}

/** Toggles whether readers may open a terminal in a running snippet. */
export class CodeBlockTerminalCommand extends Command {
  declare public value: boolean;

  public override refresh(): void {
    const block = findCodeBlock(this.editor);
    const hasRuntime = !!block?.getAttribute(RUNTIME_MODEL_ATTRIBUTE);

    this.isEnabled = hasRuntime;
    this.value =
      hasRuntime && block!.getAttribute(TERMINAL_MODEL_ATTRIBUTE) === true;
  }

  public override execute({value}: {value?: boolean} = {}): void {
    const block = findCodeBlock(this.editor);

    if (!block || !block.getAttribute(RUNTIME_MODEL_ATTRIBUTE)) {
      return;
    }

    const newValue = value === undefined ? !this.value : value;

    this.editor.model.change((writer) => {
      if (newValue) {
        writer.setAttribute(TERMINAL_MODEL_ATTRIBUTE, true, block);
      } else {
        writer.removeAttribute(TERMINAL_MODEL_ATTRIBUTE, block);
      }
    });
  }
}

/** Toggles whether readers see what a running snippet writes. */
export class CodeBlockLogsCommand extends Command {
  declare public value: boolean;

  public override refresh(): void {
    const block = findCodeBlock(this.editor);
    const hasRuntime = !!block?.getAttribute(RUNTIME_MODEL_ATTRIBUTE);

    this.isEnabled = hasRuntime;
    this.value =
      hasRuntime && block!.getAttribute(LOGS_MODEL_ATTRIBUTE) === true;
  }

  public override execute({value}: {value?: boolean} = {}): void {
    const block = findCodeBlock(this.editor);

    if (!block || !block.getAttribute(RUNTIME_MODEL_ATTRIBUTE)) {
      return;
    }

    const newValue = value === undefined ? !this.value : value;

    this.editor.model.change((writer) => {
      if (newValue) {
        writer.setAttribute(LOGS_MODEL_ATTRIBUTE, true, block);
      } else {
        writer.removeAttribute(LOGS_MODEL_ATTRIBUTE, block);
      }
    });
  }
}
