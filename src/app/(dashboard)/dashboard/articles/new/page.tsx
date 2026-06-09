import {type Metadata} from "next";
import {Box, Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {ArticleUpsertForm} from "@/features/articles/components/article-upsert-form";
import {withPermissions} from "@/components/with-authorization";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {fetchAllArticles} from "@/dal/private/articles";

export const metadata: Metadata = {
  title: "مقاله جدید",
};

async function NewArticlesPage() {
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
    connectableArticles = (data.items ?? []).map((a: any) => ({
      uuid: a.uuid,
      title: a.title,
    }));
  } catch {
    // Fail open: the connect-to-article picker is just empty.
  }

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: "مقاله ها",
            href: APP_PATHS.dashboard.articles.index,
          },
          {
            label: "مقاله جدید",
          },
        ]}
      />
      <Paper p={"md"} mt={"md"} withBorder>
        <ArticleUpsertForm
          languages={languages}
          defaultCode={defaultCode}
          connectableArticles={connectableArticles}
        />
      </Paper>
    </Box>
  );
}

export default withPermissions(NewArticlesPage, {
  requiredPermissions: ["articles.create"],
});
