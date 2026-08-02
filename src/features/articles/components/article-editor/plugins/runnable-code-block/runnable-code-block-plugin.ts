import {
  CodeBlockEditing,
  Collection,
  ContextualBalloon,
  IconCodeBlock,
  IconCog,
  Plugin,
  SplitButtonView,
  UIModel,
  addListToDropdown,
  createDropdown,
  _getNormalizedAndLocalizedCodeBlockLanguageDefinitions as getLanguageDefinitions,
  type DowncastAttributeEvent,
  type ListDropdownItemDefinition,
  type ModelElement,
  type UpcastElementEvent,
  type ModelWriter,
} from "ckeditor5";
import {RUNTIMES} from "@/constants";
import {CodeBlockEditableCommand, CodeBlockRuntimeCommand} from "./commands";
import {
  CodeBlockSettingsView,
  type CodeBlockRuntimeOption,
} from "./code-block-settings-view";
import {
  EDITABLE_COMMAND,
  EDITABLE_DATA_ATTRIBUTE,
  EDITABLE_MODEL_ATTRIBUTE,
  RUNTIME_BADGE_ATTRIBUTE,
  RUNTIME_COMMAND,
  RUNTIME_DATA_ATTRIBUTE,
  RUNTIME_MODEL_ATTRIBUTE,
  dropdownItemValue,
  findCodeBlock,
  getCodeBlockText,
} from "./utils";

/** Executes a snippet and resolves with whatever the runtime printed. */
export type RunCodeCallback = (params: {
  runtime: string;
  code: string;
}) => Promise<string> | string;

export type RunnableCodeBlockConfig = {
  /**
   * Called when the author runs a snippet from the editor. Without it the editor
   * still lets authors pick a runtime, it just cannot execute anything.
   */
  onRun?: RunCodeCallback;
  /** Runtimes available in the settings panel. Defaults to the app-wide `RUNTIMES`. */
  runtimes?: Array<CodeBlockRuntimeOption>;
  /** Translation function used for the plugin UI. Falls back to English. */
  translate?: (key: string) => string;
  /**
   * Reading direction of the plugin UI. Defaults to the editor UI direction, which
   * is what a monolingual editor wants; pass the app direction when the panel is
   * translated into a language the editor UI itself is not.
   */
  direction?: "ltr" | "rtl";
};

type Labels = {
  language: string;
  runtime: string;
  noRuntime: string;
  editableCode: string;
  run: string;
  running: string;
  programOutput: string;
  clearOutput: string;
  noOutput: string;
  runFailed: string;
  insertCodeBlock: string;
  codeBlockSettings: string;
};

const SETTINGS_ITEM = "__settings__";

/**
 * A single code block feature: inserting code blocks, picking their language, the
 * runtime they are executed with, whether readers may edit them — and running them
 * right in the editor, the same way the published article does.
 *
 * The runtime is stored as `data-executable` and the editable flag as
 * `data-executable-editable` on the `<code>` element, which is what the article body
 * parser reads when rendering a published article.
 */
export class RunnableCodeBlockPlugin extends Plugin {
  public static get requires() {
    return [CodeBlockEditing, ContextualBalloon] as const;
  }

  public static get pluginName() {
    return "RunnableCodeBlock" as const;
  }

  private _settingsView: CodeBlockSettingsView | null = null;
  private _activeBlock: ModelElement | null = null;
  /** Set when the author closes the panel so it does not pop up again right away. */
  private _isDismissed = false;
  private _labels!: Labels;

  public init(): void {
    this._labels = this._createLabels();

    this._defineSchema();
    this._defineConverters();

    const {editor} = this;

    editor.commands.add(RUNTIME_COMMAND, new CodeBlockRuntimeCommand(editor));
    editor.commands.add(EDITABLE_COMMAND, new CodeBlockEditableCommand(editor));

    this._createToolbarDropdown();
    this._enableBalloonInteractions();
  }

  public override destroy(): void {
    super.destroy();

    this._settingsView?.destroy();
    this._settingsView = null;
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

      // The app dictionary falls back to the key itself for missing translations.
      return translated && translated !== key ? translated : fallback;
    };

    return {
      language: label("editor.language", "Language"),
      runtime: label("editor.runtime", "Runtime"),
      noRuntime: label("editor.noRuntime", "No runtime"),
      editableCode: label("editor.editableCode", "Editable code"),
      run: label("editor.run", "Run"),
      running: label("editor.running", "Running…"),
      programOutput: label("editor.programOutput", "Program output:"),
      clearOutput: label("editor.clearOutput", "Clear output"),
      noOutput: label("editor.noOutput", "<no output>"),
      runFailed: label("editor.runFailed", "Running the code failed."),
      insertCodeBlock: label("editor.insertCodeBlock", "Insert code block"),
      codeBlockSettings: label(
        "editor.codeBlockSettings",
        "Code block settings",
      ),
    };
  }

  private _defineSchema(): void {
    this.editor.model.schema.extend("codeBlock", {
      allowAttributes: [RUNTIME_MODEL_ATTRIBUTE, EDITABLE_MODEL_ATTRIBUTE],
    });
  }

  private _defineConverters(): void {
    const {editor} = this;

    // The model `codeBlock` element is mapped to the `<code>` element, so both
    // attributes end up on `<code>` — where the article body parser looks for them.
    editor.conversion.for("downcast").attributeToAttribute({
      model: {name: "codeBlock", key: RUNTIME_MODEL_ATTRIBUTE},
      view: (value) =>
        value ? {key: RUNTIME_DATA_ATTRIBUTE, value: String(value)} : null,
    });

    editor.conversion.for("downcast").attributeToAttribute({
      model: {name: "codeBlock", key: EDITABLE_MODEL_ATTRIBUTE},
      view: (value) =>
        value ? {key: EDITABLE_DATA_ATTRIBUTE, value: "true"} : null,
    });

    // Editing-only: label runnable blocks with their runtime, next to the language label.
    editor.editing.downcastDispatcher.on<DowncastAttributeEvent>(
      `attribute:${RUNTIME_MODEL_ATTRIBUTE}:codeBlock`,
      (evt, data, conversionApi) => {
        const viewCode = conversionApi.mapper.toViewElement(
          data.item as ModelElement,
        );
        const viewPre = viewCode?.parent;

        if (!viewPre || !viewPre.is("element", "pre")) {
          return;
        }

        if (data.attributeNewValue) {
          conversionApi.writer.setAttribute(
            RUNTIME_BADGE_ATTRIBUTE,
            String(data.attributeNewValue),
            viewPre,
          );
        } else {
          conversionApi.writer.removeAttribute(
            RUNTIME_BADGE_ATTRIBUTE,
            viewPre,
          );
        }
      },
      {priority: "low"},
    );

    editor.conversion.for("upcast").add((dispatcher) => {
      dispatcher.on<UpcastElementEvent>(
        "element:code",
        (evt, data, conversionApi) => {
          const viewCode = data.viewItem;
          const viewPre = viewCode.parent;

          if (!viewPre || !viewPre.is("element", "pre") || !data.modelRange) {
            return;
          }

          const codeBlock = Array.from(data.modelRange.getItems()).find(
            (item): item is ModelElement => item.is("element", "codeBlock"),
          );

          if (!codeBlock) {
            return;
          }

          // Older content carries the attributes on `<pre>` instead of `<code>`.
          const readAttribute = (key: string) =>
            (viewCode.getAttribute(key) ?? viewPre.getAttribute(key)) as
              string | undefined;

          const runtime = readAttribute(RUNTIME_DATA_ATTRIBUTE);
          const {writer} = conversionApi;

          if (runtime) {
            writer.setAttribute(RUNTIME_MODEL_ATTRIBUTE, runtime, codeBlock);

            if (readAttribute(EDITABLE_DATA_ATTRIBUTE) === "true") {
              writer.setAttribute(EDITABLE_MODEL_ATTRIBUTE, true, codeBlock);
            }
          }

          // General HTML Support preserves unknown attributes of `<pre>`/`<code>`.
          // Drop ours from there so that they are not written out twice.
          removePreservedAttributes(writer, codeBlock, "htmlContentAttributes");
          removePreservedAttributes(writer, codeBlock, "htmlPreAttributes");
        },
        // Runs after the code block and the General HTML Support converters.
        {priority: "lowest"},
      );
    });
  }

  private _createToolbarDropdown(): void {
    const {editor} = this;
    const codeBlockCommand = editor.commands.get("codeBlock")!;
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

      splitButton
        .bind("isOn")
        .to(codeBlockCommand, "value", (value) => !!value);

      splitButton.on("execute", () => {
        editor.execute("codeBlock", {usePreviousLanguageChoice: true});
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
          .to(codeBlockCommand, "value", (value) => value === language);

        items.add({type: "button", model});
      }

      items.add({type: "separator"});

      const settingsModel = new UIModel({
        _value: SETTINGS_ITEM,
        label: this._labels.codeBlockSettings,
        icon: IconCog,
        withText: true,
      });

      // The panel configures an existing block, so it needs one under the selection.
      settingsModel.bind("isEnabled").to(runtimeCommand, "isEnabled");

      items.add({type: "button", model: settingsModel});

      addListToDropdown(dropdown, items, {
        role: "menu",
        ariaLabel: this._labels.insertCodeBlock,
      });

      dropdown.class = "ck-code-block-dropdown";
      dropdown.bind("isEnabled").to(codeBlockCommand);

      dropdown.on("execute", (evt) => {
        const value = dropdownItemValue(evt.source);

        if (value === SETTINGS_ITEM) {
          this._isDismissed = false;
          this._showSettings();

          return;
        }

        editor.execute("codeBlock", {
          language: value ?? undefined,
          forceValue: true,
        });
        editor.editing.view.focus();
      });

      return dropdown;
    });
  }

  private _getSettingsView(): CodeBlockSettingsView {
    if (this._settingsView) {
      return this._settingsView;
    }

    const {editor} = this;
    const codeBlockCommand = editor.commands.get("codeBlock")!;
    const runtimeCommand = editor.commands.get(RUNTIME_COMMAND)!;
    const editableCommand = editor.commands.get(EDITABLE_COMMAND)!;

    const view = new CodeBlockSettingsView(editor.locale, {
      languages: getLanguageDefinitions(editor),
      runtimes: this._config.runtimes ?? RUNTIMES,
      labels: this._labels,
      direction: this._config.direction ?? editor.locale.uiLanguageDirection,
    });

    view.canRun = typeof this._config.onRun === "function";

    view
      .bind("language")
      .to(codeBlockCommand, "value", (value) =>
        typeof value === "string" ? value : null,
      );
    view.bind("runtime").to(runtimeCommand, "value", asRuntime);
    view.bind("isEditable").to(editableCommand, "value", Boolean);

    view.languageInput.bind("isEnabled").to(codeBlockCommand, "isEnabled");
    view.runtimeInput.bind("isEnabled").to(runtimeCommand, "isEnabled");
    view.editableSwitch.bind("isEnabled").to(editableCommand, "isEnabled");

    this.listenTo(view, "languageChange", (evt, language: string) => {
      editor.execute("codeBlock", {language, forceValue: true});
      editor.editing.view.focus();
    });

    this.listenTo(view, "runtimeChange", (evt, runtime: string | null) => {
      editor.execute(RUNTIME_COMMAND, {value: runtime});
      editor.editing.view.focus();
    });

    this.listenTo(view, "editableChange", (evt, isEditable: boolean) => {
      editor.execute(EDITABLE_COMMAND, {value: isEditable});
      editor.editing.view.focus();
    });

    this.listenTo(view, "run", () => {
      void this._runCode();
    });

    this.listenTo(view, "clearOutput", () => this._resetOutput());

    // Closing the panel while the focus is inside it.
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

  /**
   * Keeps the settings panel attached to the code block the selection is in and
   * away from everything else.
   */
  private _updateSettingsVisibility(): void {
    const block = findCodeBlock(this.editor);

    if (!block) {
      this._activeBlock = null;
      this._isDismissed = false;
      this._removeSettings();

      return;
    }

    if (block !== this._activeBlock) {
      this._activeBlock = block;
      this._isDismissed = false;
      this._resetOutput();
    }

    if (this._isDismissed) {
      return;
    }

    this._showSettings();
  }

  private _showSettings(): void {
    const target = this._getBlockDomElement();

    if (!target) {
      this._removeSettings();

      return;
    }

    const view = this._getSettingsView();

    if (this._balloon.hasView(view)) {
      this._balloon.updatePosition({target});

      return;
    }

    this._balloon.add({view, position: {target}});
  }

  private _hideSettings(): void {
    this._isDismissed = true;
    this._removeSettings();
    this.editor.editing.view.focus();
  }

  private _removeSettings(): void {
    if (this._isSettingsVisible) {
      this._balloon.remove(this._settingsView!);
    }
  }

  private _getBlockDomElement(): HTMLElement | null {
    const {editor} = this;
    const block = findCodeBlock(editor);

    if (!block) {
      return null;
    }

    const viewCode = editor.editing.mapper.toViewElement(block);
    const viewPre = viewCode?.parent;
    const viewElement =
      viewPre && viewPre.is("element", "pre") ? viewPre : viewCode;

    if (!viewElement) {
      return null;
    }

    const domElement =
      editor.editing.view.domConverter.mapViewToDom(viewElement);

    return (domElement as HTMLElement | undefined) ?? null;
  }

  private _resetOutput(): void {
    if (!this._settingsView) {
      return;
    }

    this._settingsView.output = null;
    this._settingsView.hasError = false;
  }

  /** Runs the code of the current block, exactly like a reader would. */
  private async _runCode(): Promise<void> {
    const view = this._settingsView;
    const block = findCodeBlock(this.editor);
    const {onRun} = this._config;

    if (!view || !block || !onRun) {
      return;
    }

    const runtime = asRuntime(block.getAttribute(RUNTIME_MODEL_ATTRIBUTE));

    if (!runtime) {
      return;
    }

    view.isRunning = true;
    view.hasError = false;
    view.output = null;

    try {
      const output = await onRun({runtime, code: getCodeBlockText(block)});

      // The panel may have been destroyed while the code was running.
      if (this._settingsView !== view) {
        return;
      }

      view.output = output?.trim() ? output : this._labels.noOutput;
    } catch (error) {
      if (this._settingsView !== view) {
        return;
      }

      view.hasError = true;
      view.output =
        error instanceof Error && error.message
          ? error.message
          : this._labels.runFailed;
    } finally {
      if (this._settingsView === view) {
        view.isRunning = false;
      }
    }
  }
}

function asRuntime(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

/**
 * Removes the runtime attributes General HTML Support preserved on the model, so the
 * plugin stays the single source of truth for them.
 */
function removePreservedAttributes(
  writer: ModelWriter,
  block: ModelElement,
  attributeName: string,
): void {
  const preserved = block.getAttribute(attributeName) as
    Record<string, unknown> | undefined;

  if (!preserved?.attributes) {
    return;
  }

  const attributes = {...(preserved.attributes as Record<string, unknown>)};
  const hadRuntimeAttributes = [
    RUNTIME_DATA_ATTRIBUTE,
    EDITABLE_DATA_ATTRIBUTE,
  ].some((key) => key in attributes);

  if (!hadRuntimeAttributes) {
    return;
  }

  delete attributes[RUNTIME_DATA_ATTRIBUTE];
  delete attributes[EDITABLE_DATA_ATTRIBUTE];

  const rest: Record<string, unknown> = {...preserved, attributes};

  if (Object.keys(attributes).length === 0) {
    delete rest.attributes;
  }

  if (Object.keys(rest).length === 0) {
    writer.removeAttribute(attributeName, block);
  } else {
    writer.setAttribute(attributeName, rest, block);
  }
}
