import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {NoteCard} from "@/features/notes/components/note-card";
import {HashtagContentTabs} from "@/features/articles/components/hashtag-content-tabs";
import {
  fetchContentsByHashtag,
  type HashtagContentType,
} from "@/dal/public/hashtags";
import {Pagination} from "@/components/pagination";
import {NoContent} from "@/components/no-content";
import Element from "@/features/elements/element";
import {Group, Stack, Text} from "@mantine/core";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  params: Promise<{
    lang: string;
    hashtag?: string;
  }>;
  searchParams: Promise<{
    page?: number | string;
    tab?: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const hashtag = decodeURI(params.hashtag ?? "");
  const {t} = getDictionary(params.lang);

  return {
    title: t("articles.hashtags.metaTitle", {hashtag}),
  };
}

// The tab travels in `?tab`; the API calls the same thing `type`. Anything other
// than the two known tabs is left to the backend to default, rather than 400ing
// the page on a hand-edited query string.
function resolveRequestedTab(tab?: string): HashtagContentType | undefined {
  return tab === "article" || tab === "note" ? tab : undefined;
}

async function HashtagPage(props: Props) {
  const params = await props.params;
  const hashtag = params.hashtag;
  if (hashtag === undefined) {
    notFound();
  }

  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const {t} = getDictionary(params.lang);

  const {items, pagination, elements, totals, type} =
    await fetchContentsByHashtag(
      hashtag,
      page,
      resolveRequestedTab(searchParams.tab),
      params.lang,
    );
  const {total_pages, current_page} = pagination;
  const pageElements = elements ?? [];
  const tabTotals = {
    articles: totals?.articles ?? 0,
    notes: totals?.notes ?? 0,
  };
  // Which tab the backend served — the one asked for, or its fallback.
  const activeTab: HashtagContentType = type === "note" ? "note" : "article";

  // The hashtag has neither articles nor notes in the selected language: show a
  // friendly empty-content message rather than two empty tabs.
  if (tabTotals.articles === 0 && tabTotals.notes === 0) {
    return <NoContent />;
  }

  const contents = items.map((item: any) => {
    if (item.type === "note") {
      return (
        <NoteCard
          key={`note-${item.correlation_uuid}`}
          note={{
            correlationUuid: item.correlation_uuid,
            body: item.body,
            publishedDate: item.published_at,
            tags: item.tags ?? [],
            author: item.author,
          }}
        />
      );
    }

    return (
      <VerticalArticleCard
        key={`article-${item.correlation_uuid}`}
        article={{
          thumbnail: item.cover,
          title: item.title,
          subtitle: item.excerpt,
          publishedDate: item.published_at,
          slug: item.correlation_uuid,
          tags: [],
          author: item.author,
        }}
      />
    );
  });

  return (
    <>
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

      <HashtagContentTabs
        hashtag={hashtag}
        active={activeTab}
        totals={tabTotals}
      />

      {contents.length === 0 ? (
        <Text c="dimmed" ta="center" my="xl">
          {activeTab === "note"
            ? t("notes.list.empty")
            : t("articles.table.empty")}
        </Text>
      ) : (
        <Stack gap="md" mt="md">
          {contents}
        </Stack>
      )}

      {contents.length >= 1 && (
        <Group m="md" justify="center">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}

      <Element
        style={{marginTop: "1rem"}}
        type="cards"
        elements={pageElements}
      />
    </>
  );
}

export default HashtagPage;
