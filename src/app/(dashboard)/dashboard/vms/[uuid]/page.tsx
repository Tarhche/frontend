import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {readScope} from "@/features/dashboard/workload/permissions";
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

  // read as anybody's by whoever may see anybody's, as one's own otherwise.
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const scope = readScope(permissions, "vms");

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
