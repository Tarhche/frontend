"use client";

import {useState, useMemo, type RefObject} from "react";
import {createPortal} from "react-dom";
import {ClassicEditor, EditorConfig} from "ckeditor5";
import {CKEditor} from "@ckeditor/ckeditor5-react";
import {Modal} from "@mantine/core";
import {FilesExplorer} from "@/components/files-explorer";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import {CodeRunSurface} from "@/features/code-highlight/code-run-surface";
import {type OpenPanel} from "@/features/code-highlight/run-workspace";
import {useI18n} from "@/i18n/provider";
import {localeFromLanguageCode} from "@/i18n/config";
import {getEditorConfig} from "./editor-config";
import "ckeditor5/ckeditor5.css";
import "./article-editor.css";

export type EditorRef = CKEditor<ClassicEditor>;

type Props = {
  initialData?: string;
  editorRef?: RefObject<EditorRef | null>;
  // Language of the article being written, which the content area's writing
  // direction follows — LTR for an English article, RTL for a Persian one.
  languageCode: string;
};

/** What the code block panel hands over when an author runs a snippet. */
type CodeSurface = {
  element: HTMLElement;
  runtime: string;
  code: string;
  ports: Array<number>;
  terminal: boolean;
  logs: boolean;
  onRunningChange: (running: boolean) => void;
};

export function ArticleEditor({initialData, editorRef, languageCode}: Props) {
  const {t, locale, direction} = useI18n();
  // the snippet an author is running, and where its surface is drawn.
  const [surface, setSurface] = useState<
    (CodeSurface & {token: number}) | null
  >(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);
  // CKEditor reads its languages once, when the instance is created, so the
  // `id` below re-creates it when either of them changes.
  const contentLocale = localeFromLanguageCode(languageCode);

  const config: EditorConfig = useMemo(() => {
    return {
      ...getEditorConfig(t, {ui: locale, content: contentLocale}),
      fileExplorer: {
        onOpen: setIsFileExplorerOpen.bind(null, true),
      },
      runnableCodeBlock: {
        // Running a snippet in the editor shows exactly what a reader is
        // shown: the panel hands over a box, and the surface below is drawn
        // into it.
        onRun: (surface: CodeSurface) =>
          setSurface({...surface, token: Date.now()}),
        translate: t,
        // The panel is translated by the app, so it follows the app direction.
        direction,
      },
      initialData: initialData || "",
    };
  }, [contentLocale, direction, initialData, locale, t]);

  return (
    <div className="main-container">
      {surface &&
        createPortal(
          <CodeRunSurface
            key={surface.token}
            runtime={surface.runtime}
            code={surface.code}
            ports={surface.ports}
            terminal={surface.terminal}
            logs={surface.logs}
            runToken={surface.token}
            open={openPanel}
            onOpen={setOpenPanel}
            onRunningChange={surface.onRunningChange}
          />,
          surface.element,
        )}
      <div className="editor-container editor-container_classic-editor editor-container_include-style editor-container_include-block-toolbar editor-container_include-word-count">
        <div className="editor-container__editor">
          {config && (
            <CKEditor
              editor={ClassicEditor}
              config={config}
              ref={editorRef}
              id={`${locale}:${contentLocale}`}
            />
          )}
        </div>
      </div>
      <Modal
        size="xl"
        opened={isFileExplorerOpen}
        withCloseButton={false}
        centered
        onClose={setIsFileExplorerOpen.bind(null, false)}
      >
        <FilesExplorer
          onSelect={(url) => {
            const editor = editorRef?.current?.editor;
            if (editor) {
              editor.model.change((writer) => {
                const imageElement = writer.createElement("imageBlock", {
                  src: `${FILES_PUBLIC_URL}/${url}`,
                });
                editor.model.insertContent(
                  imageElement,
                  editor.model.document.selection,
                );
                setIsFileExplorerOpen(false);
              });
            }
          }}
        />
      </Modal>
    </div>
  );
}
