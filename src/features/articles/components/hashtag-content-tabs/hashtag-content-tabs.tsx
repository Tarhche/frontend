"use client";

import {IconNote, IconNotes} from "@tabler/icons-react";
import {ContentTabs} from "@/components/content-tabs";
import {useTranslations} from "@/i18n/provider";
import {type HashtagContentType} from "@/dal/public/hashtags";

type Props = {
  hashtag: string;
  active: HashtagContentType;
  totals: {
    articles: number;
    notes: number;
  };
};

// Switches a hashtag page between its articles and its notes. Each link drops
// `page`, so switching lands on the first page — the only one both tabs are
// guaranteed to have.
export function HashtagContentTabs({hashtag, active, totals}: Props) {
  const t = useTranslations();
  const basePath = `/hashtags/${encodeURIComponent(hashtag)}`;

  return (
    <ContentTabs
      active={active}
      tabs={[
        {
          value: "article",
          label: t("articles.hashtags.articlesTab"),
          icon: IconNotes,
          href: `${basePath}?tab=article`,
          count: totals.articles,
        },
        {
          value: "note",
          label: t("articles.hashtags.notesTab"),
          icon: IconNote,
          href: `${basePath}?tab=note`,
          count: totals.notes,
        },
      ]}
    />
  );
}
