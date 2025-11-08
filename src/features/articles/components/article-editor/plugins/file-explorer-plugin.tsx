import {Plugin, ButtonView, IconBrowseFiles} from "ckeditor5";

export class FileExplorerPlugin extends Plugin {
  init() {
    const editor = this.editor;
    const openModalCallback = editor.config.get("fileExplorer.onOpen");

    editor.ui.componentFactory.add("fileExplorer", (locale) => {
      const view = new ButtonView(locale);

      view.set({
        label: "File explorer",
        icon: IconBrowseFiles,
        tooltip: true,
      });

      view.on("execute", () => {
        if (typeof openModalCallback === "function") {
          openModalCallback();
        }
      });

      return view;
    });
  }
}
