import {ReactNode} from "react";
import {DirectionProvider} from "@mantine/core";
import {Notifications} from "@mantine/notifications";
import {QueryClientProvider} from "@/components/query-client-provider";
import CookiesProvider from "@/lib/cookie/react/CookiesProvider";
import CodeHighlightProvider from "@/features/code-highlight/CodeHighlightProvider";
import MantineProvider from "@/components/providers/MantineProvider";

type Props = {
  children: ReactNode;
};

export default function Providers({children}: Props) {
  return (
    <QueryClientProvider>
      <MantineProvider>
        <CodeHighlightProvider>
          <Notifications position="bottom-left" autoClose={3000} />
          <DirectionProvider initialDirection="rtl">
            <CookiesProvider>{children}</CookiesProvider>
          </DirectionProvider>
        </CodeHighlightProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
