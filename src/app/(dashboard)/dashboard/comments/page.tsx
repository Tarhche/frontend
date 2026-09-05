import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  CommentsTable,
  CommentsTableSkeleton,
} from "@/features/comments/components/article-comments";
import {
  UserCommentsTable,
  UserCommentsTableSkeleton,
} from "@/features/comments/components/user-comments-table";
import {withPermissions} from "@/components/with-authorization";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {ScopeSwitch} from "@/components/scope-switch";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();

  return {
    title: t("comments.dashboard.allTitle"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function CommentsPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [PERMISSIONS.comments.INDEX]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.comments.INDEX,
  ]);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("comments.dashboard.allTitle"),
            href: APP_PATHS.dashboard.comments.index,
          },
        ]}
      />
      <Box mt={"md"}>
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("comments.tabs.allComments"),
            mine: t("comments.tabs.myComments"),
          }}
          all={
            <Suspense key={`all-${page}`} fallback={<CommentsTableSkeleton />}>
              <CommentsTable page={page ?? 1} />
            </Suspense>
          }
          mine={
            <Suspense
              key={`mine-${page}`}
              fallback={<UserCommentsTableSkeleton />}
            >
              <UserCommentsTable page={Number(page) || 1} />
            </Suspense>
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(CommentsPage, {
  requiredPermissions: ["comments.index", "self.comments.index"],
});
