import {ReactNode} from "react";
import {DirectionProvider} from "@mantine/core";
import {Notifications} from "@mantine/notifications";
import {QueryClientProvider} from "@/components/query-client-provider";
import CookiesProvider from "@/lib/cookie/react/CookiesProvider";
import CodeHighlightProvider from "@/features/code-highlight/CodeHighlightProvider";
import MantineProvider from "@/components/providers/MantineProvider";
import {I18nProvider} from "@/i18n/provider";
import {type Direction} from "@/i18n/config";

type Props = {
  children: ReactNode;
  initialLanguageCode?: string;
  initialDirection: Direction;
};

export default function Providers({
  children,
  initialLanguageCode,
  initialDirection,
}: Props) {
  return (
    <QueryClientProvider>
      <MantineProvider>
        <CodeHighlightProvider>
          <Notifications position="bottom-left" autoClose={3000} />
          <DirectionProvider initialDirection={initialDirection}>
            <I18nProvider initialLanguageCode={initialLanguageCode}>
              <CookiesProvider>{children}</CookiesProvider>
            </I18nProvider>
          </DirectionProvider>
        </CodeHighlightProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
