'use client';

import type { ReactNode } from 'react';
import {
  CodeHighlightAdapterProvider,
  stripShikiCodeBlocks,
} from '@mantine/code-highlight';

import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers';

import { darkTheme, lightTheme } from './code-highlight-themes';

async function loadShiki() {
  const { createHighlighter } = await import('shiki');
  const shiki = await createHighlighter({
    langs: ['tsx', 'scss', 'html', 'bash', 'json'],
    themes: [],
  });

  return shiki;
}

const customShikiAdapter: any = {
  loadContext: loadShiki,

  getHighlighter: (ctx: any) => {
    if (!ctx) {
      return ({ code }: { code: string }) => ({
        highlightedCode: code,
        isHighlighted: false,
      });
    }

    return ({
              code,
              language,
              colorScheme,
            }: {
      code: string;
      language: string;
      colorScheme: 'light' | 'dark';
    }) => ({
      isHighlighted: true,
      highlightedCode: stripShikiCodeBlocks(
        ctx.codeToHtml(code, {
          lang: language,
          theme: (colorScheme === 'light' ? lightTheme : darkTheme) as any,
          transformers: [transformerNotationDiff(), transformerNotationHighlight()],
        })
      ),
    });
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
