import {type Metadata} from "next";
import {Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {FilesList} from "@/features/files/components";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {title: t("files.title")};
}

async function FilesPage() {
  const {t} = await getServerDictionary();
  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("files.title"),
          },
        ]}
      />
      <FilesList />
    </Stack>
  );
}

export default withPermissions(FilesPage, {
  requiredPermissions: ["files.index", "self.files.index"],
});
