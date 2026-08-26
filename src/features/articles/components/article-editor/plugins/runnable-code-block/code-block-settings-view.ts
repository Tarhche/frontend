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
  type DropdownView,
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
  run: string;
  running: string;
  programOutput: string;
  clearOutput: string;
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
 * `languageChange`, `runtimeChange`, `editableChange`, `run` and `clearOutput`
 * events, which the plugin wires to commands.
 */
export class CodeBlockSettingsView extends View {
  public readonly focusTracker = new FocusTracker();
  public readonly keystrokes = new KeystrokeHandler();

  public readonly languageInput: LabeledFieldView<DropdownView>;
  public readonly runtimeInput: LabeledFieldView<DropdownView>;
  public readonly editableSwitch: SwitchButtonView;
  public readonly runButton: ButtonView;
  public readonly clearOutputButton: ButtonView;

  /** The language of the code block the panel is attached to. */
  declare public language: string | null;
  /** The runtime of the code block, `null` when not runnable. */
  declare public runtime: string | null;
  /** Whether readers may edit the code before running it. */
  declare public isEditable: boolean;
  /** Output of the last run, `null` when the code has not been run yet. */
  declare public output: string | null;
  declare public isRunning: boolean;
  declare public hasError: boolean;
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
      output: null,
      isRunning: false,
      hasError: false,
      canRun: false,
    });

    this.languageInput = this._createLanguageInput(languages, labels);
    this.runtimeInput = this._createRuntimeInput(runtimes, labels);
    this.editableSwitch = this._createEditableSwitch(labels);
    this.runButton = this._createRunButton(labels);
    this.clearOutputButton = this._createClearOutputButton(labels);

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
          children: [this.languageInput, this.runtimeInput],
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
          children: [this.editableSwitch, this.runButton],
        },
        {
          tag: "div",
          attributes: {
            class: [
              "ck",
              "ck-code-block-settings__output",
              bind.if("output", "ck-hidden", (value) => !value),
              bind.if("hasError", "ck-code-block-settings__output_error"),
            ],
          },
          children: [
            {
              tag: "div",
              attributes: {class: ["ck", "ck-code-block-settings__output-bar"]},
              children: [
                {
                  tag: "span",
                  children: [{text: labels.programOutput}],
                },
                this.clearOutputButton,
              ],
            },
            {
              tag: "pre",
              attributes: {
                class: ["ck", "ck-code-block-settings__output-text"],
                dir: "ltr",
              },
              children: [{text: bind.to("output", (value) => value ?? "")}],
            },
          ],
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

  private _createClearOutputButton(
    labels: CodeBlockSettingsLabels,
  ): ButtonView {
    const view = new ButtonView(this.locale);

    view.set({
      icon: IconCancel,
      label: labels.clearOutput,
      tooltip: true,
      class: "ck-code-block-settings__clear",
    });

    view.on("execute", () => {
      this.fire("clearOutput");
    });

    this._focusables.add(view);

    return view;
  }
}
