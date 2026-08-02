import {type Metadata} from "next";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {Container, Box, Group, Title} from "@mantine/core";
import {IconMessage} from "@tabler/icons-react";
import {Content} from "@/features/notes/components/note-detail";
import {
  Comments,
  CommentsSkeleton,
} from "@/features/comments/components/content-comments";
import {NotFound} from "@/components/not-found";
import Element from "@/features/elements/element";
import {fetchNoteByCorrelationUUID} from "@/dal/public/notes";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  params: Promise<{
    lang: string;
    slug?: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata | null> {
  const params = await props.params;
  const slug = params.slug;
  if (slug === undefined) {
    return null;
  }

  const note = await fetchNoteByCorrelationUUID(slug, params.lang);
  if (!note) {
    return null;
  }

  const {t} = getDictionary(params.lang);
  const name = note.author?.name || note.author?.username || "";

  return {title: t("notes.detail.metaTitle", {name})};
}

async function NoteDetailPage(props: Props) {
  const params = await props.params;
  const {slug, lang} = params;
  const {t} = getDictionary(lang);

  if (slug === undefined) {
    notFound();
  }

  const note = await fetchNoteByCorrelationUUID(slug!, lang);

  // The note isn't available in this language: render not-found as plain
  // content (no thrown notFound mid-stream, so it can't get stuck on loading).
  if (!note) {
    return (
      <Container
        component="section"
        px={{base: "0", sm: "md"}}
        size="sm"
        mt="xl"
      >
        <NotFound
          title={t("notes.detail.notFoundTitle")}
          text={t("notes.detail.notFoundText")}
        />
      </Container>
    );
  }

  // Comments belong to the note group within a language, so they are keyed by
  // the correlation uuid (shared across translations) plus the language code,
  // not the per-language uuid.
  const correlationUUID = note.correlation_uuid;
  const languageCode = note.language_code?.code ?? lang;
  const pageElements = note.elements ?? [];

  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <Content
        note={note}
        correlationUUID={correlationUUID}
        languageCode={languageCode}
        elements={pageElements}
      />
      <Element
        style={{marginTop: "1rem"}}
        type="jumbotron"
        elements={pageElements}
      />
      <Element
        style={{marginTop: "1rem"}}
        type="featured"
        elements={pageElements}
      />
      <Element
        style={{marginTop: "1rem"}}
        type="cards"
        elements={pageElements}
      />
      <Box mt={"xl"}>
        <Group align="center" gap={"sm"}>
          <IconMessage />
          <Title ta={"right"} order={3}>
            {t("notes.detail.comments")}
          </Title>
        </Group>
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments
            objectType="note"
            correlationUUID={correlationUUID}
            languageCode={languageCode}
          />
        </Suspense>
      </Box>
    </Container>
  );
}

export default NoteDetailPage;
