import parse, {domToReact} from "html-react-parser";
import Image from "next/image";
import {ImageZoom} from "@/components/image-zoom";
import "@mantine/code-highlight/styles.css";
import CodeHighlight from "@/features/code-highlight/CodeHighlight";
import Sandpack from "@/components/html-code-preview/sandpack/Sandpack";

const isTag = (node: any, name?: string): boolean =>
  node?.type === "tag" && (name === undefined || node.name === name);

export function parseArticleBodyToReact(html: string) {
  return parse(html, {
    replace(domNode: any) {
      if (isTag(domNode, "pre")) {
        const codeElement = domNode.children.find((child: any) =>
          isTag(child, "code"),
        );

        if (isTag(codeElement) && codeElement.childNodes) {
          const codeContent = domToReact(codeElement.childNodes).toString();
          const language = codeElement.attribs.class.replace("language-", "");

          let executable: any = null;
          const executableAttribs = Object.entries(codeElement.attribs).filter(
            ([key]) => key.startsWith("data-executable"),
          );

          if (executableAttribs.length > 0) {
            executable = {};

            for (const [fullKey, value] of executableAttribs) {
              const parts = fullKey
                .replace(/^data-executable/, "")
                .replace(/^-/, "")
                .split("-");

              let propName;
              if (parts.length === 1 && parts[0] === "") {
                propName = "value";
              } else {
                propName = parts
                  .map((chunk, idx) =>
                    idx === 0
                      ? chunk
                      : chunk.charAt(0).toUpperCase() + chunk.slice(1),
                  )
                  .join("");
              }
              executable[propName] = value;
            }
          }

          return (
            <>
              <CodeHighlight
                executable={executable}
                code={codeContent}
                language={language.trim()}
              />
            </>
          );
        }

        return null;
      } else if (isTag(domNode, "img")) {
        const {src, alt} = domNode.attribs;

        return (
          <ImageZoom>
            <Image
              width={1920}
              height={1080}
              alt={alt || "article figures"}
              src={src}
            />
          </ImageZoom>
        );
      } else if (isTag(domNode, "sandpack")) {
        const codeText = getText(domNode);

        if (!codeText) return null;

        const code = JSON.parse(codeText);

        return (
          <>
            <Sandpack {...code} />
          </>
        );
      }
    },
  });
}

const getText = (node) => {
  if (!node) return "";
  if (typeof node === "string") return node; // some parsers use strings for text nodes
  if (node.type === "text") return node.data || node.value || "";
  const kids = node.children || node.childNodes || [];
  return kids.map(getText).join("");
};
