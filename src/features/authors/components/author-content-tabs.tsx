"use client";

import {IconNote, IconNotes} from "@tabler/icons-react";
import {ContentTabs, type ContentTab} from "@/components/content-tabs";
import {useTranslations} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {getAuthorIdentity, type Author, type AuthorContentType} from "../types";

type Props = {
  author: Pick<Author, "uuid" | "username">;
  active: AuthorContentType;
  totals: {
    articles: number;
    notes: number;
  };
};

// Switches an author page between their articles and their notes. Each link
// drops `page`, so switching lands on the first page — the only one both tabs
// are guaranteed to have.
export function AuthorContentTabs({author, active, totals}: Props) {
  const t = useTranslations();
  const identity = getAuthorIdentity(author);

  const tabs: ContentTab[] = [
    {
      value: "article",
      label: t("authors.viewArticles"),
      icon: IconNotes,
      href: APP_PATHS.authors.tab(identity, "article"),
      count: totals.articles,
    },
    {
      value: "note",
      label: t("authors.viewNotes"),
      icon: IconNote,
      href: APP_PATHS.authors.tab(identity, "note"),
      count: totals.notes,
    },
  ];

  return <ContentTabs tabs={tabs} active={active} />;
}
