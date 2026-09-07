import {
  CodeBlockEditing,
  Collection,
  ContextualBalloon,
  IconCodeBlock,
  IconCog,
  Plugin,
  SplitButtonView,
  UIModel,
  Widget,
  addListToDropdown,
  createDropdown,
  toWidget,
  _getNormalizedAndLocalizedCodeBlockLanguageDefinitions as getLanguageDefinitions,
  type DowncastAttributeEvent,
  type ListDropdownItemDefinition,
  type ModelElement,
  type ModelWriter,
  type UpcastElementEvent,
  type ViewElement,
  type ViewNode,
} from "ckeditor5";
import {RUNTIMES} from "@/constants";
import {
  CodeBlockEditableCommand,
  CodeBlockLogsCommand,
  CodeBlockPortsCommand,
  CodeBlockRuntimeCommand,
  CodeBlockTerminalCommand,
  CodeSnippetLanguageCommand,
  InsertCodeSnippetCommand,
} from "./commands";
import {
  CodeBlockSettingsView,
  type CodeBlockRuntimeOption,
} from "./code-block-settings-view";
import {SnippetView} from "./snippet-view";
import {
  CODE_ATTRIBUTE,
  EDITABLE_COMMAND,
  EDITABLE_DATA_ATTRIBUTE,
  EDITABLE_MODEL_ATTRIBUTE,
  INSERT_COMMAND,
  LANGUAGE_ATTRIBUTE,
  LANGUAGE_COMMAND,
  LOGS_COMMAND,
  LOGS_DATA_ATTRIBUTE,
  LOGS_MODEL_ATTRIBUTE,
  PLAIN_LANGUAGE,
  PORTS_COMMAND,
  PORTS_DATA_ATTRIBUTE,
  PORTS_MODEL_ATTRIBUTE,
  RUNTIME_COMMAND,
  RUNTIME_DATA_ATTRIBUTE,
  RUNTIME_MODEL_ATTRIBUTE,
  SNIPPET,
  TERMINAL_COMMAND,
  TERMINAL_DATA_ATTRIBUTE,
  TERMINAL_MODEL_ATTRIBUTE,
  dropdownItemValue,
  findSnippet,
  parsePorts,
  setActiveSnippet,
  snippetCode,
  snippetLanguage,
  snippetRuntime,
} from "./utils";

/**
 * Runs a snippet and draws what it does.
 *
 * The panel says what a snippet is; whoever owns the editor draws what running
 * it does, in the surface a reader is shown, so an author sees what they are
 * setting up rather than an approximation of it.
 */
export type RunCodeCallback = (snippet: {
  /** The two boxes in the snippet's card a reader's surface is drawn into. */
  hosts: {preview: HTMLElement; panel: HTMLElement; tools: HTMLElement};

  runtime: string;
  code: string;
  ports: Array<number>;
  terminal: boolean;
  logs: boolean;
  onRunningChange: (running: boolean) => void;

  /** Says whether there is a browser beside the code to make room for. */
  onPreviewChange: (shown: boolean) => void;
}) => void;

export type RunnableCodeBlockConfig = {
  runtimes?: Array<CodeBlockRuntimeOption>;
  onRun?: RunCodeCallback;

  /** Takes away the container the snippet being run is running in. */
  onStop?: () => void;

  translate?: (key: string) => string;
  direction?: "ltr" | "rtl";
};

type Labels = {
  language: string;
  runtime: string;
  noRuntime: string;
  editableCode: string;
  ports: string;
  portsPlaceholder: string;
  terminal: string;
  logs: string;
  copy: string;
  run: string;
  stop: string;
  resize: string;
  insertCodeBlock: string;
  codeBlockSettings: string;
};

const SETTINGS_ITEM = "__settings__";

/**
 * Code blocks, written the way they are read.
 *
 * A snippet is one thing in the model — the code, the language it is in, and
 * what it takes to run it — and the editor draws it as the same card a reader
 * is shown, with the same editor inside. What is typed there is written back
 * to the model, so an article is saved as the `<pre><code>` it always was,
 * carrying `data-executable` and its companions for the page to read.
 */
export class RunnableCodeBlockPlugin extends Plugin {
  public static get requires() {
    return [CodeBlockEditing, Widget, ContextualBalloon] as const;
  }

  public static get pluginName() {
    return "RunnableCodeBlock" as const;
  }

  private _settingsView: CodeBlockSettingsView | null = null;
  private _activeBlock: ModelElement | null = null;
  /** Set when the author closes the panel, to keep it from reopening at once. */
  private _isDismissed = false;
  private _labels!: Labels;

  /** The editors drawn for the snippets in the document, by snippet. */
  private readonly _views = new Map<ModelElement, SnippetView>();

  public init(): void {
    this._labels = this._createLabels();

    this._defineSchema();
    this._defineConverters();
    this._replaceCodeBlocks();

    const {editor} = this;

    editor.commands.add(INSERT_COMMAND, new InsertCodeSnippetCommand(editor));
    editor.commands.add(
      LANGUAGE_COMMAND,
      new CodeSnippetLanguageCommand(editor),
    );
    editor.commands.add(RUNTIME_COMMAND, new CodeBlockRuntimeCommand(editor));
    editor.commands.add(EDITABLE_COMMAND, new CodeBlockEditableCommand(editor));
    editor.commands.add(PORTS_COMMAND, new CodeBlockPortsCommand(editor));
    editor.commands.add(TERMINAL_COMMAND, new CodeBlockTerminalCommand(editor));
    editor.commands.add(LOGS_COMMAND, new CodeBlockLogsCommand(editor));

    this._createToolbarDropdown();
    this._enableBalloonInteractions();
    this._sweepRemovedSnippets();
  }

  public override destroy(): void {
    super.destroy();

    for (const view of this._views.values()) {
      view.destroy();
    }

    this._views.clear();
    this._settingsView?.destroy();
    this._settingsView = null;
  }

  /** Says a run has started or ended, so the bar can offer the other one. */
  public setRunning(running: boolean): void {
    const snippet = this._activeBlock;

    if (snippet) {
      this._views.get(snippet)?.setRunning(running, isLive(snippet));
    }
  }

  private get _config(): RunnableCodeBlockConfig {
    return (this.editor.config.get("runnableCodeBlock") ??
      {}) as RunnableCodeBlockConfig;
  }

  private get _balloon(): ContextualBalloon {
    return this.editor.plugins.get(ContextualBalloon);
  }

  private _createLabels(): Labels {
    const translate = this._config.translate;
    const label = (key: string, fallback: string) => {
      const translated = translate?.(key);

      return translated && translated !== key ? translated : fallback;
    };

    return {
      language: label("editor.language", "Language"),
      runtime: label("editor.runtime", "Runtime"),
      noRuntime: label("editor.noRuntime", "No runtime"),
      editableCode: label("editor.editableCode", "Editable code"),
      ports: label("editor.ports", "Exposed ports"),
      portsPlaceholder: label("editor.portsPlaceholder", "8080, 3000"),
      terminal: label("editor.terminal", "Terminal"),
      logs: label("editor.logs", "Logs"),
      copy: label("editor.copy", "Copy"),
      run: label("editor.run", "Run"),
      stop: label("editor.stop", "Stop"),
      resize: label("editor.resize", "Resize the code and the browser"),
      insertCodeBlock: label("editor.insertCodeBlock", "Insert code block"),
      codeBlockSettings: label(
        "editor.codeBlockSettings",
        "Code block settings",
      ),
    };
  }

  private _defineSchema(): void {
    this.editor.model.schema.register(SNIPPET, {
      inheritAllFrom: "$blockObject",
      allowAttributes: [
        CODE_ATTRIBUTE,
        LANGUAGE_ATTRIBUTE,
        RUNTIME_MODEL_ATTRIBUTE,
        EDITABLE_MODEL_ATTRIBUTE,
        PORTS_MODEL_ATTRIBUTE,
        TERMINAL_MODEL_ATTRIBUTE,
        LOGS_MODEL_ATTRIBUTE,
      ],
    });
  }

  private _defineConverters(): void {
    const {editor} = this;

    // What an article holds is what it always held: a `<pre><code>` naming the
    // language, and what it takes to run it written beside it.
    editor.conversion.for("upcast").add((dispatcher) => {
      dispatcher.on<UpcastElementEvent>(
        "element:pre",
        (evt, data, conversionApi) => {
          const {viewItem} = data;
          const {consumable, writer, safeInsert, updateConversionResult} =
            conversionApi;

          if (!consumable.test(viewItem, {name: true})) {
            return;
          }

          const code = Array.from(viewItem.getChildren()).find(
            (child): child is ViewElement => child.is("element", "code"),
          );

          if (!code) {
            return;
          }

          const snippet = writer.createElement(SNIPPET, {
            [CODE_ATTRIBUTE]: textOf(code),
            [LANGUAGE_ATTRIBUTE]: languageOf(code),
            ...runtimeAttributesOf(code, viewItem),
          });

          if (!safeInsert(snippet, data.modelCursor)) {
            return;
          }

          consumable.consume(viewItem, {name: true});
          consumable.consume(code, {name: true});

          updateConversionResult(snippet, data);
        },
        {priority: "high"},
      );
    });

    editor.conversion.for("dataDowncast").elementToElement({
      model: SNIPPET,
      view: (snippet, {writer}) => {
        const attributes: Record<string, string> = {
          class: `language-${snippetLanguage(snippet) ?? PLAIN_LANGUAGE}`,
        };

        const runtime = snippetRuntime(snippet);

        if (runtime) {
          attributes[RUNTIME_DATA_ATTRIBUTE] = runtime;

          if (snippet.getAttribute(EDITABLE_MODEL_ATTRIBUTE) === true) {
            attributes[EDITABLE_DATA_ATTRIBUTE] = "true";
          }

          const ports = snippet.getAttribute(PORTS_MODEL_ATTRIBUTE);

          if (typeof ports === "string" && ports.length > 0) {
            attributes[PORTS_DATA_ATTRIBUTE] = ports;
          }

          if (snippet.getAttribute(TERMINAL_MODEL_ATTRIBUTE) === true) {
            attributes[TERMINAL_DATA_ATTRIBUTE] = "true";
          }

          if (snippet.getAttribute(LOGS_MODEL_ATTRIBUTE) === true) {
            attributes[LOGS_DATA_ATTRIBUTE] = "true";
          }
        }

        const code = writer.createContainerElement(
          "code",
          attributes,
          writer.createText(snippetCode(snippet)),
        );

        return writer.createContainerElement("pre", null, code);
      },
    });

    editor.conversion.for("editingDowncast").elementToElement({
      model: SNIPPET,
      view: (snippet, {writer}) => {
        const host = writer.createRawElement(
          "div",
          {
            class: "ck-code-snippet__host",

            // what happens inside a snippet's own editor — typing, clicking,
            // selecting — is that editor's business, and the editor around it
            // is told to keep out.
            "data-cke-ignore-events": "true",
          },
          (domElement) => this._mount(snippet, domElement as HTMLElement),
        );

        const container = writer.createContainerElement(
          "div",
          {class: "ck-code-snippet"},
          host,
        );

        return toWidget(container, writer, {hasSelectionHandle: false});
      },
    });

    // What the model says about a snippet is told to the editor drawn for it,
    // rather than drawing it again: somebody may be typing in that one.
    for (const [attribute, apply] of [
      [
        CODE_ATTRIBUTE,
        (view: SnippetView, value: unknown) =>
          view.setCode(typeof value === "string" ? value : ""),
      ],
      [
        LANGUAGE_ATTRIBUTE,
        (view: SnippetView, value: unknown) =>
          view.setLanguage(typeof value === "string" ? value : undefined),
      ],
      [
        RUNTIME_MODEL_ATTRIBUTE,
        (view: SnippetView, value: unknown) =>
          view.setRuntime(
            typeof value === "string" && value ? value : undefined,
          ),
      ],
    ] as const) {
      editor.editing.downcastDispatcher.on<DowncastAttributeEvent>(
        `attribute:${attribute}:${SNIPPET}`,
        (evt, data) => {
          const view = this._views.get(data.item as ModelElement);

          if (view) {
            apply(view, data.attributeNewValue);
          }
        },
      );
    }
  }

  /**
   * Anything else that makes a code block — the three backticks, a paste from
   * somewhere else — makes one of ours instead.
   */
  private _replaceCodeBlocks(): void {
    const {model} = this.editor;

    model.document.registerPostFixer((writer) => {
      let changed = false;

      for (const entry of model.document.differ.getChanges()) {
        if (entry.type !== "insert" || entry.name !== "codeBlock") {
          continue;
        }

        const block = entry.position.nodeAfter;

        if (!block?.is("element", "codeBlock")) {
          continue;
        }

        const snippet = writer.createElement(SNIPPET, {
          [CODE_ATTRIBUTE]: codeBlockText(block),
          [LANGUAGE_ATTRIBUTE]:
            (block.getAttribute(LANGUAGE_ATTRIBUTE) as string) ??
            PLAIN_LANGUAGE,
        });

        writer.insert(snippet, writer.createPositionBefore(block));
        writer.remove(block);

        changed = true;
      }

      return changed;
    });
  }

  /** Draws a snippet, and keeps what is written in it in the model. */
  private _mount(snippet: ModelElement, host: HTMLElement): void {
    const {editor} = this;

    this._views.get(snippet)?.destroy();

    const view = new SnippetView(host, {
      code: snippetCode(snippet),
      language: snippetLanguage(snippet),
      runtime: snippetRuntime(snippet),
      runnable: !!snippetRuntime(snippet),
      labels: this._labels,

      // what is typed is the snippet now; it is not a step of its own to undo,
      // since the editor it was typed in has a history of its own.
      onChange: (code) => {
        if (snippetCode(snippet) === code) {
          return;
        }

        editor.model.enqueueChange({isUndoable: false}, (writer) => {
          writer.setAttribute(CODE_ATTRIBUTE, code, snippet);
        });
      },

      onRun: () => {
        setActiveSnippet(editor, snippet);
        this._runCode(snippet);
      },

      onStop: () => this._config.onStop?.(),

      onSelect: () => {
        setActiveSnippet(editor, snippet);

        editor.model.change((writer) => writer.setSelection(snippet, "on"));
        editor.editing.view.focus();
      },

      onFocus: () => {
        setActiveSnippet(editor, snippet);

        for (const name of [
          LANGUAGE_COMMAND,
          RUNTIME_COMMAND,
          EDITABLE_COMMAND,
          PORTS_COMMAND,
          TERMINAL_COMMAND,
          LOGS_COMMAND,
        ]) {
          editor.commands.get(name)?.refresh();
        }

        this._updateSettingsVisibility();
      },
    });

    view.setRuntime(snippetRuntime(snippet));
    view.setRunning(false, isLive(snippet));

    this._views.set(snippet, view);
  }

  /** Lets go of the editors drawn for snippets that are no longer there. */
  private _sweepRemovedSnippets(): void {
    this.listenTo(this.editor.model.document, "change:data", () => {
      for (const [snippet, view] of this._views) {
        if (!snippet.root.rootName || snippet.root.rootName === "$graveyard") {
          view.destroy();
          this._views.delete(snippet);
        }
      }
    });
  }

  private _createToolbarDropdown(): void {
    const {editor} = this;
    const insertCommand = editor.commands.get(INSERT_COMMAND)!;
    const languageCommand = editor.commands.get(LANGUAGE_COMMAND)!;
    const runtimeCommand = editor.commands.get(RUNTIME_COMMAND)!;
    const languages = getLanguageDefinitions(editor);

    editor.ui.componentFactory.add("codeBlock", (locale) => {
      const dropdown = createDropdown(locale, SplitButtonView);
      const splitButton = dropdown.buttonView;

      splitButton.set({
        label: this._labels.insertCodeBlock,
        tooltip: true,
        icon: IconCodeBlock,
        isToggleable: true,
      });

      splitButton.bind("isOn").to(languageCommand, "value", (value) => !!value);

      splitButton.on("execute", () => {
        editor.execute(INSERT_COMMAND);
        editor.editing.view.focus();
      });

      const items = new Collection<ListDropdownItemDefinition>();

      for (const {language, label} of languages) {
        const model = new UIModel({
          _value: language,
          label,
          role: "menuitemradio",
          withText: true,
        });

        model
          .bind("isOn")
          .to(languageCommand, "value", (value) => value === language);

        items.add({type: "button", model});
      }

      items.add({type: "separator"});

      const settingsModel = new UIModel({
        _value: SETTINGS_ITEM,
        label: this._labels.codeBlockSettings,
        icon: IconCog,
        withText: true,
      });

      settingsModel.bind("isEnabled").to(runtimeCommand, "isEnabled");

      items.add({type: "button", model: settingsModel});

      addListToDropdown(dropdown, items, {
        role: "menu",
        ariaLabel: this._labels.insertCodeBlock,
      });

      dropdown.class = "ck-code-block-dropdown";
      dropdown.bind("isEnabled").to(insertCommand, "isEnabled");

      dropdown.on("execute", (evt) => {
        const value = dropdownItemValue(evt.source);

        if (value === SETTINGS_ITEM) {
          this._isDismissed = false;
          this._showSettings();

          return;
        }

        // a snippet being worked on is set to that language; anywhere else, a
        // new one is put there written in it.
        if (findSnippet(editor)) {
          editor.execute(LANGUAGE_COMMAND, {value});
        } else {
          editor.execute(INSERT_COMMAND, {language: value ?? undefined});
        }
      });

      return dropdown;
    });
  }

  private _getSettingsView(): CodeBlockSettingsView {
    if (this._settingsView) {
      return this._settingsView;
    }

    const {editor} = this;
    const languageCommand = editor.commands.get(LANGUAGE_COMMAND)!;
    const runtimeCommand = editor.commands.get(RUNTIME_COMMAND)!;
    const editableCommand = editor.commands.get(EDITABLE_COMMAND)!;
    const portsCommand = editor.commands.get(PORTS_COMMAND)!;
    const terminalCommand = editor.commands.get(TERMINAL_COMMAND)!;
    const logsCommand = editor.commands.get(LOGS_COMMAND)!;

    const view = new CodeBlockSettingsView(editor.locale, {
      languages: getLanguageDefinitions(editor),
      runtimes: this._config.runtimes ?? RUNTIMES,
      labels: this._labels,
      direction: this._config.direction ?? editor.locale.uiLanguageDirection,
    });

    view
      .bind("language")
      .to(languageCommand, "value", (value) =>
        typeof value === "string" ? value : null,
      );
    view.bind("runtime").to(runtimeCommand, "value", asRuntime);
    view.bind("isEditable").to(editableCommand, "value", Boolean);
    view
      .bind("ports")
      .to(portsCommand, "value", (value) =>
        typeof value === "string" ? value : null,
      );
    view.bind("hasTerminal").to(terminalCommand, "value", Boolean);
    view.bind("hasLogs").to(logsCommand, "value", Boolean);

    view.languageInput.bind("isEnabled").to(languageCommand, "isEnabled");
    view.runtimeInput.bind("isEnabled").to(runtimeCommand, "isEnabled");
    view.editableSwitch.bind("isEnabled").to(editableCommand, "isEnabled");
    view.terminalSwitch.bind("isEnabled").to(terminalCommand, "isEnabled");
    view.logsSwitch.bind("isEnabled").to(logsCommand, "isEnabled");
    view.portsInput.bind("isEnabled").to(portsCommand, "isEnabled");

    this.listenTo(view, "languageChange", (evt, language: string) => {
      editor.execute(LANGUAGE_COMMAND, {value: language});
    });

    this.listenTo(view, "runtimeChange", (evt, runtime: string | null) => {
      editor.execute(RUNTIME_COMMAND, {value: runtime});
    });

    this.listenTo(view, "editableChange", (evt, isEditable: boolean) => {
      editor.execute(EDITABLE_COMMAND, {value: isEditable});
    });

    this.listenTo(view, "terminalChange", (evt, hasTerminal: boolean) => {
      editor.execute(TERMINAL_COMMAND, {value: hasTerminal});
    });

    this.listenTo(view, "logsChange", (evt, hasLogs: boolean) => {
      editor.execute(LOGS_COMMAND, {value: hasLogs});
    });

    // the field keeps what the author is typing; the snippet keeps the ports
    // themselves, which is what it is told here.
    this.listenTo(view, "portsChange", (evt, ports: string) => {
      editor.execute(PORTS_COMMAND, {value: ports});
    });

    view.keystrokes.set("Esc", (data, cancel) => {
      this._hideSettings();
      cancel();
    });

    view.render();

    this._settingsView = view;

    return view;
  }

  private _enableBalloonInteractions(): void {
    const {editor} = this;

    this.listenTo(editor.ui, "update", () => this._updateSettingsVisibility());

    editor.keystrokes.set("Esc", (data, cancel) => {
      if (this._isSettingsVisible) {
        this._hideSettings();
        cancel();
      }
    });
  }

  private get _isSettingsVisible(): boolean {
    return !!this._settingsView && this._balloon.hasView(this._settingsView);
  }

  /** Keeps the settings panel attached to the snippet being worked on. */
  private _updateSettingsVisibility(): void {
    const snippet = findSnippet(this.editor);

    if (!snippet) {
      this._activeBlock = null;
      this._isDismissed = false;
      this._removeSettings();

      return;
    }

    if (snippet !== this._activeBlock) {
      this._activeBlock = snippet;
      this._isDismissed = false;
    }

    if (this._isDismissed) {
      return;
    }

    this._showSettings();
  }

  private _showSettings(): void {
    const target = this._getSnippetDomElement();

    if (!target) {
      this._removeSettings();

      return;
    }

    const view = this._getSettingsView();

    // the field is filled in from the snippet as the panel opens, and left
    // alone afterwards: what the author types is theirs until they leave it.
    if (view.portsInput.fieldView.element) {
      view.portsInput.fieldView.element.value = view.ports ?? "";
    } else {
      view.portsInput.fieldView.value = view.ports ?? "";
    }

    if (this._balloon.hasView(view)) {
      this._balloon.updatePosition({target});

      return;
    }

    this._balloon.add({view, position: {target}});
  }

  private _hideSettings(): void {
    this._isDismissed = true;
    this._removeSettings();
  }

  private _removeSettings(): void {
    if (this._isSettingsVisible) {
      this._balloon.remove(this._settingsView!);
    }
  }

  private _getSnippetDomElement(): HTMLElement | null {
    const {editor} = this;
    const snippet = findSnippet(editor);

    if (!snippet) {
      return null;
    }

    const viewElement = editor.editing.mapper.toViewElement(snippet);

    if (!viewElement) {
      return null;
    }

    const domElement =
      editor.editing.view.domConverter.mapViewToDom(viewElement);

    return (domElement as HTMLElement | undefined) ?? null;
  }

  /** Asks for a snippet to be run, and for what it does to be drawn. */
  private _runCode(snippet: ModelElement): void {
    const {onRun} = this._config;
    const runtime = snippetRuntime(snippet);

    if (!onRun || !runtime) {
      return;
    }

    const view = this._views.get(snippet);

    if (!view) {
      return;
    }

    onRun({
      hosts: {
        preview: view.previewHost,
        panel: view.panelHost,
        tools: view.toolsHost,
      },
      runtime,
      code: snippetCode(snippet),
      ports: parsePorts(
        snippet.getAttribute(PORTS_MODEL_ATTRIBUTE) as string | undefined,
      ),
      terminal: snippet.getAttribute(TERMINAL_MODEL_ATTRIBUTE) === true,
      logs: snippet.getAttribute(LOGS_MODEL_ATTRIBUTE) === true,
      onRunningChange: (running: boolean) => {
        this._views.get(snippet)?.setRunning(running, isLive(snippet));
      },
      onPreviewChange: (shown: boolean) => {
        this._views.get(snippet)?.setPreview(shown);
      },
    });
  }
}

/**
 * Whether a snippet is one to be reached rather than one to be waited for: it
 * serves a port, or it offers a way in. One that does neither prints what it
 * has to say and ends.
 */
function isLive(snippet: ModelElement): boolean {
  const ports = parsePorts(
    snippet.getAttribute(PORTS_MODEL_ATTRIBUTE) as string | undefined,
  );

  return (
    ports.length > 0 || snippet.getAttribute(TERMINAL_MODEL_ATTRIBUTE) === true
  );
}

function asRuntime(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/** The text a `<pre><code>` holds, newlines and all. */
function textOf(element: ViewElement): string {
  let text = "";

  const walk = (node: ViewNode) => {
    if (node.is("$text")) {
      text += node.data;

      return;
    }

    if (node.is("element", "br")) {
      text += "\n";

      return;
    }

    if (node.is("element")) {
      for (const child of node.getChildren()) {
        walk(child);
      }
    }
  };

  for (const child of element.getChildren()) {
    walk(child);
  }

  return text;
}

/** The language a `<code>` says it is written in. */
function languageOf(element: ViewElement): string {
  for (const name of element.getClassNames()) {
    if (name.startsWith("language-")) {
      return name.slice("language-".length) || PLAIN_LANGUAGE;
    }
  }

  return PLAIN_LANGUAGE;
}

/** What it takes to run a snippet, as an article wrote it down. */
function runtimeAttributesOf(
  code: ViewElement,
  pre: ViewElement,
): Record<string, string | boolean> {
  const read = (key: string) =>
    (code.getAttribute(key) ?? pre.getAttribute(key)) as string | undefined;

  const runtime = read(RUNTIME_DATA_ATTRIBUTE);

  if (!runtime) {
    return {};
  }

  const attributes: Record<string, string | boolean> = {
    [RUNTIME_MODEL_ATTRIBUTE]: runtime,
  };

  if (read(EDITABLE_DATA_ATTRIBUTE) === "true") {
    attributes[EDITABLE_MODEL_ATTRIBUTE] = true;
  }

  const ports = parsePorts(read(PORTS_DATA_ATTRIBUTE));

  if (ports.length > 0) {
    attributes[PORTS_MODEL_ATTRIBUTE] = ports.join(",");
  }

  if (read(TERMINAL_DATA_ATTRIBUTE) === "true") {
    attributes[TERMINAL_MODEL_ATTRIBUTE] = true;
  }

  if (read(LOGS_DATA_ATTRIBUTE) === "true") {
    attributes[LOGS_MODEL_ATTRIBUTE] = true;
  }

  return attributes;
}

/** Flattens one of CKEditor's own code blocks back to plain text. */
function codeBlockText(block: ModelElement): string {
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

// kept so that the writer type is used where a post-fixer needs it.
export type {ModelWriter};
