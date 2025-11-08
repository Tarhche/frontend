"use client";

import React, {ReactNode} from "react";
import {
  createTheme,
  CSSVariablesResolver,
  MantineProvider as MaintineCoreProvider,
} from "@mantine/core";
import {roboto_mono, vazir} from "@/app/fonts";

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
  dark: {},
});

function MantineProvider({children}: {children: ReactNode}) {
  return (
    <MaintineCoreProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      {children}
    </MaintineCoreProvider>
  );
}

export default MantineProvider;
