import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions} from "@/lib/auth";
import {ContainerForm} from "@/features/dashboard/workload/docker/components/container-form";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";
import {scopeFor} from "@/features/dashboard/workload/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("containers.breadcrumb.create"),
  };
}

async function NewContainerPage() {
  const {t} = await getServerDictionary();
  const permissions = (await getUserPermissions()) ?? [];

  // a container is always created for whoever asks, in one of their own VMs:
  // those are what is offered, and what is in them is read the way anything
  // of one's own is.
  const vmSource = await dockerVmSource("mine", permissions);
  const listScope = scopeFor(permissions, "containers", "index", true);

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
        <ContainerForm vmSource={vmSource} listScope={listScope} />
      </Box>
    </Box>
  );
}

export default withPermissions(NewContainerPage, {
  requiredPermissions: ["workload.containers.create"],
});
