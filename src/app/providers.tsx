import {ReactNode, Suspense} from "react";
import {createTheme, MantineProvider, DirectionProvider} from "@mantine/core";
import {Notifications} from "@mantine/notifications";
import {QueryClientProvider} from "@/components/query-client-provider";
import {vazir, roboto_mono} from "./fonts";
import {AuthInterceptors} from "@/components/auth/AuthInterceptors";

const theme = createTheme({
  fontFamily: vazir.style.fontFamily,
  fontFamilyMonospace: roboto_mono.style.fontFamily,
  headings: {
    fontFamily: vazir.style.fontFamily,
  },
});

type Props = {
  children: ReactNode;
};

export async function Providers({children}: Props) {
  return (
    <QueryClientProvider>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Suspense>
          <AuthInterceptors />
        </Suspense>
        <Notifications position="bottom-left" autoClose={3000} />
        <DirectionProvider initialDirection="rtl">
          {children}
        </DirectionProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
