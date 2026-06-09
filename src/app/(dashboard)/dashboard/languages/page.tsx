import {Metadata} from "next";
import {Suspense} from "react";
import {Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  LanguagesTable,
  LanguagesTableSkeleton,
} from "@/features/languages/components";
import {withPermissions} from "@/components/with-authorization";

const PAGE_TITLE = "زبان ها";

export const metadata: Metadata = {
  title: PAGE_TITLE,
};

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function LanguagesPage({searchParams}: Props) {
  const page = (await searchParams).page ?? 1;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: PAGE_TITLE,
          },
        ]}
      />
      <Suspense key={page} fallback={<LanguagesTableSkeleton />}>
        <LanguagesTable page={page} />
      </Suspense>
    </Stack>
  );
}

export default withPermissions(LanguagesPage, {
  requiredPermissions: ["languages.index"],
});
