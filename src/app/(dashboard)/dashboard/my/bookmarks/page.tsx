import {Metadata} from "next";
import {Suspense} from "react";
import {Box, Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  UserBookmarksTable,
  UserBookmarksTableSkeleton,
} from "@/features/bookmarks/components";
import {withPermissions} from "@/components/with-authorization";

const title = "بوکمارک های من";

export const metadata: Metadata = {
  title: title,
};

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function MyBookmarksPage({searchParams}: Props) {
  const page = Number((await searchParams).page) || 1;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: title,
          },
        ]}
      />
      <Box>
        <Suspense
          key={JSON.stringify(await searchParams)}
          fallback={<UserBookmarksTableSkeleton />}
        >
          <UserBookmarksTable page={page} />
        </Suspense>
      </Box>
    </Stack>
  );
}

export default withPermissions(MyBookmarksPage, {
  requiredPermissions: ["self.bookmarks.index"],
});
