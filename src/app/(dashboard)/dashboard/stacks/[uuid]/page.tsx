import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";
import {readScope} from "@/features/dashboard/workload/permissions";
import {StackDetail} from "@/features/dashboard/workload/stacks/components/stack-detail";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("stacks.breadcrumb.detail"),
  };
}

type Props = {
  params: Promise<{uuid: string}>;
};

async function StackPage({params}: Props) {
  const {t} = await getServerDictionary();
  const {uuid} = await params;

  // read as anybody's by whoever may see anybody's, as one's own otherwise.
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const scope = readScope(permissions, "stacks");

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {label: t("stacks.title"), href: APP_PATHS.dashboard.stacks.index},
          {
            label: t("stacks.breadcrumb.detail"),
            href: APP_PATHS.dashboard.stacks.detail(uuid),
          },
        ]}
      />
      <Box py="md">
        <StackDetail
          scope={scope}
          uuid={uuid}
          permissions={permissions}
          me={me}
          vmSource={await dockerVmSource(scope, permissions)}
        />
      </Box>
    </Box>
  );
}

export default withPermissions(StackPage, {
  requiredPermissions: ["workload.stacks.show", "self.workload.stacks.show"],
});
