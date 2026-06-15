import {Metadata} from "next";
import {Suspense} from "react";
import {Box, Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  UserBookmarksTable,
  UserBookmarksTableSkeleton,
} from "@/features/bookmarks/components";
import {withPermissions} from "@/components/with-authorization";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("bookmarks.page.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function MyBookmarksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const page = Number((await searchParams).page) || 1;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("bookmarks.page.title"),
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
