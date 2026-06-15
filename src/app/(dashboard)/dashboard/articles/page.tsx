import {type Metadata} from "next";
import {Suspense} from "react";
import {cookies} from "next/headers";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  ArticlesTable,
  ArticlesTableSkeleton,
} from "@/features/articles/components/articles-table";
import {APP_PATHS} from "@/lib/app-paths";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("articles.dashboard.listMetaTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function ArticlesPage({searchParams}: Props) {
  const {page} = await searchParams;
  const {t} = await getServerDictionary();

  const cookieStore = await cookies();
  const languageCode =
    (await resolvePreferredLanguageCode({
      accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
      cookieLanguage: cookieStore.get(LANGUAGE_COOKIE_NAME)?.value,
    })) ?? "";

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("articles.dashboard.listCrumb"),
            href: APP_PATHS.dashboard.articles.index,
          },
        ]}
      />
      <Box py="md">
        <Suspense
          key={`${page}-${languageCode}`}
          fallback={<ArticlesTableSkeleton />}
        >
          <ArticlesTable page={page ?? 1} languageCode={languageCode} />
        </Suspense>
      </Box>
    </Box>
  );
}

export default withPermissions(ArticlesPage, {
  requiredPermissions: ["articles.index"],
});
