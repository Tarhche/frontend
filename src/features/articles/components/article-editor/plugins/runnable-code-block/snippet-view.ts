import {
  currentScheme,
  mountCodeMirror,
  watchScheme,
  type MountedCode,
} from "@/features/code-highlight/codemirror";
import {fileNameFor} from "@/features/code-highlight/file-name";
import classes from "@/features/code-highlight/run-workspace.module.css";

/** The icons the bar carries, drawn the way the page draws them. */
const ICONS = {
  copy: '<path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z"/><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1"/>',
  play: '<path d="M7 4v16l13 -8z"/>',
  stop: '<path d="M5 5m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z"/>',
};

function icon(paths: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"` +
    ` fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"` +
    ` stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/>${paths}</svg>`
  );
}

export type SnippetLabels = {
  copy: string;
  run: string;
  stop: string;
};

type Options = {
  code: string;
  language?: string;
  runtime?: string;
  runnable: boolean;
  labels: SnippetLabels;

  onChange: (code: string) => void;
  onRun: () => void;
  onStop: () => void;
  onFocus: () => void;

  /** Somebody took hold of the snippet itself rather than of its code. */
  onSelect: () => void;
};

/**
 * A snippet as it is written, which is a snippet as it is read.
 *
 * The article editor draws a code block with the same card, the same bar and
 * the same editor a reader is shown, so that writing one and reading one are
 * the same thing to look at. What is typed here is handed back to the model,
 * and everything the model has to say about it — its language, its runtime, a
 * run that is under way — is set on it from outside.
 */
export class SnippetView {
  public readonly element: HTMLElement;

  private readonly _code: MountedCode;
  private readonly _unwatchScheme: () => void;
  private readonly _fileName: HTMLElement;
  private readonly _runtime: HTMLElement;
  private readonly _runButton: HTMLButtonElement;
  private readonly _labels: SnippetLabels;
  private readonly _onRun: () => void;
  private readonly _onStop: () => void;

  private _running = false;

  constructor(host: HTMLElement, options: Options) {
    this._labels = options.labels;
    this._onRun = options.onRun;
    this._onStop = options.onStop;

    host.classList.add(classes.surface);

    const pane = document.createElement("div");
    pane.className = classes.pane;

    const bar = document.createElement("div");
    bar.className = classes.paneBar;

    this._fileName = document.createElement("span");
    this._fileName.className = classes.fileName;
    this._fileName.textContent = fileNameFor(options.language);

    const actions = document.createElement("div");
    actions.className = classes.paneActions;

    this._runtime = document.createElement("span");
    this._runtime.className = classes.runtimeName;

    const copy = this._createButton(options.labels.copy, ICONS.copy, () => {
      void navigator.clipboard.writeText(this._code.view.state.doc.toString());
    });

    this._runButton = this._createButton(options.labels.run, ICONS.play, () => {
      if (this._running) {
        this._onStop();
      } else {
        this._onRun();
      }
    });
    this._runButton.hidden = !options.runnable;

    actions.append(this._runtime, copy, this._runButton);
    bar.append(this._fileName, actions);

    // the editor around this one is told to keep out of the snippet, so taking
    // hold of the snippet itself — to move it, or to take it out — is what the
    // bar over it is for.
    bar.addEventListener("mousedown", options.onSelect);

    const area = document.createElement("div");
    area.className = classes.code;

    pane.append(bar, area);
    host.append(pane);

    this.element = host;

    this._code = mountCodeMirror(area, {
      code: options.code,
      language: options.language,
      editable: true,
      scheme: currentScheme(),
      onChange: options.onChange,
    });

    this._unwatchScheme = watchScheme((scheme) => this._code.setScheme(scheme));

    this._code.view.contentDOM.addEventListener("focus", options.onFocus);
  }

  public setCode(code: string): void {
    this._code.setCode(code);
  }

  public setLanguage(language: string | undefined): void {
    this._fileName.textContent = fileNameFor(language);
    this._code.setLanguage(language);
  }

  public setRuntime(runtime: string | undefined): void {
    this._runtime.textContent = runtime ?? "";
    this._runButton.hidden = !runtime;
  }

  public setRunning(running: boolean): void {
    this._running = running;
    this._runButton.title = running ? this._labels.stop : this._labels.run;
    this._runButton.setAttribute("aria-label", this._runButton.title);
    this._runButton.innerHTML = icon(running ? ICONS.stop : ICONS.play);
  }

  public focus(): void {
    this._code.focus();
  }

  public destroy(): void {
    this._unwatchScheme();
    this._code.destroy();
  }

  private _createButton(
    label: string,
    paths: string,
    onClick: () => void,
  ): HTMLButtonElement {
    const button = document.createElement("button");

    button.type = "button";
    button.className = classes.paneAction;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = icon(paths);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });

    return button;
  }
}
