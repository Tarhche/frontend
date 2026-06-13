import {type Metadata} from "next";
import {Box, Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {ArticleUpsertForm} from "@/features/articles/components/article-upsert-form";
import {withPermissions} from "@/components/with-authorization";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";

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
          mode="create"
          languages={languages}
          defaultCode={defaultCode}
        />
      </Paper>
    </Box>
  );
}

export default withPermissions(NewArticlesPage, {
  requiredPermissions: ["articles.create"],
});
