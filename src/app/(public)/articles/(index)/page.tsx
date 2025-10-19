import {type Metadata} from "next";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {fetchArticles} from "@/dal/public/articles";
import { Pagination } from "@/components/pagination";
import { Group } from "@mantine/core";

type Props = {
  searchParams: Promise<{
    page?: number | string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `مقاله ها`,
  };
}

async function ArticlesPage(props: Props) {
  const page = Number((await props.searchParams).page) || 1;
  const {items, pagination} = await fetchArticles({
    params: {
      page: page,
    },
  });
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

export default ArticlesPage;
