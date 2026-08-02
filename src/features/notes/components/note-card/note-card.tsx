"use client";

import Link from "@/components/link";
import {Badge, Box, Button, Group, Text} from "@mantine/core";
import {IconArrowRight, IconClockHour2} from "@tabler/icons-react";
import {AuthorLink} from "@/features/authors/components";
import {type Author} from "@/features/authors/types";
import {formatDate} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {useTranslations} from "@/i18n/provider";
import {noteExcerpt} from "../../utils/note-excerpt";
import classes from "./note-card.module.css";

type Props = {
  note: {
    correlationUuid: string;
    body: string;
    publishedDate: string;
    tags: string[];
    author?: Partial<Author>;
  };
  // Listings that already belong to one author — their own page — turn this off,
  // since repeating the same name on every card says nothing. Listings that mix
  // authors, such as a hashtag, leave it on.
  showAuthor?: boolean;
};

// A note has no title or cover, so the card leads with the first three lines of
// the body and ends with its tags — the same place articles show theirs.
export function NoteCard({note, showAuthor = true}: Props) {
  const t = useTranslations();
  const {excerpt} = noteExcerpt(note.body);
  const href = APP_PATHS.notes.detail(note.correlationUuid);

  return (
    <Box component="article" p="lg" className={classes.card}>
      {/* With no author to balance against, the date keeps its corner rather
          than sliding to the start of the row. */}
      <Group
        justify={showAuthor ? "space-between" : "flex-end"}
        wrap="nowrap"
        gap="sm"
      >
        {showAuthor && <AuthorLink author={note.author} size={32} />}
        <Group gap={5} wrap="nowrap" c="dimmed">
          <IconClockHour2 size="1rem" />
          <Text size="xs" c="dimmed">
            {formatDate(note.publishedDate)}
          </Text>
        </Group>
      </Group>

      <Text mt="md" size="sm" className={classes.excerpt}>
        {excerpt}
      </Text>

      {note.tags.length > 0 && (
        <Group gap="xs" mt="md">
          {note.tags.map((tag) => (
            <Badge
              key={tag}
              variant="light"
              radius="sm"
              component={Link}
              href={`/hashtags/${encodeURIComponent(tag)}`}
              style={{cursor: "pointer"}}
            >
              #{tag}
            </Badge>
          ))}
        </Group>
      )}

      <Group justify="flex-end" mt="md">
        <Button
          component={Link}
          href={href}
          variant="light"
          size="compact-sm"
          rightSection={<IconArrowRight size={16} />}
        >
          {t("notes.list.readMore")}
        </Button>
      </Group>
    </Box>
  );
}
