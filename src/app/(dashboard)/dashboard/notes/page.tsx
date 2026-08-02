import {type Metadata} from "next";
import {Suspense} from "react";
import {cookies} from "next/headers";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {DashboardScopeTabs} from "@/components/dashboard-scope-tabs";
import {
  NotesTable,
  NotesTableSkeleton,
} from "@/features/notes/components/notes-table";
import {APP_PATHS} from "@/lib/app-paths";
import {accessibleScopes} from "@/lib/dashboard-scope/server";
import {resolveScope} from "@/lib/dashboard-scope/shared";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("notes.dashboard.listMetaTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
    // Matches `SCOPE_PARAM`; names the tab to open.
    scope?: string;
  }>;
};

async function NotesPage({searchParams}: Props) {
  const {page, scope: requestedScope} = await searchParams;
  const {t} = await getServerDictionary();

  // Everybody's notes and the caller's own share this page; a scope the caller
  // has no permission for gets no tab.
  const scopes = await accessibleScopes({
    all: "notes.index",
    own: "self.notes.index",
  });
  const scope = resolveScope(requestedScope, scopes);

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
            label: t("notes.dashboard.listCrumb"),
            href: APP_PATHS.dashboard.notes.index,
          },
        ]}
      />
      <DashboardScopeTabs
        active={scope}
        tabs={scopes.map((value) => ({
          scope: value,
          label: t(`notes.dashboard.tabs.${value}`),
          href: APP_PATHS.dashboard.notes.list(value),
        }))}
      />
      <Box py="md">
        <Suspense
          key={`${scope}-${page}-${languageCode}`}
          fallback={<NotesTableSkeleton />}
        >
          <NotesTable
            page={page ?? 1}
            languageCode={languageCode}
            scope={scope}
          />
        </Suspense>
      </Box>
    </Box>
  );
}

export default withPermissions(NotesPage, {
  requiredPermissions: ["notes.index", "self.notes.index"],
});
