import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {ScopeSwitch} from "@/components/scope-switch";
import {
  StacksTable,
  StacksTableSkeleton,
} from "@/features/dashboard/runner/components/stacks-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("stacks.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function StacksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  const permissions = (await getUserPermissions()) ?? [];
  const canSeeAll = hasPermission(permissions, [
    PERMISSIONS.runner.stacks.INDEX,
  ]);
  const canSeeMine = hasPermission(permissions, [
    PERMISSIONS.self.runner.stacks.INDEX,
  ]);

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("stacks.title"),
            href: APP_PATHS.dashboard.stacks.index,
          },
        ]}
      />
      <Box py="md">
        <ScopeSwitch
          canSeeAll={canSeeAll}
          canSeeMine={canSeeMine}
          labels={{
            all: t("stacks.tabs.allStacks"),
            mine: t("stacks.tabs.myStacks"),
          }}
          all={
            <Suspense key={`all-${page}`} fallback={<StacksTableSkeleton />}>
              <StacksTable page={page ?? 1} />
            </Suspense>
          }
          mine={
            <Suspense key={`mine-${page}`} fallback={<StacksTableSkeleton />}>
              <StacksTable page={page ?? 1} scope="mine" />
            </Suspense>
          }
        />
      </Box>
    </Box>
  );
}

export default withPermissions(StacksPage, {
  requiredPermissions: ["runner.stacks.index", "self.runner.stacks.index"],
});
