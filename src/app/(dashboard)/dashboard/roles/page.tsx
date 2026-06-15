import {Metadata} from "next";
import {Suspense} from "react";
import {Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {RolesTable, RolesTableSkeleton} from "@/features/roles/components";
import {withPermissions} from "@/components/with-authorization";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {title: t("roles.page.listTitle")};
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function RolesPage({searchParams}: Props) {
  const page = (await searchParams).page ?? 1;
  const {t} = await getServerDictionary();

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("roles.page.listTitle"),
          },
        ]}
      />
      <Suspense key={page} fallback={<RolesTableSkeleton />}>
        <RolesTable page={page} />
      </Suspense>
    </Stack>
  );
}

export default withPermissions(RolesPage, {
  requiredPermissions: ["roles.index"],
});
