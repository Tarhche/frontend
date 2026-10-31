import {type Metadata} from "next";
import {unstable_rethrow} from "next/navigation";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {DALDriverError} from "@/dal/dal-driver-error";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {fetchSnapshots} from "@/features/dashboard/workload/snapshots/dal";
import {snapshotScope} from "@/features/dashboard/workload/snapshots/permissions";
import {
  type SnapshotChoice,
  VmCreateForm,
} from "@/features/dashboard/workload/vms/components/vm-form";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("vms.breadcrumb.create"),
  };
}

type Props = {
  searchParams: Promise<{
    // the snapshot it was opened to restore, as "restore as a new VM" does.
    snapshot?: string;
  }>;
};

/**
 * The person's own snapshots that are ready to restore from. They are what
 * the form offers to start from, and the form is no less useful without them,
 * so a listing the API cannot give is no reason not to show it.
 */
async function readySnapshots(): Promise<SnapshotChoice[]> {
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const scope = snapshotScope(permissions, "index", true);
  if (scope === null) {
    return [];
  }

  try {
    const page = await fetchSnapshots(scope);

    return (page.items ?? [])
      .filter(
        (snapshot) =>
          snapshot.state === "ready" &&
          (scope === "mine" || snapshot.owner_uuid === me),
      )
      .map((snapshot) => ({
        uuid: snapshot.uuid,
        name: snapshot.name,
        kind: snapshot.kind,
        disk: snapshot.disk,
        image: snapshot.image,
        vm_name: snapshot.vm_name,
      }));
  } catch (error) {
    if (error instanceof DALDriverError) {
      return [];
    }

    unstable_rethrow(error);

    return [];
  }
}

async function NewVmPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {snapshot} = await searchParams;
  const snapshots = await readySnapshots();

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {label: t("vms.title"), href: APP_PATHS.dashboard.vms.index},
          {
            label: t("vms.breadcrumb.create"),
            href: APP_PATHS.dashboard.vms.new,
          },
        ]}
      />
      <Box py="md">
        <VmCreateForm snapshots={snapshots} snapshotUuid={snapshot ?? null} />
      </Box>
    </Box>
  );
}

export default withPermissions(NewVmPage, {
  requiredPermissions: ["workload.vms.create"],
});
