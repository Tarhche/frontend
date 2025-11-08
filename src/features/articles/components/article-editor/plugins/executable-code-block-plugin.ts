import {
  addListToDropdown,
  Collection,
  Command,
  createDropdown,
  Plugin,
  ViewModel as Model,
} from "ckeditor5";
import {ModelElement} from "@ckeditor/ckeditor5-engine/src/model/element";
import {RUNTIMES} from "@/constants";

const EXECUTABLE = "executable";

// Special entry to clear the runtime attribute
const CLEAR_RUNTIME = {value: null, label: "Clear"};

export class ExecutableCodeBlockPlugin extends Plugin {
  public static get requires() {
    return ["CodeBlock"] as const;
  }
  public static get pluginName() {
    return "ExecutableCodeBlock" as const;
  }

  init() {
    const {editor} = this;

    /* 1. schema ---------------------------------------------------- */
    editor.model.schema.extend("codeBlock", {allowAttributes: [EXECUTABLE]});

    /* 2. conversion ------------------------------------------------- */
    editor.conversion.for("upcast").attributeToAttribute({
      view: {name: "pre", key: `data-${EXECUTABLE}`},
      model: EXECUTABLE,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    editor.conversion.for("downcast").attributeToAttribute({
      model: EXECUTABLE,
      view: (v) => (v ? {key: `data-${EXECUTABLE}`, value: v} : null),
    });

    editor.commands.add(EXECUTABLE, new SetExecutableCommand(editor));

    this._createDropdown();
  }

  private _createDropdown() {
    const {editor} = this;
    const dropdown = createDropdown(editor.locale);
    const command = editor.commands.get(EXECUTABLE) as SetExecutableCommand;

    dropdown.buttonView.set({
      label: "Runtime",
      withText: true,
      tooltip: "Choose runtime for this code block",
    });

    dropdown.buttonView
      .bind("label")
      .to(command, "value", (v: any) =>
        v ? `Run: ${v.toUpperCase()}` : "Runtime",
      );

    dropdown.bind("isEnabled").to(command, "isEnabled");

    dropdown.buttonView.extendTemplate({
      attributes: {
        class: ["ck-button_fit_content"],
      },
    });

    const items = new Collection();

    const clearModel = new Model({
      label: CLEAR_RUNTIME.label,
      withText: true,
      commandParam: CLEAR_RUNTIME.value,
    });
    clearModel
      .bind("isOn")
      .to(command, "value", (value) => value === CLEAR_RUNTIME.value);

    items.add({type: "button", model: clearModel});

    for (const rt of RUNTIMES) {
      const itemModel = new Model({
        label: rt.label,
        withText: true,
        commandParam: rt.value,
      });

      // active condition
      itemModel
        .bind("isOn")
        .to(command, "value", (value) => value === rt.value);

      items.add({type: "button", model: itemModel});
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    addListToDropdown(dropdown, items);

    // on change
    this.listenTo(dropdown, "execute", (evt) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      editor.execute(EXECUTABLE, {value: evt.source.commandParam});
      editor.editing.view.focus();
    });

    editor.ui.componentFactory.add("executable", () => dropdown);
  }
}

class SetExecutableCommand extends Command {
  refresh() {
    const block = this._currentCodeBlock();
    this.isEnabled = !!block;
    this.value = block ? this.retrieveValueFromBlock(block) : null;
  }

  retrieveValueFromBlock(block: ModelElement) {
    const explicitAttr = block.getAttribute(EXECUTABLE);
    if (explicitAttr) return explicitAttr;

    const entries = Array.from(block.getAttributes());
    const htmlContent = (
      entries.find(([key]) => key === "htmlContentAttributes")?.[1] as
        | {attributes?: Record<string, any>}
        | undefined
    )?.attributes;
    if (!htmlContent) return null;
    return htmlContent[`data-${EXECUTABLE}`] ?? null;
  }

  execute({value}: {value?: string | null} = {}) {
    const block = this._currentCodeBlock();
    if (!block) return;

    this.editor.model.change((writer) => {
      if (value) {
        writer.setAttribute(EXECUTABLE, value, block);
      } else {
        writer.removeAttribute(EXECUTABLE, block);
        const htmlSupport: any = block.getAttribute("htmlContentAttributes");
        if (htmlSupport?.attributes?.[`data-${EXECUTABLE}`]) {
          const attrs = {...htmlSupport.attributes};
          delete attrs[`data-${EXECUTABLE}`];

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          Object.keys(attrs).length
            ? writer.setAttribute(
                "htmlContentAttributes",
                {attributes: attrs},
                block,
              )
            : writer.removeAttribute("htmlContentAttributes", block);
        }
      }
    });
  }

  private _currentCodeBlock() {
    const {selection} = this.editor.model.document;
    return Array.from(selection.getSelectedBlocks()).find((el) =>
      el.is("element", "codeBlock"),
    );
  }
}
