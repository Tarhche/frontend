"use client";

import {useState, useMemo, type RefObject} from "react";
import {ClassicEditor, EditorConfig} from "ckeditor5";
import {CKEditor} from "@ckeditor/ckeditor5-react";
import {Modal} from "@mantine/core";
import {decode} from "js-base64";
import {FilesExplorer} from "@/components/files-explorer";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import {useWsPublish} from "@/hooks/use-ws-publish";
import {useI18n} from "@/i18n/provider";
import {getEditorConfig} from "./editor-config";
import "ckeditor5/ckeditor5.css";
import "./article-editor.css";

export type EditorRef = CKEditor<ClassicEditor>;

type Props = {
  initialData?: string;
  editorRef?: RefObject<EditorRef | null>;
};

export function ArticleEditor({initialData, editorRef}: Props) {
  const {t, direction} = useI18n();
  const publish = useWsPublish();
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);

  const config: EditorConfig = useMemo(() => {
    return {
      ...getEditorConfig(t),
      fileExplorer: {
        onOpen: setIsFileExplorerOpen.bind(null, true),
      },
      runnableCodeBlock: {
        // Runs snippets through the same channel the published article uses.
        onRun: async ({runtime, code}: {runtime: string; code: string}) => {
          const response = await publish<
            {runner: string; code: string},
            {logs: string | undefined} | undefined
          >("runCode", {runner: runtime, code});

          return response?.logs ? decode(response.logs) : "";
        },
        translate: t,
        // The panel is translated by the app, so it follows the app direction.
        direction,
      },
      initialData: initialData || "",
    };
  }, [direction, initialData, publish, t]);

  return (
    <div className="main-container">
      <div className="editor-container editor-container_classic-editor editor-container_include-style editor-container_include-block-toolbar editor-container_include-word-count">
        <div className="editor-container__editor">
          {config && (
            <CKEditor editor={ClassicEditor} config={config} ref={editorRef} />
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
