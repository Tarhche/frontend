import parse, {Element, domToReact} from "html-react-parser";
import Image from "next/image";
import {ImageZoom} from "@/components/image-zoom";
import "@mantine/code-highlight/styles.css";
import CodeHighlight from "@/features/code-highlight/CodeHighlight";

export function parseArticleBodyToReact(html: string) {
  return parse(html, {
    replace(domNode) {
      if (domNode instanceof Element && domNode.name === "pre") {
        const codeElement = domNode.children.find((child) => {
          if (child instanceof Element && child.name === "code") {
            return true;
          }
          return false;
        });

        if (codeElement instanceof Element && codeElement.childNodes) {
          // @ts-expect-error I think because childNodes comes from react-html-parse this is okay to do
          const codeContent = domToReact(codeElement.childNodes).toString();
          const language = codeElement.attribs.class.replace("language-", "");

          let executable: any = null;
          const executableAttribs = Object.entries(codeElement.attribs)
            .filter(([key]) => key.startsWith("data-executable"));

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
                      : chunk.charAt(0).toUpperCase() + chunk.slice(1)
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
      } else if (domNode instanceof Element && domNode.name === "img") {
        const {src, alt} = domNode.attribs;

        return (
          <ImageZoom>
            <Image
              width={1200}
              height={720}
              alt={alt || "article figures"}
              src={src}
            />
          </ImageZoom>
        );
      }
    },
  });
}
