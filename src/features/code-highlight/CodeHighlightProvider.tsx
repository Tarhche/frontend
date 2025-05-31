'use client'
import { CodeHighlightAdapterProvider, createHighlightJsAdapter } from '@mantine/code-highlight';
import hljs from 'highlight.js/lib/core';
import tsLang from 'highlight.js/lib/languages/typescript';
import jsLang from 'highlight.js/lib/languages/javascript';
import goLang from 'highlight.js/lib/languages/go';
import 'highlight.js/styles/atom-one-light.min.css'

hljs.registerLanguage('typescript', tsLang);
hljs.registerLanguage('javascript', jsLang);
hljs.registerLanguage('go', goLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

function CodeHighlightProvider({children}) {
  return (
    <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
      {children}
    </CodeHighlightAdapterProvider>
  );
}

export default CodeHighlightProvider;
