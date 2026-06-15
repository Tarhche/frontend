import type {Metadata} from "next";
import {cookies} from "next/headers";
import {ColorSchemeScript, mantineHtmlProps} from "@mantine/core";
import Providers from "../components/providers/providers";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {localeFromLanguageCode} from "@/i18n/config";
import {translations} from "@/i18n/translations";
import {getServerDictionary} from "@/i18n/server";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import {vazir} from "./fonts";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  const brand = t("nav.brand");
  return {
    title: {
      default: brand,
      template: `%s | ${brand}`,
    },
    description: t("footer.tagline"),
    icons: ICONS,
  };
}

const ICONS = {
  icon: [
    {url: "/icon.svg", type: "image/svg+xml"},
    {url: "/icon-16x16.png", sizes: "16x16", type: "image/png"},
    {url: "/icon-32x32.png", sizes: "32x32", type: "image/png"},
    {url: "/icon-64x64.png", sizes: "64x64", type: "image/png"},
    {url: "/icon-128x128.png", sizes: "128x128", type: "image/png"},
    {url: "/icon-180x180.png", sizes: "180x180", type: "image/png"},
    {url: "/icon-512x512.png", sizes: "512x512", type: "image/png"},
    {
      url: "/icon-dark.svg",
      media: "(prefers-color-scheme: dark)",
      type: "image/svg+xml",
    },
    {
      url: "/icon.svg",
      media: "(prefers-color-scheme: light)",
      type: "image/svg+xml",
    },
  ],
  apple: [{url: "/icon-180x180.png", sizes: "180x180"}],
  shortcut: ["/favicon.ico"],
} satisfies Metadata["icons"];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Best-effort initial language/direction from cookie/token so the first paint
  // matches; the client I18nProvider then syncs to the URL-resolved language on
  // public pages.
  const store = await cookies();
  const initialLanguageCode =
    (await resolvePreferredLanguageCode({
      accessToken: store.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
      cookieLanguage: store.get(LANGUAGE_COOKIE_NAME)?.value,
    })) ?? undefined;
  const locale = localeFromLanguageCode(initialLanguageCode);
  const direction = translations[locale].direction;

  return (
    <html lang={locale} dir={direction} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={`${vazir.className}`}>
        <Providers
          initialLanguageCode={initialLanguageCode}
          initialDirection={direction}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
