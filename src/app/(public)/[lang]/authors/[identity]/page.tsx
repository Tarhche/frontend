import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Container, Group, Stack, Text} from "@mantine/core";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {NoteCard} from "@/features/notes/components/note-card";
import {AuthorHeader, AuthorContentTabs} from "@/features/authors/components";
import {Pagination} from "@/components/pagination";
import Element from "@/features/elements/element";
import {fetchAuthorArticles, fetchAuthorNotes} from "@/dal/public/authors";
import {
  resolveAuthorTab,
  type AuthorContentType,
} from "@/features/authors/types";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  params: Promise<{
    lang: string;
    identity?: string;
  }>;
  searchParams: Promise<{
    page?: number | string;
    tab?: string;
  }>;
};

function resolveIdentity(rawIdentity: string) {
  const decoded = decodeURIComponent(rawIdentity);
  if (decoded.startsWith("@")) {
    return decoded.slice(1);
  }
  return decoded;
}

export async function generateMetadata(props: Props): Promise<Metadata | null> {
  const params = await props.params;
  if (!params.identity) {
    return null;
  }

  try {
    const data = await fetchAuthorArticles(resolveIdentity(params.identity), {
      headers: {[LANGUAGE_CODE_HEADER]: params.lang},
    });
    const name =
      data?.author?.name || data?.author?.username || params.identity;
    const {t} = getDictionary(params.lang);
    return {
      title: t("authors.metaTitle", {name}),
    };
  } catch {
    return null;
  }
}

// One page per author, with the two kinds of content behind tabs rather than
// behind sub-routes. `?tab` picks the tab; articles is the default.
export default async function AuthorPage(props: Props) {
  const params = await props.params;
  if (!params.identity) {
    notFound();
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const {t} = getDictionary(params.lang);

  const identity = resolveIdentity(params.identity!);
  const requestConfig = {
    params: {page},
    headers: {[LANGUAGE_CODE_HEADER]: params.lang},
  };

  let activeTab: AuthorContentType = resolveAuthorTab(searchParams.tab);
  let data: any;

  try {
    if (activeTab === "note") {
      data = await fetchAuthorNotes(identity, requestConfig);
      // The backend has no notes to serve for this author: fall back to the
      // articles they do have, rather than a not-found page for an author who
      // plainly exists.
      if (!data) {
        activeTab = "article";
      }
    }

    if (activeTab === "article") {
      data = await fetchAuthorArticles(identity, requestConfig);
    }
  } catch {
    notFound();
  }

  // No such author.
  if (!data) {
    notFound();
  }

  const {author, items, pagination, elements, totals} = data;
  const {total_pages, current_page} = pagination;
  const pageElements = elements ?? [];
  const isNotesTab = activeTab === "note";

  return (
    <Container size="sm" mt={50}>
      <AuthorHeader author={author} />
      <AuthorContentTabs
        author={author}
        active={activeTab}
        totals={{
          articles: totals?.articles ?? 0,
          notes: totals?.notes ?? 0,
        }}
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
      <Stack gap={"md"} mt={"lg"}>
        {items.length === 0 ? (
          <Text c={"dimmed"} ta={"center"} mt={"xl"}>
            {isNotesTab ? t("authors.noNotes") : t("authors.noArticles")}
          </Text>
        ) : (
          items.map((item: any) =>
            isNotesTab ? (
              <NoteCard
                key={item.correlation_uuid}
                note={{
                  correlationUuid: item.correlation_uuid,
                  body: item.body,
                  publishedDate: item.published_at,
                  tags: item.tags ?? [],
                }}
                showAuthor={false}
              />
            ) : (
              <VerticalArticleCard
                key={item.correlation_uuid}
                article={{
                  thumbnail: item.cover,
                  title: item.title,
                  subtitle: item.excerpt,
                  publishedDate: item.published_at,
                  slug: item.correlation_uuid,
                  tags: [],
                }}
              />
            ),
          )
        )}
        {items.length >= 1 && (
          <Group m="md" justify="center">
            <Pagination total={total_pages} current={current_page} />
          </Group>
        )}
      </Stack>
      <Element
        style={{marginTop: "1rem"}}
        type="cards"
        elements={pageElements}
      />
    </Container>
  );
}
