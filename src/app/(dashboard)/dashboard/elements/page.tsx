import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {
  ElementsTable,
  ElementsTableSkeleton,
} from "@/features/dashboard/elements/components/elements-table";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("elements.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function ElementsPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("elements.title"),
            href: APP_PATHS.dashboard.elements.index,
          },
        ]}
      />
      <Box py="md">
        <Suspense key={page} fallback={<ElementsTableSkeleton />}>
          <ElementsTable page={page ?? 1} />
        </Suspense>
      </Box>
    </Box>
  );
}

export default withPermissions(ElementsPage, {
  requiredPermissions: ["articles.index"],
});
