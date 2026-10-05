import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {ContainerDetail} from "@/features/dashboard/workload/docker/components/container-detail";
import {shortId} from "@/features/dashboard/workload/docker/format";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";
import {readScope} from "@/features/dashboard/workload/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("containers.breadcrumb.detail"),
  };
}

type Props = {
  params: Promise<{vmUuid: string; id: string}>;
};

async function ContainerPage({params}: Props) {
  const {t} = await getServerDictionary();
  const {vmUuid, id} = await params;

  // read as anybody's by whoever may see anybody's, as one's own otherwise.
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const scope = readScope(permissions, "containers");

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("containers.title"),
            href: APP_PATHS.dashboard.containers.index,
          },
          {
            label: shortId(id),
            href: APP_PATHS.dashboard.containers.detail(vmUuid, id),
          },
        ]}
      />
      <Box py="md">
        <ContainerDetail
          scope={scope}
          vmUuid={vmUuid}
          id={id}
          permissions={permissions}
          me={me}
          vmSource={await dockerVmSource(scope, permissions)}
        />
      </Box>
    </Box>
  );
}

export default withPermissions(ContainerPage, {
  requiredPermissions: [
    "workload.containers.show",
    "self.workload.containers.show",
  ],
});
