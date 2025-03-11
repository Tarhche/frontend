"use client";
import {useState, useMemo, type RefObject} from "react";
import {ClassicEditor, EditorConfig} from "ckeditor5";
import {CKEditor} from "@ckeditor/ckeditor5-react";
import {Modal} from "@mantine/core";
import {FilesExplorer} from "@/components/files-explorer";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import {editorConfig} from "./editor-config";
import "ckeditor5/ckeditor5.css";
import "./article-editor.css";

export type EditorRef = CKEditor<ClassicEditor>;

type Props = {
  initialData?: string;
  editorRef?: RefObject<EditorRef | null>;
};

export function ArticleEditor({initialData, editorRef}: Props) {
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);

  const config: EditorConfig = useMemo(() => {
    return {
      ...editorConfig,
      fileExplorer: {
        onOpen: setIsFileExplorerOpen.bind(null, true),
      },
      initialData: initialData || "",
    };
  }, [initialData]);

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
