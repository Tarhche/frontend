import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions} from "@/lib/auth";
import {ContainerDetail} from "@/features/dashboard/workload/docker/components/container-detail";
import {shortId} from "@/features/dashboard/workload/docker/format";
import {
  containerScope,
  dockerMay,
} from "@/features/dashboard/workload/docker/permissions";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";
import {stacksVisible} from "@/features/dashboard/workload/stacks/permissions";

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

  // somebody trusted with everybody's containers asks for this one as
  // anybody's; somebody trusted with only their own asks for it as theirs,
  // and is told it is not there when it is not theirs.
  const permissions = (await getUserPermissions()) ?? [];
  const scope = containerScope(permissions);

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
          may={dockerMay(permissions, scope)}
          vmSource={await dockerVmSource(scope, permissions)}
          stacksVisible={stacksVisible(permissions, scope)}
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
