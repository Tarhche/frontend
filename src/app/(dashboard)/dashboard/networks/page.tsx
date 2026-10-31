import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {DockerObjectsScopes} from "@/features/dashboard/workload/docker/components/docker-objects/docker-objects-scopes";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("networks.title"),
  };
}

type Props = {
  searchParams: Promise<{
    vm?: string;
  }>;
};

async function NetworksPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {vm} = await searchParams;

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("networks.title"),
            href: APP_PATHS.dashboard.networks.index,
          },
        ]}
      />
      <Box py="md">
        <DockerObjectsScopes objects="networks" initialVm={vm} />
      </Box>
    </Box>
  );
}

export default withPermissions(NetworksPage, {
  requiredPermissions: [
    "workload.containers.index",
    "self.workload.containers.index",
  ],
});
