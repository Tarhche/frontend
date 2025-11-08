import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {fetchAllArticlesByHashtag} from "@/dal/public/hashtags";
import { Pagination } from "@/components/pagination";
import { Group } from "@mantine/core";

type Props = {
  params: Promise<{
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
  const {items, pagination} = await fetchAllArticlesByHashtag(hashtag, page);
  const {total_pages, current_page} = pagination;

  const articles = items.map((article: any) => {
    return (
      <VerticalArticleCard
        key={article.uuid}
        article={{
          thumbnail: article.cover,
          title: article.title,
          subtitle: article.excerpt,
          publishedDate: article.published_at,
          slug: article.uuid,
          tags: [],
        }}
      />
    );
  });

  return (
    <>
      {articles}

      {articles.length >= 1 && (
        <Group m="md" justify="center">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}

export default HashtagPage;
