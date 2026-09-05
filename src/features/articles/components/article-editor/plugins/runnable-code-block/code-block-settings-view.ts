import {
  ButtonView,
  Collection,
  FocusCycler,
  FocusTracker,
  IconCancel,
  IconPlay,
  KeystrokeHandler,
  LabeledFieldView,
  SwitchButtonView,
  UIModel,
  View,
  ViewCollection,
  addListToDropdown,
  createLabeledDropdown,
  createLabeledInputText,
  type DropdownView,
  type InputTextView,
  type FocusableView,
  type ListDropdownItemDefinition,
  type Locale,
} from "ckeditor5";
import {dropdownItemValue} from "./utils";

export type CodeBlockLanguageOption = {language: string; label: string};
export type CodeBlockRuntimeOption = {value: string; label: string};

export type CodeBlockSettingsLabels = {
  language: string;
  runtime: string;
  noRuntime: string;
  editableCode: string;
  ports: string;
  portsPlaceholder: string;
  terminal: string;
  logs: string;
  run: string;
  running: string;
};

type Options = {
  languages: Array<CodeBlockLanguageOption>;
  runtimes: Array<CodeBlockRuntimeOption>;
  labels: CodeBlockSettingsLabels;
  /** Reading direction of the panel. */
  direction: "ltr" | "rtl";
};

/**
 * The settings panel of a code block: language, runtime, reader-editable flag
 * and running it in place. State is observable; intent is announced through the
 * `languageChange`, `runtimeChange`, `editableChange`, `portsChange`,
 * `terminalChange`, `logsChange` and `run` events, which the plugin wires to
 * commands. What a run has to show is drawn into the box at the bottom by
 * whoever owns the panel, so an author sees what a reader will.
 */
export class CodeBlockSettingsView extends View {
  public readonly focusTracker = new FocusTracker();
  public readonly keystrokes = new KeystrokeHandler();

  public readonly languageInput: LabeledFieldView<DropdownView>;
  public readonly runtimeInput: LabeledFieldView<DropdownView>;
  public readonly editableSwitch: SwitchButtonView;
  public readonly portsInput: LabeledFieldView<InputTextView>;
  public readonly terminalSwitch: SwitchButtonView;
  public readonly logsSwitch: SwitchButtonView;
  public readonly runButton: ButtonView;

  /** The language of the code block the panel is attached to. */
  declare public language: string | null;
  /** The runtime of the code block, `null` when not runnable. */
  declare public runtime: string | null;
  /** Whether readers may edit the code before running it. */
  declare public isEditable: boolean;
  /** The ports the snippet serves on, as the author wrote them. */
  declare public ports: string | null;
  /** Whether readers may open a terminal in the running snippet. */
  declare public hasTerminal: boolean;
  /** Whether readers see what the running snippet writes. */
  declare public hasLogs: boolean;
  declare public isRunning: boolean;
  /** Whether the integration is able to execute code at all. */
  declare public canRun: boolean;

  private readonly _focusables = new ViewCollection<FocusableView>();
  private readonly _focusCycler: FocusCycler;

  constructor(
    locale: Locale,
    {languages, runtimes, labels, direction}: Options,
  ) {
    super(locale);

    this.set({
      language: null,
      runtime: null,
      isEditable: false,
      ports: null,
      hasTerminal: false,
      hasLogs: false,
      isRunning: false,
      canRun: false,
    });

    this.languageInput = this._createLanguageInput(languages, labels);
    this.runtimeInput = this._createRuntimeInput(runtimes, labels);
    this.editableSwitch = this._createEditableSwitch(labels);
    this.portsInput = this._createPortsInput(labels);
    this.terminalSwitch = this._createTerminalSwitch(labels);
    this.logsSwitch = this._createLogsSwitch(labels);
    this.runButton = this._createRunButton(labels);

    this._focusCycler = new FocusCycler({
      focusables: this._focusables,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        focusPrevious: "shift + tab",
        focusNext: "tab",
      },
    });

    const bind = this.bindTemplate;

    this.setTemplate({
      tag: "div",
      attributes: {
        class: ["ck", "ck-reset_all", "ck-code-block-settings"],
        dir: direction,
        tabindex: "-1",
      },
      children: [
        {
          tag: "div",
          attributes: {class: ["ck", "ck-code-block-settings__fields"]},
          children: [this.languageInput, this.runtimeInput, this.portsInput],
        },
        {
          tag: "div",
          attributes: {
            class: [
              "ck",
              "ck-code-block-settings__actions",
              bind.if("runtime", "ck-hidden", (value) => !value),
            ],
          },
          children: [
            this.editableSwitch,
            this.terminalSwitch,
            this.logsSwitch,
            this.runButton,
          ],
        },
        {
          tag: "div",
          attributes: {
            class: [
              "ck",
              "ck-code-block-settings__surface",
              bind.if("isRunning", "ck-code-block-settings__surface_running"),
            ],
          },
          children: [],
        },
      ],
    });
  }

  public override render(): void {
    super.render();

    for (const view of this._focusables) {
      this.focusTracker.add(view.element!);
    }

    this.keystrokes.listenTo(this.element!);
  }

  public override destroy(): void {
    super.destroy();

    this.focusTracker.destroy();
    this.keystrokes.destroy();
  }

  public focus(): void {
    this._focusCycler.focusFirst();
  }

  private _createLanguageInput(
    languages: Array<CodeBlockLanguageOption>,
    labels: CodeBlockSettingsLabels,
  ): LabeledFieldView<DropdownView> {
    const labeledDropdown = new LabeledFieldView<DropdownView>(
      this.locale,
      createLabeledDropdown,
    );

    labeledDropdown.label = labels.language;
    labeledDropdown.isEmpty = false;

    const dropdown = labeledDropdown.fieldView;
    const items = new Collection<ListDropdownItemDefinition>();

    for (const {language, label} of languages) {
      const model = new UIModel({
        _value: language,
        label,
        role: "menuitemradio",
        withText: true,
      });

      model.bind("isOn").to(this, "language", (value) => value === language);

      items.add({type: "button", model});
    }

    addListToDropdown(dropdown, items, {
      role: "menu",
      ariaLabel: labels.language,
    });

    dropdown.buttonView.set({withText: true, tooltip: labels.language});
    dropdown.buttonView.bind("label").to(this, "language", (value) => {
      return (
        languages.find((item) => item.language === value)?.label ??
        labels.language
      );
    });

    dropdown.on("execute", (evt) => {
      this.fire("languageChange", dropdownItemValue(evt.source) as string);
    });

    this._focusables.add(labeledDropdown);

    return labeledDropdown;
  }

  private _createRuntimeInput(
    runtimes: Array<CodeBlockRuntimeOption>,
    labels: CodeBlockSettingsLabels,
  ): LabeledFieldView<DropdownView> {
    const labeledDropdown = new LabeledFieldView<DropdownView>(
      this.locale,
      createLabeledDropdown,
    );

    labeledDropdown.label = labels.runtime;
    labeledDropdown.bind("isEmpty").to(this, "runtime", (value) => !value);

    const dropdown = labeledDropdown.fieldView;
    const items = new Collection<ListDropdownItemDefinition>();

    const options: Array<
      CodeBlockRuntimeOption | {value: null; label: string}
    > = [{value: null, label: labels.noRuntime}, ...runtimes];

    for (const {value, label} of options) {
      const model = new UIModel({
        _value: value,
        label,
        role: "menuitemradio",
        withText: true,
      });

      model
        .bind("isOn")
        .to(this, "runtime", (runtime) => (runtime ?? null) === value);

      items.add({type: "button", model});
    }

    addListToDropdown(dropdown, items, {
      role: "menu",
      ariaLabel: labels.runtime,
    });

    dropdown.buttonView.set({withText: true, tooltip: labels.runtime});
    dropdown.buttonView.bind("label").to(this, "runtime", (value) => {
      return (
        runtimes.find((item) => item.value === value)?.label ?? labels.noRuntime
      );
    });

    dropdown.on("execute", (evt) => {
      this.fire("runtimeChange", dropdownItemValue(evt.source));
    });

    this._focusables.add(labeledDropdown);

    return labeledDropdown;
  }

  private _createEditableSwitch(
    labels: CodeBlockSettingsLabels,
  ): SwitchButtonView {
    const view = new SwitchButtonView(this.locale);

    view.set({
      label: labels.editableCode,
      withText: true,
      class: "ck-code-block-settings__switch",
    });

    view.bind("isOn").to(this, "isEditable");

    view.on("execute", () => {
      this.fire("editableChange", !this.isEditable);
    });

    this._focusables.add(view);

    return view;
  }

  /**
   * Where the author says which ports the snippet serves on. What is typed is
   * kept as it is typed until it is committed, so that a half-written list is
   * not read as a port.
   */
  private _createPortsInput(
    labels: CodeBlockSettingsLabels,
  ): LabeledFieldView<InputTextView> {
    const view = new LabeledFieldView<InputTextView>(
      this.locale,
      createLabeledInputText,
    );

    view.label = labels.ports;
    view.class = "ck-code-block-settings__ports";
    view.fieldView.placeholder = labels.portsPlaceholder;

    view.bind("isEnabled").to(this, "canRun");

    // what is typed is announced as it is typed; the field itself is filled in
    // when the panel opens, so a list is not rewritten under the author's
    // cursor as they write it.
    view.fieldView.on("input", () => {
      this.fire("portsChange", view.fieldView.element?.value ?? "");
    });

    this._focusables.add(view);

    return view;
  }

  private _createTerminalSwitch(
    labels: CodeBlockSettingsLabels,
  ): SwitchButtonView {
    const view = new SwitchButtonView(this.locale);

    view.set({
      label: labels.terminal,
      withText: true,
      class: "ck-code-block-settings__switch",
    });

    view.bind("isOn").to(this, "hasTerminal");

    view.on("execute", () => {
      this.fire("terminalChange", !this.hasTerminal);
    });

    this._focusables.add(view);

    return view;
  }

  private _createLogsSwitch(labels: CodeBlockSettingsLabels): SwitchButtonView {
    const view = new SwitchButtonView(this.locale);

    view.set({
      label: labels.logs,
      withText: true,
      class: "ck-code-block-settings__switch",
    });

    view.bind("isOn").to(this, "hasLogs");

    view.on("execute", () => {
      this.fire("logsChange", !this.hasLogs);
    });

    this._focusables.add(view);

    return view;
  }

  /**
   * One of the two names above the box: what the snippet printed, and what its
   * container wrote. The second is only there when the author offered it.
   */

  private _createRunButton(labels: CodeBlockSettingsLabels): ButtonView {
    const view = new ButtonView(this.locale);

    view.set({
      icon: IconPlay,
      withText: true,
      class: "ck-code-block-settings__run",
    });

    view.bind("isVisible").to(this, "canRun");
    view
      .bind("label")
      .to(this, "isRunning", (isRunning) =>
        isRunning ? labels.running : labels.run,
      );
    view.bind("isEnabled").to(this, "isRunning", (isRunning) => !isRunning);

    view.on("execute", () => {
      this.fire("run");
    });

    this._focusables.add(view);

    return view;
  }
}
