import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Container, Group, Stack, Text} from "@mantine/core";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {AuthorHeader} from "@/features/authors/components";
import {Pagination} from "@/components/pagination";
import {fetchAuthorArticles} from "@/dal/public/authors";

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
      params: {language_code: params.lang},
    });
    const name =
      data?.author?.name || data?.author?.username || params.identity;
    return {
      title: `مقاله‌های ${name}`,
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

  let data: any;
  try {
    data = await fetchAuthorArticles(resolveIdentity(params.identity!), {
      params: {page, language_code: params.lang},
    });
  } catch {
    notFound();
  }

  const {author, items, pagination} = data;
  const {total_pages, current_page} = pagination;

  return (
    <Container size="sm" mt={50}>
      <AuthorHeader author={author} />
      <Stack gap={"md"} mt={"lg"}>
        {items.length === 0 ? (
          <Text c={"dimmed"} ta={"center"} mt={"xl"}>
            هنوز مقاله‌ای منتشر نشده است
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
    </Container>
  );
}
