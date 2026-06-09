import {notFound} from "next/navigation";
import {Stack, Paper} from "@mantine/core";
import {ArticleUpsertForm} from "@/features/articles/components/article-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {fetchArticle, fetchAllArticles} from "@/dal/private/articles";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";

export const metadata = {
  title: "جزییات مقاله",
};

type Props = {
  params: Promise<{
    uuid?: string;
  }>;
};

async function ArticleDetalPage({params}: Props) {
  const articleId = (await params).uuid;
  if (articleId === undefined) {
    notFound();
  }

  const article = await fetchArticle(articleId);

  let languages: Language[] = [];
  let defaultCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if unavailable.
  }

  let connectableArticles: {uuid: string; title: string}[] = [];
  try {
    const data = await fetchAllArticles({params: {page: 1}});
    connectableArticles = (data.items ?? [])
      .filter((a: any) => a.uuid !== articleId)
      .map((a: any) => ({uuid: a.uuid, title: a.title}));
  } catch {
    // Fail open: the connect-to-article picker is just empty.
  }

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: "مقاله ها",
            href: APP_PATHS.dashboard.articles.index,
          },
          {
            label: "ویرایش مقاله",
          },
        ]}
      />
      <Paper p="md" withBorder>
        <ArticleUpsertForm
          article={{
            defaultTitle: article.title,
            articleId: article.uuid,
            defaultExcerpt: article.excerpt,
            defaultHashtags: article.tags,
            defaultBody: article.body,
            defaultCover: article.cover,
            defaultVideo: article.video,
            defaultPublishedAt: article.published_at,
            defaultLanguageCode: article.language_code ?? defaultCode,
            defaultCorrelationUuid: article.correlation_id ?? "",
          }}
          languages={languages}
          defaultCode={defaultCode}
          connectableArticles={connectableArticles}
        />
      </Paper>
    </Stack>
  );
}

export default withPermissions(ArticleDetalPage, {
  requiredPermissions: ["articles.show", "articles.update"],
  operator: "AND",
});
