import {notFound} from "next/navigation";
import {Stack, Paper} from "@mantine/core";
import {ArticleUpsertForm} from "@/features/articles/components/article-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {fetchArticle} from "@/dal/private/articles";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";

export const metadata = {
  title: "جزییات مقاله",
};

type Props = {
  params: Promise<{
    correlationUuid?: string;
    languageCode?: string;
  }>;
};

async function ArticleDetalPage({params}: Props) {
  const {correlationUuid, languageCode} = await params;
  if (!correlationUuid || !languageCode) {
    notFound();
  }

  let languages: Language[] = [];
  let defaultCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if unavailable.
  }

  // A missing translation (404) renders the dashboard not-found page via the
  // DAL interceptor — no need to handle it here.
  const article = await fetchArticle(correlationUuid, languageCode);

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
          mode="update"
          correlationUuid={correlationUuid}
          languageCode={languageCode}
          languages={languages}
          defaultCode={defaultCode}
          article={{
            defaultTitle: article.title,
            defaultExcerpt: article.excerpt,
            defaultHashtags: article.tags,
            defaultBody: article.body,
            defaultCover: article.cover,
            defaultVideo: article.video,
            defaultPublishedAt: article.published_at,
          }}
        />
      </Paper>
    </Stack>
  );
}

export default withPermissions(ArticleDetalPage, {
  requiredPermissions: ["articles.show", "articles.update"],
  operator: "AND",
});
