import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {getUserPermissions, getUserUuid, hasPermission} from "@/lib/auth";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {fetchVm} from "@/features/dashboard/workload/vms/dal";
import {VmDetail} from "@/features/dashboard/workload/vms/components/vm-detail";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("vms.breadcrumb.detail"),
  };
}

type Props = {
  params: Promise<{uuid: string}>;
};

async function VmPage({params}: Props) {
  const {t} = await getServerDictionary();
  const {uuid} = await params;

  // Somebody trusted with everybody's VMs asks for this one as anybody's;
  // somebody trusted with only their own asks for it as theirs, and is told it
  // does not exist when it is not.
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const scope: Scope = hasPermission(permissions, [
    PERMISSIONS.workload.vms.SHOW,
  ])
    ? "all"
    : "mine";

  const vm = await fetchVm(scope, uuid);
  if (!vm) {
    notFound();
  }

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {label: t("vms.title"), href: APP_PATHS.dashboard.vms.index},
          {label: vm.name, href: APP_PATHS.dashboard.vms.detail(uuid)},
        ]}
      />
      <VmDetail initial={vm} scope={scope} permissions={permissions} me={me} />
    </Box>
  );
}

export default withPermissions(VmPage, {
  requiredPermissions: ["workload.vms.show", "self.workload.vms.show"],
});
