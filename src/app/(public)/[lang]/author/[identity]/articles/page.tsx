import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Container, Group, Stack, Text} from "@mantine/core";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {AuthorHeader} from "@/features/authors/components";
import {Pagination} from "@/components/pagination";
import Element from "@/features/elements/element";
import {fetchAuthorArticles} from "@/dal/public/authors";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  params: Promise<{
    lang: string;
    identity?: string;
  }>;
  searchParams: Promise<{
    page?: number | string;
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

export default async function AuthorArticlesPage(props: Props) {
  const params = await props.params;
  if (!params.identity) {
    notFound();
  }

  const page = Number((await props.searchParams).page) || 1;
  const {t} = getDictionary(params.lang);

  let data: any;
  try {
    data = await fetchAuthorArticles(resolveIdentity(params.identity!), {
      params: {page},
      headers: {[LANGUAGE_CODE_HEADER]: params.lang},
    });
  } catch {
    notFound();
  }

  const {author, items, pagination, elements} = data;
  const {total_pages, current_page} = pagination;
  const pageElements = elements ?? [];

  return (
    <Container size="sm" mt={50}>
      <AuthorHeader author={author} />
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
            {t("authors.noArticles")}
          </Text>
        ) : (
          items.map((article: any) => (
            <VerticalArticleCard
              key={article.correlation_uuid}
              article={{
                thumbnail: article.cover,
                title: article.title,
                subtitle: article.excerpt,
                publishedDate: article.published_at,
                slug: article.correlation_uuid,
                tags: [],
              }}
            />
          ))
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
