import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {ContainerForm} from "@/features/dashboard/runner/components/container-form";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("containers.breadcrumb.create"),
  };
}

async function NewContainerPage() {
  const {t} = await getServerDictionary();

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("containers.title"),
            href: APP_PATHS.dashboard.containers.index,
          },
          {
            label: t("containers.breadcrumb.create"),
            href: APP_PATHS.dashboard.containers.new,
          },
        ]}
      />
      <Box py="md">
        <ContainerForm />
      </Box>
    </Box>
  );
}

export default withPermissions(NewContainerPage, {
  requiredPermissions: ["runner.containers.create"],
});
