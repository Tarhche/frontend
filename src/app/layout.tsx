import type {Metadata} from "next";
import {ColorSchemeScript, mantineHtmlProps} from "@mantine/core";
import {Providers} from "./providers";
import {vazir} from "./fonts";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "طرح‌چه",
    template: "%s | طرح‌چه",
  },
  description: "طرح‌چه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={`${vazir.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
