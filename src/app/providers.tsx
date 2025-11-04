'use client'

import {ReactNode} from "react";
import {
  createTheme,
  MantineProvider,
  DirectionProvider,
  CSSVariablesResolver,
} from "@mantine/core";
import {Notifications} from "@mantine/notifications";
import {QueryClientProvider} from "@/components/query-client-provider";
import {vazir, roboto_mono} from "./fonts";
import CookiesProvider from "@/lib/cookie/react/CookiesProvider";
import CodeHighlightProvider from "@/features/code-highlight/CodeHighlightProvider";

const theme = createTheme({
  fontFamily: vazir.style.fontFamily,
  fontFamilyMonospace: roboto_mono.style.fontFamily,
  headings: {
    fontFamily: vazir.style.fontFamily,
  },
});

const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {
    "--mantine-color-default": theme.colors.gray[0],
  },
  dark: {
  },
});

type Props = {
  children: ReactNode;
};

export function Providers({children}: Props) {
  return (
    <QueryClientProvider>
      <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="dark">
        <CodeHighlightProvider>
          <Notifications position="bottom-left" autoClose={3000} />
          <DirectionProvider initialDirection="rtl">
            <CookiesProvider>
              {children}
            </CookiesProvider>
          </DirectionProvider>
        </CodeHighlightProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
