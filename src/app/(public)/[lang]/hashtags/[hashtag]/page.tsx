import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {fetchAllArticlesByHashtag} from "@/dal/public/hashtags";
import {Pagination} from "@/components/pagination";
import {NoContent} from "@/components/no-content";
import Element from "@/features/elements/element";
import {Group} from "@mantine/core";

type Props = {
  params: Promise<{
    lang: string;
    hashtag?: string;
  }>;
  searchParams: Promise<{
    page?: number | string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const hashtag = decodeURI(params.hashtag ?? "");

  return {
    title: `${hashtag} | تگ ها`,
  };
}

async function HashtagPage(props: Props) {
  const params = await props.params;
  const hashtag = params.hashtag;
  if (hashtag === undefined) {
    notFound();
  }

  const page = Number((await props.searchParams).page) || 1;
  const {items, pagination, elements} = await fetchAllArticlesByHashtag(
    hashtag,
    page,
    params.lang,
  );
  const {total_pages, current_page} = pagination;
  const pageElements = elements ?? [];

  // No published articles for this hashtag in the selected language: show a
  // friendly empty-content message.
  if (items.length === 0) {
    return <NoContent />;
  }

  const articles = items.map((article: any) => {
    return (
      <VerticalArticleCard
        key={article.correlation_uuid}
        article={{
          thumbnail: article.cover,
          title: article.title,
          subtitle: article.excerpt,
          publishedDate: article.published_at,
          slug: article.correlation_uuid,
          tags: [],
          author: article.author,
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

      {articles}

      {articles.length >= 1 && (
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
