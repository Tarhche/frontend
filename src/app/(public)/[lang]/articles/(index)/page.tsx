import {type Metadata} from "next";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {fetchArticles} from "@/dal/public/articles";
import {Pagination} from "@/components/pagination";
import {NoContent} from "@/components/no-content";
import Element from "@/features/elements/element";
import {Group} from "@mantine/core";

type Props = {
  params: Promise<{
    lang: string;
  }>;
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
  const {lang} = await props.params;
  const page = Number((await props.searchParams).page) || 1;
  const {items, pagination, elements} = await fetchArticles({
    params: {
      page: page,
      language_code: lang,
    },
  });
  const {total_pages, current_page} = pagination;
  const pageElements = elements ?? [];

  // No published articles in the selected language: show a friendly
  // empty-content message.
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

export default ArticlesPage;
