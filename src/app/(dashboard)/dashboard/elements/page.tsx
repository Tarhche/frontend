import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {APP_PATHS} from "@/lib/app-paths";
import {
  ElementsTable,
  ElementsTableSkeleton,
} from "@/features/dashboard/elements/components/elements-table";

export const metadata: Metadata = {
  title: "مقاله ها",
};

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function ElementsPage({searchParams}: Props) {
  const {page} = await searchParams;

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: "المان ها",
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
