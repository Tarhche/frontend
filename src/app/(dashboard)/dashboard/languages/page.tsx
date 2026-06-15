import {Metadata} from "next";
import {Suspense} from "react";
import {Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  LanguagesTable,
  LanguagesTableSkeleton,
} from "@/features/languages/components";
import {withPermissions} from "@/components/with-authorization";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("languages.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function LanguagesPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const page = (await searchParams).page ?? 1;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("languages.title"),
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
