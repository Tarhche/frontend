"use client";

import NextLink from "next/link";
import type {ComponentPropsWithoutRef, ForwardedRef} from "react";
import {forwardRef} from "react";
import {useLanguage} from "@/components/language/language-context";

export type AppLinkProps = ComponentPropsWithoutRef<typeof NextLink>;

// Paths that are never language-prefixed.
const NON_LOCALIZED_PREFIXES = ["/dashboard", "/auth", "/api"];

function localizeHref(href: string, activeCode: string, codes: string[]): string {
  if (!href.startsWith("/")) {
    return href; // external, anchor, or relative
  }

  if (
    NON_LOCALIZED_PREFIXES.some(
      (prefix) => href === prefix || href.startsWith(`${prefix}/`),
    )
  ) {
    return href;
  }

  const firstSegment = href.split(/[/?#]/).filter(Boolean)[0];
  // Already language-prefixed — don't add it again. `activeCode` is checked too
  // so we stay idempotent even if `codes` is momentarily empty/stale.
  if (firstSegment && (codes.includes(firstSegment) || firstSegment === activeCode)) {
    return href;
  }

  return href === "/" ? `/${activeCode}` : `/${activeCode}${href}`;
}

// Drop-in replacement for next/link that, when rendered inside a
// `LanguageProvider` (i.e. on public pages), prefixes internal public hrefs with
// the active language. Outside the provider it behaves like next/link.
const Link = forwardRef(function Link(
  props: AppLinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const language = useLanguage();
  let {href} = props;

  if (language && language.activeCode && typeof href === "string") {
    href = localizeHref(href, language.activeCode, language.codes);
  }

  return <NextLink ref={ref} {...props} href={href} />;
});

export default Link;
