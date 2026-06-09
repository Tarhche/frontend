import {type Metadata} from "next";
import {Suspense} from "react";
import {notFound} from "next/navigation";
import {Container, Box, Group, Title} from "@mantine/core";
import {IconMessage} from "@tabler/icons-react";
import {
  Content,
  Comments,
  CommentsSkeleton,
} from "@/features/articles/components/article-detail";
import {NotFound} from "@/components/not-found";
import {fetchArticleByUUID} from "@/dal/public/articles";

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

  const article = await fetchArticleByUUID(slug, params.lang);

  return article ? {title: `${article.title}`} : null;
}

async function ArticleDetailPage(props: Props) {
  const params = await props.params;
  const {slug, lang} = params;

  if (slug === undefined) {
    notFound();
  }

  const article = await fetchArticleByUUID(slug!, lang);

  // The article has no translation for this language: render not-found as plain
  // content (no thrown notFound mid-stream, so it can't get stuck on loading).
  if (!article) {
    return (
      <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
        <NotFound
          title="مقاله یافت نشد"
          text="این مقاله در زبان انتخاب‌شده موجود نیست."
        />
      </Container>
    );
  }

  // Bookmarks and comments belong to the article group, so they are keyed by the
  // correlation uuid (shared across translations), not the per-language uuid.
  const correlationUUID = article.correlation_uuid ?? slug!;

  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <Content article={article} correlationUUID={correlationUUID} />
      <Box mt={"xl"}>
        <Group align="center" gap={"sm"}>
          <IconMessage />
          <Title ta={"right"} order={3}>
            دیدگاه ها
          </Title>
        </Group>
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments uuid={correlationUUID} />
        </Suspense>
      </Box>
    </Container>
  );
}

export default ArticleDetailPage;
