import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions} from "@/lib/auth";
import {dockerVmSource} from "@/features/dashboard/workload/docker/server";
import {StackDetail} from "@/features/dashboard/workload/stacks/components/stack-detail";
import {
  stackMay,
  stackScope,
} from "@/features/dashboard/workload/stacks/permissions";

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

  // somebody trusted with everybody's stacks asks for this one as anybody's;
  // somebody trusted with only their own asks for it as theirs, and is told
  // it is not there when it is not theirs.
  const permissions = (await getUserPermissions()) ?? [];
  const scope = stackScope(permissions);

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
          may={stackMay(permissions, scope)}
          vmSource={await dockerVmSource(scope, permissions)}
        />
      </Box>
    </Box>
  );
}

export default withPermissions(StackPage, {
  requiredPermissions: ["workload.stacks.show", "self.workload.stacks.show"],
});
