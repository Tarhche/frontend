import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {DashboardScopeTabs} from "@/components/dashboard-scope-tabs";
import {
  CommentsTable,
  CommentsTableSkeleton,
} from "@/features/comments/components/article-comments";
import {
  UserCommentsTable,
  UserCommentsTableSkeleton,
} from "@/features/comments/components/user-comments-table";
import {withPermissions} from "@/components/with-authorization";
import {APP_PATHS} from "@/lib/app-paths";
import {accessibleScopes} from "@/lib/dashboard-scope/server";
import {resolveScope} from "@/lib/dashboard-scope/shared";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();

  return {
    title: t("comments.dashboard.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
    // Matches `SCOPE_PARAM`; names the tab to open.
    scope?: string;
  }>;
};

async function CommentsPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page, scope: requestedScope} = await searchParams;

  // Every user's comments and the caller's own share this page; a scope the
  // caller has no permission for gets no tab.
  const scopes = await accessibleScopes({
    all: "comments.index",
    own: "self.comments.index",
  });
  const scope = resolveScope(requestedScope, scopes);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("comments.dashboard.title"),
            href: APP_PATHS.dashboard.comments.index,
          },
        ]}
      />
      <DashboardScopeTabs
        active={scope}
        tabs={scopes.map((value) => ({
          scope: value,
          label: t(`comments.dashboard.tabs.${value}`),
          href: APP_PATHS.dashboard.comments.list(value),
        }))}
      />
      <Box mt={"md"}>
        <Suspense
          key={JSON.stringify({scope, page})}
          fallback={
            scope === "own" ? (
              <UserCommentsTableSkeleton />
            ) : (
              <CommentsTableSkeleton />
            )
          }
        >
          {/* The two scopes read different APIs and show different columns —
              approval state and delete-own for the caller's comments, the
              author and moderation actions for everybody's. */}
          {scope === "own" ? (
            <UserCommentsTable page={page ?? 1} />
          ) : (
            <CommentsTable page={page ?? 1} />
          )}
        </Suspense>
      </Box>
    </Box>
  );
}

export default withPermissions(CommentsPage, {
  requiredPermissions: ["comments.index", "self.comments.index"],
});
