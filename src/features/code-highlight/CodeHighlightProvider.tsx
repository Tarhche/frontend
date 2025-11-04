'use client';

import type { ReactNode } from 'react';
import { CodeHighlightAdapterProvider, stripShikiCodeBlocks } from '@mantine/code-highlight';

import { 
  transformerNotationDiff, 
  transformerNotationHighlight, 
  transformerNotationFocus, 
  transformerMetaHighlight,
} from '@shikijs/transformers'

import { darkTheme, lightTheme } from './code-highlight-themes';

const preloadedLanguages = [
  'tsx', 'scss', 'html', 'bash', 
  'json', 'javascript', 'typescript', 'css', 
  'markdown', 'go', 'python', 'java', 'kotlin', 
  'rust', 'php', 'ruby', 'swift', 'dart', 'scala',
];

async function loadShiki() {
  const { createHighlighter } = await import('shiki');
  const highlighter = await createHighlighter({
    langs: preloadedLanguages,
    themes: [],
  });

  return highlighter;
}

const customShikiAdapter: any = {
  loadContext: loadShiki,

  getHighlighter: (ctx: any) => {
    if (!ctx) {
      return ({ code }: { code: string }) => ({highlightedCode: code, isHighlighted: false });
    }

    return ({ code, language, colorScheme }) => {

      // if the language is not loaded don't highlight it
      if (!ctx.getLoadedLanguages().includes(language)) {
        return {highlightedCode: code, isHighlighted: false };
      }

      return {
        isHighlighted: true,
        highlightedCode: stripShikiCodeBlocks(
          ctx.codeToHtml(code, {
            lang: language,
            theme: (colorScheme === 'light' ? lightTheme : darkTheme) as any,
            transformers: [
              transformerNotationDiff(), 
              transformerNotationHighlight(), 
              transformerNotationFocus(), 
              transformerMetaHighlight(),
            ],
          })
        ),
      };
    };
  },
};

type CodeHighlightProviderProps = {
  children: ReactNode;
};

function CodeHighlightProvider({ children }: CodeHighlightProviderProps) {
  return (
    <CodeHighlightAdapterProvider adapter={customShikiAdapter}>
      {children}
    </CodeHighlightAdapterProvider>
  );
}

export default CodeHighlightProvider;
