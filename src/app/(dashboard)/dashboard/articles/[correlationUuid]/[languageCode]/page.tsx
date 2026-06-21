import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Stack, Paper, Alert} from "@mantine/core";
import {IconLanguage} from "@tabler/icons-react";
import {ArticleUpsertForm} from "@/features/articles/components/article-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {fetchArticleTranslation} from "@/dal/private/articles";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("articles.dashboard.editMetaTitle"),
  };
}

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

  const {t} = await getServerDictionary();

  let languages: Language[] = [];
  let defaultLanguageCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultLanguageCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if unavailable.
  }

  // When the selected language has no translation yet, offer to create one
  // under the same correlation group instead of rendering the not-found page.
  const article = await fetchArticleTranslation(correlationUuid, languageCode);
  const isMissingTranslation = article === null;

  const selectedLanguageName =
    languages.find((language) => language.code === languageCode)?.name ??
    languageCode;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("articles.dashboard.listCrumb"),
            href: APP_PATHS.dashboard.articles.index,
          },
          {
            label: isMissingTranslation
              ? t("articles.dashboard.newTranslationCrumb")
              : t("articles.dashboard.editCrumb"),
          },
        ]}
      />
      {isMissingTranslation && (
        <Alert
          color="blue"
          icon={<IconLanguage size={18} />}
          title={t("articles.form.missingTranslationTitle")}
        >
          {t("articles.form.missingTranslationText", {
            language: selectedLanguageName,
          })}
        </Alert>
      )}
      <Paper p="md" withBorder>
        <ArticleUpsertForm
          mode={isMissingTranslation ? "create" : "update"}
          correlationUuid={correlationUuid}
          languageCode={languageCode}
          languages={languages}
          defaultLanguageCode={defaultLanguageCode}
          article={
            isMissingTranslation
              ? undefined
              : {
                  defaultTitle: article.title,
                  defaultExcerpt: article.excerpt,
                  defaultHashtags: article.tags,
                  defaultBody: article.body,
                  defaultCover: article.cover,
                  defaultVideo: article.video,
                  defaultPublishedAt: article.published_at,
                }
          }
        />
      </Paper>
    </Stack>
  );
}

export default withPermissions(ArticleDetalPage, {
  requiredPermissions: ["articles.show", "articles.update"],
  operator: "AND",
});
