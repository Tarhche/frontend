import {Box, Group, Text} from "@mantine/core";
import {IconClockHour2} from "@tabler/icons-react";
import {parseArticleBodyToReact} from "@/features/articles/utils/article-body-parser";
import ArticleTags from "@/features/articles/components/article-tags/ArticleTags";
import {AuthorLink} from "@/features/authors/components";
import Element from "@/features/elements/element";
import {BookmarkButton} from "@/features/bookmarks/components/bookmark-button";
import {checkBookmarkStatus} from "@/dal/private/bookmarks";
import {NoteEditButton} from "./note-edit-button";
import {noteExcerpt} from "../../utils/note-excerpt";
import {formatDate} from "@/lib/date-and-time";
import classes from "./content.module.css";

type Props = {
  note: any;
  // The note's correlation uuid (shared across translations), used with the
  // language code to key bookmarks and to address the dashboard editor.
  correlationUUID: string;
  languageCode: string;
  elements?: {type: string; body: {[key: string]: any}}[];
};

export async function Content({
  note,
  correlationUUID,
  languageCode,
  elements = [],
}: Props) {
  const isBookmarked = await checkBookmarkStatus(
    "note",
    correlationUUID,
    languageCode,
  );

  // Bookmarks are listed by title, which a note doesn't have — its opening line
  // stands in so the entry is recognisable in the dashboard.
  const bookmarkTitle = noteExcerpt(note.body, 1).excerpt;

  return (
    <article className={classes.sheet}>
      <Group wrap="nowrap" c="dimmed" mb="md" justify="space-between">
        <Group gap="md" wrap="nowrap">
          <AuthorLink author={note.author} />
          <Group gap={5} wrap="nowrap">
            <IconClockHour2 spacing={0} size={20} />
            <Text size="sm" c="dimmed" mt={4}>
              {formatDate(note.published_at)}
            </Text>
          </Group>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <NoteEditButton
            correlationUuid={correlationUUID}
            languageCode={languageCode}
            authorUuid={note.author?.uuid}
          />
          {isBookmarked === undefined ? null : (
            <BookmarkButton
              objectType="note"
              correlationUUID={correlationUUID}
              isBookmarked={isBookmarked}
              title={bookmarkTitle}
              languageCode={languageCode}
            />
          )}
        </Group>
      </Group>
      <Element
        style={{marginBottom: "var(--mantine-spacing-xl)"}}
        type="stack"
        elements={elements}
        currentUuid={correlationUUID}
      />
      <Box className={classes.content}>
        {parseArticleBodyToReact(note.body)}
      </Box>
      <ArticleTags tags={note.tags ?? []} />
    </article>
  );
}
